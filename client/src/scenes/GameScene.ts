import Phaser from 'phaser';
import Tower from '../objects/towers/Tower';
import { UIManager } from '../managers/UIManager';
import EnemyManager from '../managers/EnemyManager';
import ProjectileManager from '../managers/ProjectileManager';
import CollisionManager from '../managers/CollisionManager';
import CoinManager from '../managers/CoinManager';
import { UpgradeManager } from '../managers/UpgradeManager';
import { WaveManager } from '../managers/WaveManager';
import { WaveIndicator } from '../ui/components/WaveIndicator';
import { WaveClearEffect } from '../ui/components/WaveClearEffect';
import AudioManager from '../managers/AudioManager';
import { IGameScene } from '../types/IGameScene';
import { ScreenManager } from '../managers/ScreenManager';

export default class GameScene extends Phaser.Scene implements IGameScene {
    // Game objects
    public tower!: Tower;
    public uiManager!: UIManager;
    public upgradeManager!: UpgradeManager;
    public screenManager!: ScreenManager;
    enemyManager!: EnemyManager;
    projectileManager!: ProjectileManager;
    collisionManager!: CollisionManager;
    coinManager!: CoinManager;
    waveManager!: WaveManager;
    waveIndicator!: WaveIndicator;
    waveClearEffect!: WaveClearEffect;
    coins!: number;
    socket!: WebSocket;
    audioManager!: AudioManager;
    private coinRewardMultiplier: number = 1;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload(): void {
        // Создаем текстуру частицы
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('particle', 8, 8);
        graphics.destroy();
    }

    create(): void {
        // Initialize ScreenManager first
        this.screenManager = new ScreenManager(this);
        
        // Создаем черный прямоугольник на весь экран
        const { width, height } = this.screenManager.getScreenSize();
        const fadeRect = this.add.rectangle(0, 0, width, height, 0x000000, 1);
        fadeRect.setOrigin(0);

        // Анимируем появление
        this.tweens.add({
            targets: fadeRect,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                fadeRect.destroy();
            }
        });
        
        // Initial setup
        this.setupGameView();
        
        // Initialize AudioManager
        this.audioManager = AudioManager.getInstance(this);
        this.audioManager.playMusic();

        // Подписываемся на изменение размера экрана
        this.events.on('screenResize', this.handleScreenResize, this);
    }

    private handleScreenResize(gameScale: number): void {
        // Обновляем фон
        this.screenManager.setupBackground();
    }

    private setupGameView(): void {
        // Создаем фон через ScreenManager
        this.screenManager.setupBackground();

        // Получаем центр экрана и масштаб
        const center = this.screenManager.getScreenCenter();
        const gameScale = this.screenManager.getGameScale();

        // Создаем башню с меньшим размером
        this.tower = new Tower(this, center.x, center.y, 'tower');
        this.tower.setName('tower');
        this.tower.setAlpha(0);

        // Анимация появления башни
        this.tweens.add({
            targets: this.tower,
            alpha: 1,
            duration: 800,
            ease: 'Power2.out',
            onStart: () => {
                let amplitude = 8;
                let direction = 1;
                
                const moveTimer = this.time.addEvent({
                    delay: 50,
                    callback: () => {
                        if (amplitude > 0.5) {
                            this.tower.x = center.x + (direction * amplitude);
                            direction *= -1;
                            amplitude *= 0.8;
                        } else {
                            moveTimer.destroy();
                            this.tower.x = center.x;
                            this.initializeManagers();
                        }
                    },
                    repeat: 15
                });
            }
        });
    }

    private initializeManagers(): void {
        // Initialize WaveManager
        this.waveManager = new WaveManager(this);

        // Подписываемся на событие завершения волны для отображения эффекта
        this.waveManager.on('waveComplete', (waveNumber: number) => {
            // Создаем и показываем эффект "Wave Clear"
            this.waveClearEffect = new WaveClearEffect(this, this.tower);
            this.waveClearEffect.show(waveNumber);
        });

        // Initialize UpgradeManager
        this.upgradeManager = new UpgradeManager(this);

        // Initialize UIManager after the tower is created
        this.uiManager = new UIManager(
            this,
            () => this.scene.pause(),
            () => console.log('Upgrade clicked'),
            () => console.log('Settings clicked'),
            () => console.log('Shop clicked'),
            this.upgradeManager,
            this.screenManager
        );

        // Initialize CoinManager
        this.coinManager = new CoinManager(this, this.uiManager);

        // Initialize other managers
        this.enemyManager = new EnemyManager(this, this.uiManager, this.coinManager, this.waveManager);
        this.projectileManager = new ProjectileManager(this, this.enemyManager);
        this.collisionManager = new CollisionManager(this);

        // Initialize WaveIndicator
        this.waveIndicator = new WaveIndicator(this, this.waveManager, 10, 10);

        // Initialize WebSocket connection
        this.initializeWebSocket();
    }

    private initializeWebSocket(): void {
        const urlParams = new URLSearchParams(window.location.search);
        const telegramId = urlParams.get('telegram_id');

        if (!telegramId) {
            console.error('No telegram_id provided in URL');
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host = window.location.hostname;
        const port = window.location.port;
        // Если порт не указан в URL, используем порт из конфига или 8080
        const wsPort = port || (process.env.SERVER_PORT || '8080');
        const wsUrl = port ? `${protocol}://${host}:${wsPort}/ws` : `${protocol}://${host}/ws`;

        this.socket = new WebSocket(`${wsUrl}?telegram_id=${telegramId}`);

        this.socket.onopen = () => {
            console.log('Connected to game server');
        };

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleServerMessage(message);
        };

        this.socket.onclose = () => {
            // Connection closed
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleServerMessage(message: any): void {
        if (message.new_state) {
            this.updateGameState(message.game_id, message.new_state);
        }
    }

    updateGameState(gameId: number, newState: string): void {
        console.log(`Game ${gameId} state updated to: ${newState}`);
    }

    update(time: number, delta: number): void {
        // Проверяем, инициализированы ли все необходимые менеджеры
        if (!this.waveManager || !this.enemyManager) {
            return;
        }

        // Обновляем менеджеры
        this.enemyManager.update(time, delta);
        
        if (this.projectileManager) {
            this.projectileManager.update(time, delta);
        }
        
        // Обновляем информацию о волне
        if (this.waveIndicator) {
            this.waveIndicator.updateUI();
        }
        
        // Проверка на "зависшую" волну - только если нет врагов на экране и нет таймера спавна
        if (this.waveManager.isCurrentWaveActive() && 
            this.enemyManager.enemies.getLength() === 0 && 
            !this.enemyManager.isSpawnTimerActive() && 
            this.waveManager.getRemainingEnemies() > 0) {
            
            console.log("Detected stuck wave: no enemies, no spawn timer, but wave is active");
            console.log(`Remaining enemies according to WaveManager: ${this.waveManager.getRemainingEnemies()}`);
            
            // Фиксим: завершаем все оставшиеся счетчики врагов
            const remaining = this.waveManager.getRemainingEnemies();
            for (let i = 0; i < remaining; i++) {
                this.waveManager.enemyDefeated();
            }
        }
    }

    destroy(): void {
        // Clean up all manager resources
        if (this.socket) {
            this.socket.close();
        }
        
        // Destroy all managers properly
        if (this.waveManager) {
            this.waveManager.removeAllListeners('waveComplete');
        }
        
        if (this.audioManager) {
            this.audioManager.destroy();
        }

        if (this.screenManager) {
            this.screenManager.destroy();
        }
    }

    getCoinRewardMultiplier(): number {
        return this.coinRewardMultiplier;
    }
}

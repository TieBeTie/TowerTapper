import Phaser from 'phaser';
import Tower from '../objects/towers/Tower';
import { UIManager } from '../managers/UIManager';
import EnemyManager from '../managers/EnemyManager';
import ProjectileManager from '../managers/ProjectileManager';
import CollisionManager from '../managers/CollisionManager';
import CoinManager from '../managers/CoinCollectionEffectFromEnemyManager';
import { UpgradeManager } from '../managers/UpgradeManager';
import { WaveManager } from '../managers/WaveManager';
import { WaveIndicator } from '../ui/components/WaveIndicator';
import { WaveClearEffect } from '../ui/components/WaveClearEffect';
import AudioManager from '../managers/AudioManager';

export default class GameScene extends Phaser.Scene {
    // Game view constants
    private readonly GAME_VIEW_HEIGHT_RATIO = 1; // 70% of screen height for game view
    private readonly GAME_VIEW_TOP_MARGIN = 0.0; // 15% from top for game view
    private readonly GAME_VIEW_BOTTOM_MARGIN = 0.0; // 15% from bottom for game view
    
    // Minimum and maximum dimensions for game view
    private readonly MIN_GAME_WIDTH = 320;
    private readonly MIN_GAME_HEIGHT = 480;
    private readonly MAX_GAME_WIDTH = 16000;
    private readonly MAX_GAME_HEIGHT = 9000;

    // Game view properties
    private gameViewHeight!: number;
    private gameViewWidth!: number;
    private gameViewY!: number;
    private gameScale!: number;

    // Game objects
    public tower!: Tower;
    public uiManager!: UIManager;
    public upgradeManager!: UpgradeManager;
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
        // Создаем черный прямоугольник на весь экран
        const { width, height } = this.scale;
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

        // Set up resize handler
        this.scale.on('resize', this.handleResize, this);
        
        // Initial setup
        this.setupGameView();
        
        // Initialize AudioManager
        this.audioManager = AudioManager.getInstance(this);
        this.audioManager.playMusic();
    }

    private setupGameView(): void {
        const { width, height } = this.scale;
        
        // Calculate game view dimensions with constraints
        this.gameViewHeight = Math.min(
            Math.max(height * this.GAME_VIEW_HEIGHT_RATIO, this.MIN_GAME_HEIGHT),
            this.MAX_GAME_HEIGHT
        );
        this.gameViewWidth = Math.min(
            Math.max(width, this.MIN_GAME_WIDTH),
            this.MAX_GAME_WIDTH
        );
        
        // Calculate vertical position with margins
        this.gameViewY = height * this.GAME_VIEW_TOP_MARGIN;

        // Calculate game scale based on orientation
        this.calculateGameScale();

        // Create the background for game view
        const background = this.add.image(
            this.gameViewWidth / 2,
            this.gameViewY + this.gameViewHeight / 2,
            'background'
        );
        background.setOrigin(0.5, 0.5);
        background.displayWidth = this.gameViewWidth;
        background.displayHeight = this.gameViewHeight;

        // Initialize the tower with scaled dimensions
        this.tower = new Tower(
            this,
            this.gameViewWidth / 2,
            this.gameViewY + this.gameViewHeight / 2,
            'tower'
        );
        this.tower.setName('tower');
        this.tower.setScale(this.gameScale);
        this.tower.setAlpha(0); // Start invisible

        // Animate tower spawn
        this.tweens.add({
            targets: this.tower,
            alpha: 1,
            duration: 800,
            ease: 'Power2.out',
            onStart: () => {
                let amplitude = 8; // Начальная амплитуда
                let direction = 1; // 1 = вправо, -1 = влево
                const centerX = this.gameViewWidth / 2; // Запоминаем центральную позицию
                
                // Создаем таймер для движения влево-вправо
                const moveTimer = this.time.addEvent({
                    delay: 50,
                    callback: () => {
                        if (amplitude > 0.5) {
                            // Устанавливаем позицию относительно центра
                            this.tower.x = centerX + (direction * amplitude);
                            direction *= -1; // Меняем направление
                            amplitude *= 0.8; // Уменьшаем амплитуду
                        } else {
                            moveTimer.destroy();
                            this.tower.x = centerX; // Возвращаем точно в центр
                            // Initialize managers immediately after tower animation
                            this.initializeManagers();
                        }
                    },
                    repeat: 15
                });
            }
        });
    }

    private calculateGameScale(): void {
        const { width, height } = this.scale;
        const baseWidth = this.scale.baseSize.width;
        const baseHeight = this.scale.baseSize.height;
        
        // Calculate scale based on orientation
        const isPortrait = height > width;
        if (isPortrait) {
            this.gameScale = Math.min(
                this.gameViewWidth / baseWidth,
                this.gameViewHeight / baseHeight
            ) * 0.7; // Reduce overall scale by 30%
        } else {
            // For landscape, maintain aspect ratio while fitting within bounds
            const aspectRatio = baseWidth / baseHeight;
            this.gameScale = Math.min(
                this.gameViewWidth / baseWidth,
                this.gameViewHeight / (baseWidth / aspectRatio)
            ) * 0.7; // Reduce overall scale by 30%
        }
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
            () => this.scene.launch('UpgradeScene'),
            () => console.log('Settings clicked'),
            () => console.log('Shop clicked'),
            this.upgradeManager
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

    private handleResize(gameSize: Phaser.Structs.Size): void {
        // Recalculate game view dimensions
        this.setupGameView();
        
        // Update all game objects with new scale
        if (this.tower) {
            this.tower.setScale(this.gameScale);
        }
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

    // Getters for game view dimensions
    getGameViewHeight(): number {
        return this.gameViewHeight;
    }

    getGameViewWidth(): number {
        return this.gameViewWidth;
    }

    getGameViewY(): number {
        return this.gameViewY;
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
        
        // Unsubscribe from events
        this.scale.off('resize', this.handleResize, this);
        
        // Destroy all managers properly
        if (this.waveManager) {
            this.waveManager.removeAllListeners('waveComplete');
        }
        
        if (this.audioManager) {
            this.audioManager.destroy();
        }
    }

    getCoinRewardMultiplier(): number {
        return this.coinRewardMultiplier;
    }
}

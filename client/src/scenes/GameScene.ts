import Phaser from 'phaser';
import Tower from '../objects/towers/Tower';
import { UIManager } from '../managers/UIManager';
import EnemyManager from '../managers/EnemyManager';
import ProjectileManager from '../managers/ProjectileManager';
import CollisionManager from '../managers/CollisionManager';
import GoldManager from '../managers/GoldManager';
import { UpgradeManager } from '../managers/UpgradeManager';
import { WaveManager } from '../managers/WaveManager';
import { WaveIndicator } from '../ui/components/WaveIndicator';
import { WaveClearEffect } from '../ui/components/WaveClearEffect';
import AudioManager from '../managers/AudioManager';
import { IGameScene } from '../types/IGameScene';
import { ScreenManager } from '../managers/ScreenManager';
import { SupplyDropManager } from '../managers/SupplyDropManager';
import { SkillStateManager } from '../managers/SkillStateManager';
import { EmblemManager } from '../managers/EmblemManager';

export default class GameScene extends Phaser.Scene implements IGameScene {
    // Game objects
    public tower!: Tower;
    public uiManager!: UIManager;
    public upgradeManager!: UpgradeManager;
    public screenManager!: ScreenManager;
    enemyManager!: EnemyManager;
    projectileManager!: ProjectileManager;
    collisionManager!: CollisionManager;
    goldManager!: GoldManager;
    waveManager!: WaveManager;
    waveIndicator!: WaveIndicator;
    waveClearEffect!: WaveClearEffect;
    supplyDropManager!: SupplyDropManager;
    emblemManager!: EmblemManager;
    gold!: number;
    socket!: WebSocket;
    audioManager!: AudioManager;
    private goldRewardMultiplier: number = 1;
    private gameSpeedMultiplier: number = 1;
    private skillStateManager: SkillStateManager;

    constructor() {
        super({ key: 'GameScene' });
        this.skillStateManager = SkillStateManager.getInstance();
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
        
        // Store the game instance globally for access from other components
        (window as any).game = this.game;
        
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
        
        // Listen for force visibility event with a different name to avoid recursion
        this.events.on('ui-refresh-visibility', this.forceUIVisibility, this);

        // Listen for game speed change events
        this.events.on('gameSpeedChanged', this.handleGameSpeedChanged, this);
        
        // Initialize game speed from skill manager
        this.gameSpeedMultiplier = this.skillStateManager.getGameSpeed();
    }

    private handleScreenResize(gameScale: number): void {
        // Обновляем фон
        this.screenManager.setupBackground();
        
        // Make sure all UI components are properly positioned and visible after resize
        const { width, height } = this.screenManager.getScreenSize();
        
        // Update other UI components if needed
        if (this.uiManager) {
            this.uiManager.updatePositions();
        }
        
        // Ensure the tower is properly positioned
        if (this.tower) {
            const center = this.screenManager.getGameViewCenter();
            this.tower.setPosition(center.x, center.y);
            // Use direct method call instead of event emission to avoid recursion
            this.tower.updateAttackRangeVisual();
        }
        
        // Force re-layout of all buttons and UI components using a different event
        // to avoid recursion
        this.events.emit('ui-refresh');
        
        // Trigger visibility refresh with non-recursive event
        this.events.emit('ui-refresh-visibility');
    }

    private forceUIVisibility(): void {
        // Force tower attack range visibility
        if (this.tower) {
            // Instead of calling these methods, emit the event that the tower listens for
            this.tower.setVisible(true);
            this.tower.setDepth(10); // Ensure tower has proper depth
            
            // Use a specific event name for the tower to avoid recursion
            this.events.emit('tower-force-attack-circle');
        }
        
        // Force wave indicator visibility
        if (this.waveIndicator) {
            this.waveIndicator.updateUI();
        }
        
        // Force other UI elements visibility
        if (this.uiManager) {
            this.uiManager.updatePositions();
        }
        
        // Force all text elements to be visible
        this.children.list.forEach(child => {
            if (child instanceof Phaser.GameObjects.Text) {
                const currentText = child.text;
                child.setText(currentText);
                child.setVisible(true);
                (child as any).setDepth(100); // Set high depth for all text elements
            }
        });
        
        // Set proper depth for various game elements
        this.sortGameObjectsByDepth();
    }

    // New method to ensure proper depth sorting
    private sortGameObjectsByDepth(): void {
        // Get all game objects and sort them by their intended depth
        this.children.list.forEach(child => {
            // Background elements
            if (child.name === 'background') {
                (child as any).setDepth(-100);
            }
            
            // Attack range circle (should be below tower)
            if (child instanceof Phaser.GameObjects.Graphics) {
                if (this.tower && Phaser.Math.Distance.Between(
                    child.x, child.y, this.tower.x, this.tower.y
                ) < this.tower.getAttackRange() * 1.5) {
                    child.setDepth(-10);
                }
            }
            
            // Tower (should be above attack range)
            if (child.name === 'tower') {
                (child as any).setDepth(10);
            }
            
            // Enemies (should be above background, but below UI)
            if (child.name && child.name.includes('enemy')) {
                (child as any).setDepth(5);
            }
            
            // UI elements should be on top
            if (child instanceof Phaser.GameObjects.Text) {
                child.setDepth(100);
            }
            
            // Make sure they're visible
            if ('setVisible' in child) {
                (child as any).setVisible(true);
            }
        });
    }

    private setupGameView(): void {
        // Создаем фон через ScreenManager
        this.screenManager.setupBackground();

        // Получаем центр игровой области и масштаб
        const center = this.screenManager.getGameViewCenter();
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

        // Initialize emblem manager first
        this.emblemManager = EmblemManager.getInstance();
        this.emblemManager.initialize();

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

        // Initialize GoldManager
        this.goldManager = new GoldManager(this, this.uiManager);

        // Initialize other managers
        this.enemyManager = new EnemyManager(this, this.uiManager, this.goldManager, this.waveManager);
        this.projectileManager = new ProjectileManager(this, this.enemyManager);
        this.collisionManager = new CollisionManager(this);
        
        // Initialize SupplyDropManager
        this.supplyDropManager = new SupplyDropManager(this);

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

    private handleGameSpeedChanged(newSpeed: number): void {
        this.gameSpeedMultiplier = newSpeed;
        console.log(`Game speed changed to ${newSpeed}x`);
    }

    update(time: number, delta: number): void {
        try {
            // Проверяем, инициализированы ли все необходимые менеджеры
            if (!this.waveManager || !this.enemyManager) {
                return;
            }

            // Apply game speed multiplier to delta time
            const scaledDelta = delta * this.gameSpeedMultiplier;

            // Обновляем менеджеры с измененным delta
            this.enemyManager.update(time, scaledDelta);
            
            if (this.projectileManager) {
                this.projectileManager.update(time, scaledDelta);
            }
            
            // Обновляем информацию о волне
            if (this.waveIndicator) {
                this.waveIndicator.updateUI();
            }
            
            // Update emblem count in UI
            if (this.emblemManager) {
                this.events.emit('updateEmblems', this.emblemManager.getEmblemBonus());
            }
            
            // Проверка на "зависшую" волну - только если нет врагов на экране и нет таймера спавна
            if (this.waveManager.isCurrentWaveActive() && 
                this.enemyManager.enemies && 
                typeof this.enemyManager.enemies.getLength === 'function' &&
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
        } catch (error) {
            console.warn('Error in GameScene update:', error);
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

        // Remove event listeners
        this.events.off('gameSpeedChanged', this.handleGameSpeedChanged, this);
    }

    getGoldRewardMultiplier(): number {
        return this.goldRewardMultiplier;
    }

    // Method to get emblem bonus
    getEmblemBonus(): number {
        if (!this.emblemManager) return 0;
        return this.emblemManager.getEmblemBonus();
    }

    // Get current emblem count
    getEmblemCount(): number {
        if (!this.emblemManager) return 0;
        return this.emblemManager.getEmblemCount();
    }

    // Add the updateHealthBar method that Tower tries to call
    updateHealthBar(currentHP: number, maxHP: number): void {
        // Update StatsView's HP bar through UIManager
        if (this.uiManager && this.uiManager.updateHealthDisplay) {
            this.uiManager.updateHealthDisplay(currentHP, maxHP);
        }
    }
}

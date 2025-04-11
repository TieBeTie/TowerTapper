// BootScene.js
import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';
import { IScene } from '../../types/IScene';
import { TelegramService } from '../TelegramService';
import { InitialSkillService } from '../InitialSkillService';
import { EmblemStorage } from '../../storage/EmblemStorage';

class BootScene extends Phaser.Scene implements IScene {
    public screenManager!: ScreenManager;
    private telegramService!: TelegramService;
    private InitialSkillService!: InitialSkillService;
    private emblemStorage!: EmblemStorage;
    private telegramId: string | null = null;

    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Check if running on iOS for special handling
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS) {
            console.log('BootScene: Running on iOS - applying special handling');
            // Add iOS-specific validation handlers
            this.load.on('complete', () => {
                console.log('All assets loaded on iOS');
            });
        }

        // Load WebFont loader with a properly set callback
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
        
        // Ensure the script is loaded before proceeding
        this.load.on('filecomplete-script-webfont', () => {
            console.log('WebFont script loaded successfully');
        });

        // Load audio assets with MP3 fallback for iOS
        this.load.audio('gameMusic', [
            'assets/music/GameMusic.mp3'
        ]);
        this.load.audio('emblem_shop', 'assets/music/emblem_shop.mp3');
        this.load.audio('initial_upgrades_shop', 'assets/music/initial_upgrades_shop.mp3');
        this.load.audio('arrow', 'assets/sounds/arrow.wav');
        this.load.audio('enemyDie', 'assets/sounds/enemy_die.wav');
        this.load.audio('towerDie', 'assets/sounds/tower_die.wav');
        this.load.audio('waveCompleted', 'assets/sounds/wave_completed.wav');
        this.load.audio('upgradeButton', 'assets/sounds/upgrade_button.wav');
        this.load.audio('towerDamage', 'assets/sounds/tower_damage.wav');
        this.load.audio('usualButton', 'assets/sounds/usual_button.mp3');
        this.load.audio('crit', 'assets/sounds/crit.wav');
        this.load.audio('heal', 'assets/sounds/heal.wav');
        this.load.audio('supply_drop', 'assets/sounds/supply_drop.wav');
        this.load.audio('gold_collect', 'assets/sounds/gold_collect.wav');
        this.load.audio('purchase_sound', 'assets/sounds/upgrade_button.wav');
        this.load.audio('tower_appearing', 'assets/sounds/tower_appearing.mp3');
        this.load.audio('tower_building', 'assets/sounds/tower_building.wav');
        
        // Обработчики событий загрузки
        this.load.on('filecomplete', (key: string) => {
            console.log(`File complete: ${key}`);
        });

        this.load.on('loaderror', (file: any) => {
            console.error(`Error loading file: ${file.key}`);
        });

        // Загрузка игровых ресурсов как спрайт-листа
        this.load.spritesheet('enemy', 'assets/images/enemies/Enemie_anim.png', {
            frameWidth: 75,
            frameHeight: 125
        });

        this.load.spritesheet('enemy_death', 'assets/images/enemies/death_scene.png', {
            frameWidth: 90,
            frameHeight: 135
        });

        this.load.image('tower', 'assets/images/towers/Tower-type-3.6@2x.png');
        this.load.image('projectile', 'assets/images/projectiles/arrow.png');
        this.load.image('background', 'assets/images/towers/Background1.png');
        
        // Load emblem icon
        this.load.image('emblem_icon', 'assets/images/currency/heraldic_emblem16x16.png');

        // Загрузка монет
        this.load.spritesheet('gold', 'assets/images/towers/Gold-sheet.png', {
            frameWidth: 65,
            frameHeight: 90
        });
    }

    create() {
        // Initialize ScreenManager first
        this.screenManager = new ScreenManager(this);
        
        // Initialize services
        this.telegramService = TelegramService.getInstance();
        this.InitialSkillService = InitialSkillService.getInstance();
        this.emblemStorage = EmblemStorage.getInstance();
        
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
        this.setupBootView();

        // Подписываемся на изменение размера экрана
        this.events.on('screenResize', this.handleScreenResize, this);
        
        // Get telegram_id from URL and authenticate
        this.authenticateUser();
    }
    
    private authenticateUser(): void {
        // Simple check for telegram_id from either Telegram WebApp or URL
        let telegramId = null;
        
        // Option 1: Try to get from Telegram WebApp if available
        if (this.telegramService.isTelegramWebApp()) {
            const userData = this.telegramService.getUserData();
            if (userData && userData.id) {
                telegramId = userData.id.toString();
                console.log('SUCCESS: Got telegram_id from Telegram WebApp:', telegramId);
            } else {
                console.log('INFO: Running in Telegram WebApp but could not get user ID');
            }
        } else {
            console.log('INFO: Not running in Telegram WebApp environment');
        }
        
        // Option 2: Try to get from URL parameters if not already found
        if (!telegramId) {
            const urlParams = new URLSearchParams(window.location.search);
            telegramId = urlParams.get('telegram_id');
            
            if (telegramId) {
                console.log('SUCCESS: Got telegram_id from URL:', telegramId);
            } else {
                console.log('ERROR: No telegram_id found in URL parameters');
            }
        }
        
        // Final check and proceed regardless
        if (telegramId) {
            // Store for use in the game
            this.telegramId = telegramId;
            sessionStorage.setItem('telegram_id', telegramId);
            
            // Show status
            const { width, height } = this.screenManager.getScreenSize();
            const statusText = this.add.text(
                width / 2,
                height / 2 - 80,
                'Telegram ID: ' + telegramId,
                {
                    fontSize: '16px',
                    color: '#00ff00',
                    align: 'center'
                }
            );
            statusText.setOrigin(0.5);
            
            // Try to connect but don't block game start
            const loadingText = this.add.text(
                width / 2,
                height / 2 - 40,
                'Connecting to server...',
                {
                    fontSize: '18px',
                    color: '#ffffff',
                    align: 'center'
                }
            );
            loadingText.setOrigin(0.5);
            
            // Add start game button that's always enabled
            this.showGameStartButton(false, loadingText);
            
            // Try to connect to server in background
            Promise.all([
                this.InitialSkillService.connect(telegramId),
                this.emblemStorage.connect(telegramId)
            ])
                .then(() => {
                    console.log('Connected to server successfully');
                    loadingText.setText('Connected to server!');
                    loadingText.setColor('#00ff00');
                    // Game already has a start button, so user can proceed when ready
                })
                .catch(error => {
                    console.error('Server connection failed:', error);
                    loadingText.setText('Warning: Playing without server connection.\nProgress will not be saved.');
                    loadingText.setColor('#ffaa00');
                    // Game can still be played, but progress won't be saved
                    sessionStorage.setItem('local_mode', 'true');
                });
        } else {
            // No telegram_id found from any source - still allow playing locally
            const { width, height } = this.screenManager.getScreenSize();
            const warningText = this.add.text(
                width / 2,
                height / 2 - 80,
                'No Telegram ID found.\nPlaying in local mode (progress will not be saved).',
                {
                    fontSize: '16px',
                    color: '#ffaa00',
                    align: 'center'
                }
            );
            warningText.setOrigin(0.5);
            
            // Set local mode flag
            sessionStorage.setItem('local_mode', 'true');
            
            // Show start button
            this.showGameStartButton(true);
        }
    }
    
    private showGameStartButton(isLocalMode: boolean, loadingText?: Phaser.GameObjects.Text): void {
        const { width, height } = this.screenManager.getScreenSize();
        
        // Create start game button
        const startButton = this.add.text(
            width / 2,
            height / 2 + 50,
            'Start Game',
            {
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: '#4a6fe3',
                padding: {
                    left: 20,
                    right: 20,
                    top: 10,
                    bottom: 10
                }
            }
        );
        startButton.setOrigin(0.5);
        startButton.setInteractive({ useHandCursor: true });
        
        // Add hover effect
        startButton.on('pointerover', () => {
            startButton.setScale(1.1);
        });
        startButton.on('pointerout', () => {
            startButton.setScale(1.0);
        });
        
        // Start game when clicked
        startButton.on('pointerdown', () => {
            if (loadingText) {
                loadingText.destroy();
            }
            
            // Create fancy transition effect
            const fadeRect = this.add.rectangle(0, 0, width, height, 0x000000, 0);
            fadeRect.setOrigin(0);
            
            this.tweens.add({
                targets: fadeRect,
                alpha: 1,
                duration: 500,
                onComplete: () => {
                    // Don't wait for font loading, just transition to game
                    this.createAnimations();
                    this.scene.start('MenuScene');
                }
            });
        });
    }

    private setupBootView(): void {
        // Создаем фон через ScreenManager
        this.screenManager.setupBackground();

        // Check if running on iOS for special handling
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

        // Создаем текстуру частиц
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('particle', 8, 8);
        graphics.destroy();

        // Force a check that all sprite images are available
        if (isIOS) {
            console.log('Verifying sprite availability on iOS...');
            // Check if key sprites are available
            const testEnemy = this.textures.exists('enemy');
            const testBackground = this.textures.exists('background');
            console.log(`iOS texture check - enemy: ${testEnemy}, background: ${testBackground}`);
            
            // Pre-create a test frame to warm up the animation system
            if (testEnemy) {
                const testSprite = this.add.sprite(-100, -100, 'enemy');
                testSprite.setVisible(false);
                this.time.delayedCall(100, () => {
                    testSprite.destroy();
                });
            }
        }

        // @ts-ignore
        WebFont.load({
            custom: {
                families: ['pixelFont'],
                urls: ['assets/fonts/pixelFont.css']
            },
            active: () => {
                console.log('Font loaded successfully');
                
                // Добавляем тестовый элемент для прогрузки шрифта
                const testText = document.createElement('div');
                testText.style.fontFamily = 'pixelFont';
                testText.style.fontSize = '0px';
                testText.style.visibility = 'hidden';
                testText.innerHTML = 'Font preload';
                document.body.appendChild(testText);
                
                // Удаляем элемент после короткой задержки
                setTimeout(() => {
                    document.body.removeChild(testText);
                    // Переходим к следующей сцене только после полной инициализации
                    this.createAnimations();
                    this.scene.start('MenuScene');
                }, 500);
            },
            inactive: () => {
                console.error('Font failed to load');
            }
        });
    }

    private handleScreenResize(gameScale: number): void {
        // Обновляем фон
        this.screenManager.setupBackground();
    }

    createAnimations() {
        this.anims.create({
            key: 'enemy_walk',
            frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 7 }),
            frameRate: 32,
            repeat: -1
        });

        this.anims.create({
            key: 'enemy_die',
            frames: this.anims.generateFrameNumbers('enemy_death', { start: 0, end: 11 }),
            frameRate: 32,
            repeat: 0
        });

        this.anims.create({
            key: 'gold_spin',
            frames: this.anims.generateFrameNumbers('gold', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1
        });
    }

    destroy(): void {
        // Удаляем подписку на событие resize
        this.events.off('screenResize', this.handleScreenResize, this);
        
        if (this.screenManager) {
            this.screenManager.destroy();
        }
    }
}

export default BootScene;

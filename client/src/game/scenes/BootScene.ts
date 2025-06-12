// BootScene.js
import Phaser from 'phaser';
import { ScreenManager } from '../managers/ScreenManager';
import { IScene } from '../types/IScene';
import { TelegramService } from '../services/TelegramService';
import { InitialSkillService } from '../services/InitialSkillService';
import { EmblemStorage } from '../storage/EmblemStorage';
import { MysticalBackground } from '../objects/backgrounds/MysticalBackground';
import { GameServerFactory } from '../../services/api/GameServerFactory';
import { GameServerGateway } from '../../services/api/GameServerGateway';

// Add WebFont type declaration
declare global {
    interface Window {
        WebFont: any;
    }
}

class BootScene extends Phaser.Scene implements IScene {
    public screenManager!: ScreenManager;
    private telegramService!: TelegramService;
    private InitialSkillService!: InitialSkillService;
    private emblemStorage!: EmblemStorage;
    private telegramId: string | null = null;
    private loadingBar!: Phaser.GameObjects.Graphics;
    private loadingText!: Phaser.GameObjects.Text;
    private percentText!: Phaser.GameObjects.Text;
    private loadingBackground!: Phaser.GameObjects.Graphics;
    private tipText!: Phaser.GameObjects.Text;
    private progressMask!: Phaser.GameObjects.Graphics;
    private progressFill!: Phaser.GameObjects.Image;
    private connectionAttempts: number = 0;
    private maxConnectionAttempts: number = 3;
    private gameServer!: GameServerGateway;
    private isConnecting: boolean = false;
    private assetsLoaded: boolean = false;
    private connectionComplete: boolean = false;
    private connectionResult: 'success' | 'failure' = 'failure';
    private loadingComplete: boolean = false;
    private assetLoadProgress: number = 0;

    // Pool of helpful tips to show randomly during loading
    private tips: string[] = [
        "Tip: Initial skills remain forever as base skills!",
        "Tip: Upgrade your tower to increase damage!",
        "Tip: Watch for special enemies that drop more gold!",
        "Tip: Emblems can be used to purchase permanent upgrades!",
        "Tip: Critical hits deal double damage!",
        "Tip: Save emblems for the most powerful upgrades!",
        "Tip: Faster attack speed means more DPS!",
        "Tip: Some upgrades become available after reaching certain levels!",
        "Tip: Defend your tower from waves of increasingly difficult enemies!",
        "Tip: Different enemy types have unique strengths and weaknesses!"
    ];

    // Pool of loading screen images
    private loadingImages: string[] = [
        'assets/images/logo.png',
        'assets/images/currency/heraldic_emblem/heraldic_emblem64x64.png',
        'assets/images/towers/tower.png'
    ];

    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Initialize services early
        this.telegramService = TelegramService.getInstance();
        this.InitialSkillService = InitialSkillService.getInstance();
        this.emblemStorage = EmblemStorage.getInstance();
        this.gameServer = GameServerFactory.createGameServer();

        // Create loading screen first
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Create background with blue color matching the pupil in logo
        this.loadingBackground = this.add.graphics();
        this.loadingBackground.fillStyle(0x29B6F6, 1); // Light blue color matching the pupil
        this.loadingBackground.fillRect(0, 0, width, height);

        // Create rounded rectangle texture for progress bar
        const barWidth = Math.min(320, width * 0.8); // 80% of screen width, max 320px
        const barHeight = 30;
        const barRadius = 15; // Rounded corners radius

        // Create graphics object for the bar background
        const barGraphics = this.make.graphics({ x: 0, y: 0 });

        // Draw progress bar background (white with transparency)
        barGraphics.fillStyle(0xFFFFFF, 0.3);
        barGraphics.fillRoundedRect(0, 0, barWidth, barHeight, barRadius);

        // Generate texture from the graphics
        barGraphics.generateTexture('progressBarBg', barWidth, barHeight);

        // Draw the progress bar fill graphic - white color
        const fillGraphics = this.make.graphics({ x: 0, y: 0 });
        fillGraphics.fillStyle(0xFFFFFF, 1);
        fillGraphics.fillRoundedRect(0, 0, barWidth, barHeight, barRadius);
        fillGraphics.generateTexture('progressBarFill', barWidth, barHeight);

        // Add the progress bar background
        const progressBarBg = this.add.image(width / 2, height / 2 + 50, 'progressBarBg').setOrigin(0.5);

        // Create a mask for the progress fill
        const progressMask = this.make.graphics({ x: 0, y: 0 });

        // Store reference to the mask for updates
        this.progressMask = progressMask;

        // Create the fill image with the mask
        const progressFill = this.add.image(width / 2 - barWidth / 2, height / 2 + 50, 'progressBarFill');
        progressFill.setOrigin(0, 0.5);

        // Set up initial mask to hide the fill
        progressMask.fillStyle(0xffffff);
        progressMask.fillRect(width / 2 - barWidth / 2, height / 2 + 50 - barHeight / 2, 0, barHeight);

        // Apply the mask
        const mask = progressMask.createGeometryMask();
        progressFill.setMask(mask);

        // Store reference to progress fill for updates
        this.progressFill = progressFill;

        // Create percentage text
        this.percentText = this.add.text(width / 2, height / 2 + 100, '0%', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'pixelFont'
        });
        this.percentText.setOrigin(0.5);

        // Calculate position between percentage and loading text
        const loadingTextY = height - Math.max(120, height * 0.1); // Current loading text position
        const connectionIconY = height / 2 + 180; // Position it below percentage but above loading text

        // Create connection status indicator at the new position
        const connectionStatusIcon = this.add.graphics();
        connectionStatusIcon.setPosition(width / 2, connectionIconY);

        // Add loading text to show current step - position it above the tip text
        this.loadingText = this.add.text(width / 2, loadingTextY, 'Loading assets...', {
            fontSize: '12px',
            color: '#ffffff',
            fontFamily: 'pixelFont',
            align: 'center'
        });
        this.loadingText.setOrigin(0.5);

        // Select random tip from the pool
        const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];

        // Add tip text with improved responsive sizing and text wrapping
        this.tipText = this.add.text(width / 2, height - Math.max(50, height * 0.08), randomTip, {
            fontSize: `${Math.max(12, Math.round(14 * (width / 800)))}px`,
            color: '#ffffff',
            fontFamily: 'pixelFont',
            align: 'center',
            wordWrap: { width: width * 0.9 },
            lineSpacing: 5
        });
        this.tipText.setOrigin(0.5);

        // Select random image to display
        const randomImage = this.loadingImages[Math.floor(Math.random() * this.loadingImages.length)];

        // Preload the selected image first to display it on the loading screen
        this.load.image('loading_display_image', randomImage);

        // Load and display the image once it's ready
        this.load.once('filecomplete-image-loading_display_image', () => {
            // Add image to the center of the screen
            const displayImage = this.add.image(width / 2, height / 2 - 100, 'loading_display_image');
            displayImage.setOrigin(0.5);

            // Scale image appropriately
            const scaleFactor = Math.min(width / displayImage.width * 0.5, height / displayImage.height * 0.25);
            displayImage.setScale(scaleFactor);
        });

        // Track asset loading progress (worth 80% of total loading)
        this.load.on('progress', (value: number) => {
            this.assetLoadProgress = value;
            this.updateLoadingProgress();
        });

        // When assets finished loading
        this.load.on('complete', () => {
            this.assetsLoaded = true;
            this.loadingText.setText('Connecting to server...');

            // Start server connection as part of loading
            this.getTelegramIdAndConnect();
        });

        // Load WebFont loader with a properly set callback
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

        // Load game logo for loading screen
        this.load.image('tower', 'assets/images/towers/tower.png');

        // Load game resources as spritesheets
        this.load.spritesheet('enemy', 'assets/images/enemies/orby/orby_move_spritesheet.png', {
            frameWidth: 75,
            frameHeight: 125
        });

        this.load.spritesheet('orby_death', 'assets/images/enemies/orby/orby_death_spritesheet.png', {
            frameWidth: 90,
            frameHeight: 135
        });

        this.load.image('projectile', 'assets/images/projectiles/arrow.png');
        this.load.image('background', 'assets/images/towers/Background1.png');

        // Load emblem icon
        this.load.image('emblem_icon', 'assets/images/currency/heraldic_emblem/heraldic_emblem16x16.png');

        // Load earth planet for background
        this.load.image('earth', 'assets/images/planet/earth.png');
        this.load.image('island1', 'assets/images/islands/1.png');
        this.load.image('island2', 'assets/images/islands/2.png');
        this.load.image('island3', 'assets/images/islands/3.png');

        // Load coins
        this.load.spritesheet('gold_spritesheet', 'assets/images/currency/gold/gold_spritesheet.png', {
            frameWidth: 65,
            frameHeight: 90
        });

        // Запускаем асинхронную загрузку аудио ПОСЛЕ завершения основной загрузки
        this.load.once('complete', () => {
            this.startAsyncAudioLoading();
        });
    }

    /**
     * Асинхронная загрузка аудио файлов в Phaser 3
     * 
     * Согласно официальной документации Phaser (https://docs.phaser.io/phaser/concepts/loader),
     * Phaser поддерживает несколько способов асинхронной загрузки:
     * 
     * 1. Загрузка вне метода preload() с использованием loader.start()
     * 2. Использование событий загрузчика для отслеживания прогресса
     * 3. Загрузка файлов во время выполнения игры
     * 
     * Преимущества этого подхода:
     * - BootScene не блокируется загрузкой больших аудио файлов
     * - Игра запускается быстрее с критически важными ресурсами
     * - Аудио загружается в фоне и автоматически включается когда готово
     * - Graceful degradation - игра работает даже если аудио не загрузилось
     */
    private startAsyncAudioLoading(): void {
        console.log('[BootScene] Starting async audio loading...');

        // Создаем новый загрузчик для аудио
        const audioLoader = this.load;

        // Добавляем все аудио файлы в очередь
        audioLoader.audio('gameMusic', ['assets/music/game_music.mp3']);
        audioLoader.audio('emblem_shop', 'assets/music/emblem_shop.mp3');
        audioLoader.audio('initial_upgrades_shop', 'assets/music/initial_upgrades_shop.mp3');
        audioLoader.audio('arrow', 'assets/sounds/arrow.wav');
        audioLoader.audio('enemyDie', 'assets/sounds/enemy_die.wav');
        audioLoader.audio('towerDie', 'assets/sounds/tower_die.wav');
        audioLoader.audio('waveCompleted', 'assets/sounds/wave_completed.wav');
        audioLoader.audio('upgradeButton', 'assets/sounds/upgrade_button.wav');
        audioLoader.audio('towerDamage', 'assets/sounds/tower_damage.wav');
        audioLoader.audio('usualButton', 'assets/sounds/usual_button.mp3');
        audioLoader.audio('crit', 'assets/sounds/crit.wav');
        audioLoader.audio('heal', 'assets/sounds/heal.wav');
        audioLoader.audio('supply_drop', 'assets/sounds/supply_drop.wav');
        audioLoader.audio('gold_collect', 'assets/sounds/gold_collect.wav');
        audioLoader.audio('purchase_sound', 'assets/sounds/upgrade_button.wav');
        audioLoader.audio('tower_appearing', 'assets/sounds/tower_appearing.mp3');
        audioLoader.audio('tower_building', 'assets/sounds/tower_building.wav');

        // Обработчик завершения загрузки аудио
        audioLoader.once('complete', () => {
            console.log('[BootScene] Audio loading completed');

            // Уведомляем глобально о том, что аудио готово
            this.game.events.emit('audioLoaded');

            // Сохраняем флаг в глобальном объекте
            (window as any).audioLoaded = true;
        });

        // Обработчик ошибок при загрузке аудио
        audioLoader.on('loaderror', (file: any) => {
            console.warn(`[BootScene] Failed to load audio file: ${file.key}`, file);
        });

        // Обработчик прогресса загрузки аудио
        audioLoader.on('progress', (progress: number) => {
            console.log(`[BootScene] Audio loading progress: ${Math.round(progress * 100)}%`);
        });

        // Обработчик загрузки отдельных файлов
        audioLoader.on('filecomplete', (key: string, type: string) => {
            console.log(`[BootScene] Audio file loaded: ${key} (${type})`);
        });

        // Запускаем загрузку аудио
        audioLoader.start();
    }

    create() {
        this.scene.bringToTop('BootScene');

        // Initialize ScreenManager
        this.screenManager = new ScreenManager(this);

        // Subscribe to screen resize events
        this.events.on('screenResize', this.handleScreenResize, this);

        // Setup boot view
        this.setupBootView();

        // Create global animations once assets are loaded
        this.createAnimations();
    }

    private getTelegramIdAndConnect(): void {
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

        // Final check and proceed with connection
        if (telegramId) {
            // Store for use in the game
            this.telegramId = telegramId;
            sessionStorage.setItem('telegram_id', telegramId);

            // Connect to server
            this.connectToServer(telegramId);
        } else {
            // No telegram_id found - skip connection phase
            this.connectionComplete = true;
            this.connectionResult = 'failure';
            this.loadingText.setText('No Telegram ID found. Playing in local mode.');

            // Set local mode flag
            sessionStorage.setItem('local_mode', 'true');

            // Finish loading process
            this.checkLoadingComplete();
        }
    }

    private connectToServer(telegramId: string): void {
        if (this.isConnecting) return;

        this.isConnecting = true;
        this.connectionAttempts++;

        console.log(`Connection attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}`);

        // Update loading text
        if (this.connectionAttempts > 1) {
            this.loadingText.setText(`Connecting to server (Attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
        }

        // Try to connect to server
        Promise.all([
            this.InitialSkillService.connect(telegramId),
            this.emblemStorage.connect(telegramId)
        ])
            .then(() => {
                console.log('Connected to server successfully');
                this.connectionComplete = true;
                this.connectionResult = 'success';
                this.isConnecting = false;
                this.loadingText.setText('Connected to server!');

                // Update progress and check if loading is complete
                this.checkLoadingComplete();
            })
            .catch(error => {
                console.error('Server connection failed:', error);

                if (this.connectionAttempts < this.maxConnectionAttempts) {
                    // Retry connection after a delay
                    this.loadingText.setText(`Connection failed. Retrying (${this.connectionAttempts}/${this.maxConnectionAttempts})...`);

                    setTimeout(() => {
                        this.isConnecting = false;
                        this.connectToServer(telegramId);
                    }, 2000);
                } else {
                    // Give up after max attempts
                    console.error(`Failed to connect after ${this.maxConnectionAttempts} attempts.`);
                    this.connectionComplete = true;
                    this.connectionResult = 'failure';
                    this.isConnecting = false;
                    this.loadingText.setText('Connection failed. Playing in local mode.');

                    // Game can still be played, but progress won't be saved
                    sessionStorage.setItem('local_mode', 'true');

                    // Update progress and check if loading is complete
                    this.checkLoadingComplete();
                }
            });
    }

    private updateLoadingProgress(): void {
        // Calculate the total progress 
        // - First 80% is asset loading
        // - Last 20% is connection
        let totalProgress = 0;

        if (!this.assetsLoaded) {
            // Assets are still loading (0-80%)
            totalProgress = this.assetLoadProgress * 0.8;
        } else if (!this.connectionComplete) {
            // Connection phase (80-100%)
            totalProgress = 0.8 + (this.connectionAttempts / (this.maxConnectionAttempts + 1)) * 0.2;
        } else {
            // Everything complete
            totalProgress = 1.0;
        }

        // Update percentage display
        const percent = Math.floor(totalProgress * 100);
        if (this.percentText) {
            this.percentText.setText(`${percent}%`);
        }

        // Update progress bar
        if (this.progressMask && this.cameras.main) {
            const width = this.cameras.main.width;
            const barWidth = Math.min(320, width * 0.8);

            this.progressMask.clear();
            this.progressMask.fillStyle(0xffffff);
            this.progressMask.fillRect(width / 2 - barWidth / 2, this.cameras.main.height / 2 + 50 - 15, barWidth * totalProgress, 30);
        }
    }

    private checkLoadingComplete(): void {
        // Update loading progress
        this.updateLoadingProgress();

        // Check if all loading steps are complete
        if (this.assetsLoaded && this.connectionComplete) {
            if (!this.loadingComplete) {
                this.loadingComplete = true;
                console.log('[BootScene] checkLoadingComplete: Conditions met, starting fade transition.');
                this.fadeToBlackAndTransition();
            } else {
                console.log('[BootScene] checkLoadingComplete: Conditions met, but loadingComplete flag is already true. Transition likely already started or finished.');
            }
        } else {
            console.log(`[BootScene] checkLoadingComplete: Conditions not met. assetsLoaded: ${this.assetsLoaded}, connectionComplete: ${this.connectionComplete}, loadingComplete: ${this.loadingComplete}`);
        }
    }

    private fadeToBlackAndTransition(): void {
        console.log('[BootScene] fadeToBlackAndTransition: Starting fade animation.');
        console.log('[BootScene] Fading to black and transitioning to MenuScene');

        // Crear un único rectángulo negro para la transición
        const darkOverlay = this.add.graphics();
        darkOverlay.clear();
        darkOverlay.setDepth(9999);

        // Dibujar un rectángulo negro con alfa 0 (transparente)
        darkOverlay.fillStyle(0x000000, 1);
        darkOverlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        darkOverlay.alpha = 0;

        this.tweens.add({
            targets: darkOverlay,
            alpha: 1,
            duration: 1000,
            ease: 'Linear',
            onComplete: () => {
                console.log('[BootScene] fadeToBlackAndTransition: Fade animation COMPLETE. Stopping BootScene and starting MenuScene.');
                console.log('[BootScene] 500ms delay finished. Stopping BootScene and starting MenuScene.'); // Log after delay

                // Crear las animaciones necesarias 
                // this.createAnimations(); // <-- Removed from here

                // Ir a la escena del menú principal
                this.scene.stop('BootScene');
                this.scene.start('MenuScene');
            }
        });
    }

    private setupBootView(): void {
        // Check if running on iOS for special handling
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

        // Create particle texture
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

        // Font loading setup
        if (window.WebFont) {
            // @ts-ignore
            WebFont.load({
                custom: {
                    families: ['pixelFont'],
                    urls: ['assets/fonts/pixelFont.css']
                },
                active: () => {
                    console.log('Font loaded successfully');

                    // Add test element for font preload
                    const testText = document.createElement('div');
                    testText.style.fontFamily = 'pixelFont';
                    testText.style.fontSize = '0px';
                    testText.style.visibility = 'hidden';
                    testText.innerHTML = 'Font preload';
                    document.body.appendChild(testText);

                    // Remove element after delay
                    setTimeout(() => {
                        document.body.removeChild(testText);
                    }, 500);
                },
                inactive: () => {
                    console.error('Font failed to load');
                }
            });
        }
    }

    private handleScreenResize(gameScale: number): void {
        const { width, height } = this.screenManager.getScreenSize();

        // Update tip text position and wrapping if it exists
        if (this.tipText && this.tipText.active) {
            this.tipText.setPosition(width / 2, height - Math.max(50, height * 0.08));
            this.tipText.setWordWrapWidth(width * 0.9);
            this.tipText.setFontSize(Math.max(12, Math.round(14 * (width / 800))));
        }

        // Update loading text
        if (this.loadingText && this.loadingText.active) {
            const loadingTextY = height - Math.max(120, height * 0.1);
            this.loadingText.setPosition(width / 2, loadingTextY);
        }

        // Update progress bar if it exists
        if (this.progressFill && this.progressFill.active) {
            const barWidth = Math.min(320, width * 0.8);
            // Update progress bar position
            this.progressFill.setPosition(width / 2 - barWidth / 2, height / 2 + 50);

            // Update percentage text
            if (this.percentText && this.percentText.active) {
                this.percentText.setPosition(width / 2, height / 2 + 100);
            }

            // Update progress mask if it exists
            if (this.progressMask) {
                // Just recreate the mask at the current position with the appropriate size
                this.progressMask.clear();
                this.progressMask.fillStyle(0xffffff);

                // Get current progress from the percent text
                let currentProgress = 0;
                if (this.percentText && this.percentText.text) {
                    // Extract percent value from text (e.g., "75%" -> 0.75)
                    const percentValue = parseInt(this.percentText.text, 10) || 0;
                    currentProgress = percentValue / 100;
                }

                // Update the mask
                this.progressMask.fillRect(width / 2 - barWidth / 2, height / 2 + 50 - 15, barWidth * currentProgress, 30);
            }
        }
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
            frames: this.anims.generateFrameNumbers('orby_death', { start: 0, end: 11 }),
            frameRate: 32,
            repeat: 0
        });

        this.anims.create({
            key: 'gold_spin',
            frames: this.anims.generateFrameNumbers('gold_spritesheet', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1
        });
    }

    destroy(): void {
        // Remove event subscriptions
        this.events.off('screenResize', this.handleScreenResize, this);

        if (this.screenManager) {
            this.screenManager.destroy();
        }

        // Clean up tweens
        this.tweens.killAll();
    }
}

export default BootScene;

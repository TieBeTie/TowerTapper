// BootScene.js
import Phaser from 'phaser';
import { ScreenManager } from '../managers/ScreenManager';
import { IScene } from '../types/IScene';

class BootScene extends Phaser.Scene implements IScene {
    public screenManager!: ScreenManager;

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

        // Load WebFont loader
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

        // Load audio assets with MP3 fallback for iOS
        this.load.audio('gameMusic', [
            'assets/music/GameMusic.mp3', // Add MP3 version first for iOS
            'assets/music/GameMusic.ogg'
        ]);
        this.load.audio('arrow', 'assets/sounds/arrow.wav');
        this.load.audio('enemyDie', 'assets/sounds/enemy_die.wav');
        this.load.audio('towerDie', 'assets/sounds/tower_die.wav');
        this.load.audio('waveCompleted', 'assets/sounds/wave_completed.wav');
        this.load.audio('upgradeButton', 'assets/sounds/upgrade_button.wav');
        this.load.audio('towerDamage', 'assets/sounds/tower_damage.wav');
        this.load.audio('playButton', 'assets/sounds/play_button.wav');
        
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

        // Загрузка монет
        this.load.spritesheet('coin', 'assets/images/towers/Coin-sheet.png', {
            frameWidth: 65,
            frameHeight: 90
        });
    }

    create() {
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
        this.setupBootView();

        // Подписываемся на изменение размера экрана
        this.events.on('screenResize', this.handleScreenResize, this);
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
            key: 'coin_spin',
            frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 7 }),
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

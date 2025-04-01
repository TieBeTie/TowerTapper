import Phaser from 'phaser';
import AudioManager from '../managers/AudioManager';
import { IScene } from '../types/IScene';
import { ScreenManager } from '../managers/ScreenManager';
import { UIManager } from '../managers/UIManager';
import { EmblemManager } from '../managers/EmblemManager';

export default class MenuScene extends Phaser.Scene implements IScene {
    private audioManager!: AudioManager;
    public screenManager!: ScreenManager;
    public uiManager!: UIManager;
    private emblemManager!: EmblemManager;

    constructor() {
        super({ key: 'MenuScene' });
    }

    preload(): void {
        // Загрузка ресурсов если нужно
    }

    create(): void {
        // Initialize ScreenManager
        this.screenManager = new ScreenManager(this);
        
        // Initialize EmblemManager
        this.emblemManager = EmblemManager.getInstance();
        
        // Check if we're running on iOS for special handling
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        
        try {
            // Initialize AudioManager but don't play music immediately on iOS
            this.audioManager = AudioManager.getInstance(this);
            
            if (isIOS) {
                console.log('MenuScene: Running on iOS - applying special handling');
                // On iOS, we'll play music only after user interaction
            } else {
                // On non-iOS platforms, play music immediately if available
                if (this.audioManager.hasSoundCached('gameMusic')) {
                    this.audioManager.playMusic();
                } else {
                    console.warn('Unable to play music - gameMusic not found in cache');
                }
            }
        } catch (err) {
            console.error('Error setting up audio in MenuScene:', err);
        }

        // Создаем фон через ScreenManager
        this.screenManager.setupBackground();

        // Force a small delay on iOS to ensure textures are loaded
        const setupComponents = () => {
            // Получаем размеры экрана через ScreenManager
            const { width, height } = this.screenManager.getScreenSize();
            const gameScale = this.screenManager.getGameScale();
            const center = this.screenManager.getScreenCenter();


            // Создаем монстра в центре экрана, но с маленьким размером
            try {
                if (isIOS) console.log('Creating enemy sprite on iOS');
                const monster = this.add.sprite(center.x, center.y, 'enemy');
                monster.setScale(0.5 * gameScale); // Уменьшаем начальный размер
                
                // Verify the texture is available before playing animation
                if (this.textures.exists('enemy')) {
                    if (isIOS) console.log('Starting enemy_walk animation on iOS');
                    monster.play('enemy_walk');
                } else {
                    console.error('Enemy texture not available!');
                }

                // Анимация появления монстра
                this.tweens.add({
                    targets: monster,
                    scale: 0.8 * gameScale, // Уменьшаем финальный размер
                    duration: 800,
                    ease: 'Bounce.out',
                    onComplete: () => {
                        // После появления начинаем покачивание
                        this.tweens.add({
                            targets: monster,
                            y: center.y + 5, // Уменьшаем амплитуду покачивания
                            duration: 1000,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
                    }
                });
            } catch (err) {
                console.error('Error creating monster sprite:', err);
            }

            // Создаем кнопку "Играть" с использованием адаптивного шрифта
            const fontSize = this.screenManager.getLargeFontSize();
            const playButton = this.screenManager.createText(
                center.x, 
                height * 0.6, 
                'Play', 
                fontSize,
                '#ffffff'
            );

            // Добавляем кнопку для перехода в магазин постоянных улучшений
            const upgradesButtonFontSize = this.screenManager.getResponsiveFontSize(32);
            const upgradesButton = this.screenManager.createText(
                center.x, 
                height * 0.75, 
                'Permanent Upgrades', 
                upgradesButtonFontSize,
                '#ffcc00'
            );
            
            // Добавляем кнопку для пополнения эмблем
            const replenishButtonFontSize = this.screenManager.getResponsiveFontSize(32);
            const replenishButton = this.screenManager.createText(
                center.x, 
                height * 0.85, 
                'Replenish Emblems', 
                replenishButtonFontSize,
                '#ffcc00'
            );

            // Добавляем интерактивность кнопке магазина улучшений
            upgradesButton.setInteractive()
                .on('pointerover', () => {
                    upgradesButton.setScale(1.1);
                })
                .on('pointerout', () => {
                    upgradesButton.setScale(1);
                })
                .on('pointerdown', () => {
                    try {
                        // Проигрываем звук нажатия при наличии
                        if (this.audioManager.hasSoundCached('playButton')) {
                            this.audioManager.playSound('playButton');
                        }
                    } catch (err) {
                        console.error('Error playing audio on upgrades button click:', err);
                    }
                    
                    this.openPermanentUpgradesShop();
                });

            // Добавляем интерактивность кнопке пополнения эмблем
            replenishButton.setInteractive()
                .on('pointerover', () => {
                    replenishButton.setScale(1.1);
                })
                .on('pointerout', () => {
                    replenishButton.setScale(1);
                })
                .on('pointerdown', () => {
                    try {
                        // Проигрываем звук нажатия при наличии
                        if (this.audioManager.hasSoundCached('playButton')) {
                            this.audioManager.playSound('playButton');
                        }
                        
                        // Navigate to emblems shop scene
                        this.openEmblemsShop();
                    } catch (err) {
                        console.error('Error on replenish emblems button click:', err);
                    }
                });

            // Добавляем интерактивность кнопке
            playButton.setInteractive()
                .on('pointerover', () => {
                    playButton.setScale(1.2);
                })
                .on('pointerout', () => {
                    playButton.setScale(1);
                })
                .on('pointerdown', () => {
                    try {
                        // On iOS, start playing music on first interaction
                        if (isIOS && !this.audioManager.isMusicPlaying()) {
                            this.audioManager.playMusic();
                        }
                        
                        // Play sound before starting the game (only if available)
                        if (this.audioManager.hasSoundCached('playButton')) {
                            this.audioManager.playSound('playButton');
                        }
                    } catch (err) {
                        console.error('Error playing audio on button click:', err);
                    }
                    
                    this.startGame();
                });
        };

        // Use a longer delay for iOS to ensure assets are loaded
        if (isIOS) {
            this.time.delayedCall(500, setupComponents);
        } else {
            setupComponents();
        }
            
        // Подписываемся на изменение размера экрана
        this.events.on('screenResize', this.handleScreenResize, this);
    }
    
    private handleScreenResize(gameScale: number): void {
        // Находим и обновляем размер монстра
        const monster = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Sprite && 
            (child as Phaser.GameObjects.Sprite).texture.key === 'enemy'
        ) as Phaser.GameObjects.Sprite;
        
        if (monster) {
            monster.setScale(0.8 * gameScale); // Обновляем размер при ресайзе
            monster.setPosition(this.screenManager.getScreenCenter().x, this.screenManager.getScreenCenter().y);
        }
        
        // Находим и обновляем размер кнопки
        const playButton = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Text && 
            (child as Phaser.GameObjects.Text).text === 'Play'
        ) as Phaser.GameObjects.Text;
        
        if (playButton) {
            const fontSize = this.screenManager.getLargeFontSize();
            playButton.setFontSize(fontSize);
            playButton.setPosition(
                this.screenManager.getScreenCenter().x,
                this.screenManager.getScreenSize().height * 0.6
            );
        }

        // Находим и обновляем размер кнопки для перехода в магазин постоянных улучшений
        const upgradesButton = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Text && 
            (child as Phaser.GameObjects.Text).text === 'Permanent Upgrades'
        ) as Phaser.GameObjects.Text;
        
        if (upgradesButton) {
            const upgradesButtonFontSize = this.screenManager.getResponsiveFontSize(32);
            upgradesButton.setFontSize(upgradesButtonFontSize);
            upgradesButton.setPosition(
                this.screenManager.getScreenCenter().x,
                this.screenManager.getScreenSize().height * 0.75
            );
        }

        // Находим и обновляем размер кнопки для пополнения эмблем
        const replenishButton = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Text && 
            (child as Phaser.GameObjects.Text).text === 'Replenish Emblems'
        ) as Phaser.GameObjects.Text;
        
        if (replenishButton) {
            const replenishButtonFontSize = this.screenManager.getResponsiveFontSize(32);
            replenishButton.setFontSize(replenishButtonFontSize);
            replenishButton.setPosition(
                this.screenManager.getScreenCenter().x,
                this.screenManager.getScreenSize().height * 0.85
            );
        }
    }

    update(time: number, delta: number): void {
        // Обновление логики если нужно
    }

    private startGame(): void {
        // Создаем затемнение через ScreenManager
        const fadeRect = this.screenManager.createFadeOverlay();
        
        // Store reference to scene for clean completion
        const currentScene = this;

        // Анимируем затемнение и масштабирование кнопки
        this.tweens.add({
            targets: fadeRect,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: function() {
                // Ensure we always proceed to GameScene even if other animations fail
                currentScene.time.delayedCall(600, () => {
                    currentScene.scene.start('GameScene');
                });
            }
        });

        // Находим монстра и анимируем его исчезновение
        const monster = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Sprite && 
            (child as Phaser.GameObjects.Sprite).texture.key === 'enemy'
        ) as Phaser.GameObjects.Sprite;

        if (monster) {
            this.tweens.add({
                targets: monster,
                scale: 0.5 * this.screenManager.getGameScale(), // Учитываем масштаб игры
                alpha: 0,
                duration: 500,
                ease: 'Power2'
            });
        }

        // Находим кнопку "Играть" и анимируем её
        const playButton = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Text && 
            (child as Phaser.GameObjects.Text).text === 'Play'
        ) as Phaser.GameObjects.Text;

        if (playButton) {
            this.tweens.add({
                targets: playButton,
                scale: 1.5,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    // После завершения анимации запускаем GameScene
                    this.scene.start('GameScene');
                }
            });
        }
    }

    private openPermanentUpgradesShop(): void {
        // Создаем затемнение через ScreenManager
        const fadeRect = this.screenManager.createFadeOverlay();
        
        // Store reference to scene for clean completion
        const currentScene = this;

        // Анимируем затемнение
        this.tweens.add({
            targets: fadeRect,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: function() {
                // Переходим в сцену магазина постоянных улучшений
                currentScene.time.delayedCall(600, () => {
                    currentScene.scene.start('PermanentUpgradesShopScene');
                });
            }
        });
    }

    private openEmblemsShop(): void {
        // Создаем затемнение через ScreenManager
        const fadeRect = this.screenManager.createFadeOverlay();
        
        // Store reference to scene for clean completion
        const currentScene = this;

        // Анимируем затемнение
        this.tweens.add({
            targets: fadeRect,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: function() {
                // Переходим в сцену магазина эмблем
                currentScene.time.delayedCall(600, () => {
                    currentScene.scene.start('EmblemsShopScene');
                });
            }
        });
    }

    destroy(): void {
        // Отписываемся от событий
        this.events.off('screenResize', this.handleScreenResize, this);
        
        if (this.screenManager) {
            this.screenManager.destroy();
        }
    }
}
import Phaser from 'phaser';
import AudioManager from '../managers/AudioManager';
import { IScene } from '../types/IScene';
import { ScreenManager } from '../managers/ScreenManager';
import { UIManager } from '../managers/UIManager';
import { EmblemManager } from '../managers/EmblemManager';
import { MysticalBackground } from '../objects/backgrounds/MysticalBackground';

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
        this.scene.launch('BackgroundScene');
        this.scene.bringToTop('MenuScene');
        console.log('[MenuScene] create() start');
        // Initialize ScreenManager
        this.screenManager = new ScreenManager(this);
        console.log('[MenuScene] ScreenManager initialized');
        
        // Initialize EmblemManager
        this.emblemManager = EmblemManager.getInstance();
        
        // Check if we're running on iOS for special handling
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        
        try {
            // Initialize AudioManager but don't play music immediately on iOS
            this.audioManager = AudioManager.getInstance(this);
            console.log('[MenuScene] AudioManager initialized');
            
            if (isIOS) {
                console.log('[MenuScene] Running on iOS - special handling');
                // On iOS, we'll play music only after user interaction
            } else {
                // On non-iOS platforms, play music immediately if available
                if (this.audioManager.hasSoundCached('gameMusic')) {
                    this.audioManager.playMusic();
                    console.log('[MenuScene] Playing gameMusic');
                } else {
                    console.warn('[MenuScene] Unable to play music - gameMusic not found in cache');
                }
            }
        } catch (err) {
            console.error('[MenuScene] Error setting up audio:', err);
        }

        // Force a small delay on iOS to ensure textures are loaded
        const setupComponents = () => {
            // Получаем размеры экрана через ScreenManager
            const { width, height } = this.screenManager.getScreenSize();
            const gameScale = this.screenManager.getGameScale();
            const center = this.screenManager.getScreenCenter();

            // Удаляем монстра из меню

            // Создаем кнопку "Играть" с использованием адаптивного шрифта
            const fontSize = this.screenManager.getLargeFontSize();
            const usualButton = this.screenManager.createText(
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
                'Initial Upgrades', 
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
                        if (this.audioManager.hasSoundCached('usualButton')) {
                            this.audioManager.playSound('usualButton');
                        }
                    } catch (err) {
                        console.error('Error playing audio on upgrades button click:', err);
                    }
                    
                    this.openInitialUpgradesShop();
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
                        if (this.audioManager.hasSoundCached('usualButton')) {
                            this.audioManager.playSound('usualButton');
                        }
                        
                        // Navigate to emblems shop scene
                        this.openEmblemsShop();
                    } catch (err) {
                        console.error('Error on replenish emblems button click:', err);
                    }
                });

            // Добавляем интерактивность кнопке
            usualButton.setInteractive()
                .on('pointerover', () => {
                    usualButton.setScale(1.2);
                })
                .on('pointerout', () => {
                    usualButton.setScale(1);
                })
                .on('pointerdown', () => {
                    try {
                        // On iOS, start playing music on first interaction
                        if (isIOS && !this.audioManager.isMusicPlaying()) {
                            this.audioManager.playMusic();
                        }
                        
                        // Play sound before starting the game (only if available)
                        if (this.audioManager.hasSoundCached('usualButton')) {
                            this.audioManager.playSound('usualButton');
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
        console.log('[MenuScene] create() end');
    }
    
    private handleScreenResize(gameScale: number): void {
        // Удалили обновление монстра при ресайзе
        
        // Находим и обновляем размер кнопки
        const usualButton = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Text && 
            (child as Phaser.GameObjects.Text).text === 'Play🎮'
        ) as Phaser.GameObjects.Text;
        
        if (usualButton) {
            const fontSize = this.screenManager.getLargeFontSize();
            usualButton.setFontSize(fontSize);
            usualButton.setPosition(
                this.screenManager.getScreenCenter().x,
                this.screenManager.getScreenSize().height * 0.6
            );
        }

        // Находим и обновляем размер кнопки для перехода в магазин постоянных улучшений
        const upgradesButton = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Text && 
            (child as Phaser.GameObjects.Text).text === 'Initial Upgrades'
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
        const usualButton = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Text && 
            (child as Phaser.GameObjects.Text).text === 'Play🎮'
        ) as Phaser.GameObjects.Text;

        if (usualButton) {
            this.tweens.add({
                targets: usualButton,
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

    private openInitialUpgradesShop(): void {
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
                    currentScene.scene.start('InitialUpgradesShopScene');
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
        // MysticalBackground больше не уничтожаем!
        try {
            // Handle mystical background cleanup if it exists
            // const mysticalBackground = this.data?.get('mysticalBackground');
            // if (mysticalBackground && typeof mysticalBackground.destroy === 'function') {
            //     mysticalBackground.destroy();
            // }
            
            // Clean up screen manager
            if (this.screenManager) {
                this.screenManager.destroy();
            }
            
            // Clean up audio manager events
            if (this.audioManager) {
                // Don't destroy the audio manager instance since it's shared
                // Just remove any scene-specific events
            }
            
            this.events.off('screenResize', this.handleScreenResize, this);
        } catch (err) {
            console.error('Error in MenuScene destroy:', err);
        }
    }
}
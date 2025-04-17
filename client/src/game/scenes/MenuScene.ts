import Phaser from 'phaser';
import AudioManager from '../managers/AudioManager';
import { IScene } from '../types/IScene';
import { ScreenManager } from '../managers/ScreenManager';
import { UIManager } from '../managers/UIManager';
import { EmblemManager } from '../managers/EmblemManager';
import { MysticalBackground } from '../objects/backgrounds/MysticalBackground';
import eventBus from '../../services/eventBus';

export default class MenuScene extends Phaser.Scene implements IScene {
    private audioManager!: AudioManager;
    public screenManager!: ScreenManager;
    public uiManager!: UIManager;

    constructor() {
        super({ key: 'MenuScene' });
    }

    preload(): void {
        // Загрузка ресурсов если нужно
    }

    create(): void {
        console.log('[MenuScene] create() called');
        eventBus.emit('vue-show-menu');
        this.scene.launch('BackgroundScene');
        console.log('[MenuScene] create() start');
        // Initialize ScreenManager
        this.screenManager = new ScreenManager(this);
        console.log('[MenuScene] ScreenManager initialized');
        
        // Initialize EmblemManager
        
        // Check if we're running on iOS or in Telegram WebApp for special handling
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isTelegramWebApp = /Telegram/.test(navigator.userAgent) || (window as any).Telegram !== undefined;
        const needsUserInteraction = isIOS || isTelegramWebApp;
        
        try {
            // Initialize AudioManager but don't play music immediately on iOS/Telegram
            this.audioManager = AudioManager.getInstance(this);
            console.log('[MenuScene] AudioManager initialized');
            
            if (needsUserInteraction) {
                console.log('[MenuScene] Running on iOS or Telegram WebApp - special handling');
                // Музыка будет запущена только после взаимодействия пользователя
            } else {
                // На остальных платформах музыка запускается сразу
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

        // Подписываемся на события от Vue-кнопок через eventBus
        eventBus.on('vue-menu-play', this.startGameHandler);
        eventBus.on('vue-menu-upgrades', this.openInitialUpgradesShopHandler);
        eventBus.on('vue-menu-emblems', this.openEmblemsShopHandler);
        console.log('[MenuScene] eventBus listeners set');

        // Подписываемся на изменение размера экрана
        this.events.on('screenResize', this.handleScreenResize, this);
        console.log('[MenuScene] create() end');
    }

    // Обработчики для отписки
    private startGameHandler = () => {
        console.log('[MenuScene] startGameHandler (vue-menu-play)');
        if (this.audioManager && this.audioManager.hasSoundCached('usualButton')) {
            this.audioManager.playSound('usualButton');
        }
        this.startGame();
    };
    private openInitialUpgradesShopHandler = () => {
        console.log('[MenuScene] openInitialUpgradesShopHandler (vue-menu-upgrades)');
        if (this.audioManager && this.audioManager.hasSoundCached('usualButton')) {
            this.audioManager.playSound('usualButton');
        }
        this.openInitialUpgradesShop();
    };
    private openEmblemsShopHandler = () => {
        console.log('[MenuScene] openEmblemsShopHandler (vue-menu-emblems)');
        if (this.audioManager && this.audioManager.hasSoundCached('usualButton')) {
            this.audioManager.playSound('usualButton');
        }
        this.openEmblemsShop();
    };

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

    private startGame(): void {
        console.log('[MenuScene] startGame()');
        // Создаем затемнение через ScreenManager
        const fadeRect = this.screenManager.createFadeOverlay();

        // Анимируем затемнение и масштабирование кнопки
        this.tweens.add({
            targets: fadeRect,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.time.delayedCall(100, () => {
                    console.log('[MenuScene] emit vue-hide-menu');
                    eventBus.emit('vue-hide-menu');
                    this.scene.start('GameScene');
                });
            }
        });

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
            });
        }
        console.log('[MenuScene] startGame() end');
    }

    private openInitialUpgradesShop(): void {
        console.log('[MenuScene] openInitialUpgradesShop()');
        // Создаем затемнение через ScreenManager
        const fadeRect = this.screenManager.createFadeOverlay();

        // Анимируем затемнение
        this.tweens.add({
            targets: fadeRect,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.time.delayedCall(600, () => {
                    console.log('[MenuScene] emit vue-hide-menu');
                    eventBus.emit('vue-hide-menu');
                    this.scene.start('InitialUpgradesShopScene');
                });
            }
        });
    }

    private openEmblemsShop(): void {
        console.log('[MenuScene] openEmblemsShop()');
        // Создаем затемнение через ScreenManager
        const fadeRect = this.screenManager.createFadeOverlay();

        // Анимируем затемнение
        this.tweens.add({
            targets: fadeRect,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.time.delayedCall(600, () => {
                    console.log('[MenuScene] emit vue-hide-menu');
                    eventBus.emit('vue-hide-menu');
                    this.scene.start('EmblemsShopScene');
                });
            }
        });
    }

    destroy(): void {
        console.log('[MenuScene] destroy called');
        console.log('[MenuScene] emit vue-hide-menu');
        eventBus.emit('vue-hide-menu');
        try {
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
            // Отписываемся от событий eventBus
            eventBus.off('vue-menu-play', this.startGameHandler);
            eventBus.off('vue-menu-upgrades', this.openInitialUpgradesShopHandler);
            eventBus.off('vue-menu-emblems', this.openEmblemsShopHandler);
            console.log('[MenuScene] eventBus listeners removed');
        } catch (err) {
            console.error('Error in MenuScene destroy:', err);
        }
    }

    shutdown(): void {
        // Вызываем скрытие Vue-меню при остановке сцены
        console.log('[MenuScene] shutdown() start');
        console.log('[MenuScene] emit vue-hide-menu');
        eventBus.emit('vue-hide-menu');
    }
}
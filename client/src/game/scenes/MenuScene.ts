import Phaser from 'phaser';
import AudioManager from '../managers/AudioManager';
import { IScene } from '../types/IScene';
import { ScreenManager } from '../managers/ScreenManager';
import { useSceneStore } from '../../stores/scene';

export default class MenuScene extends Phaser.Scene implements IScene {
    private audioManager!: AudioManager;
    public screenManager!: ScreenManager;

    constructor() {
        super({ key: 'MenuScene' });
    }

    preload(): void {
        // Загрузка ресурсов если нужно
    }

    create(): void {
        console.log('[MenuScene] create() called');

        // Initialize managers
        this.screenManager = new ScreenManager(this);
        this.audioManager = AudioManager.getInstance(this);

        // Launch background scene
        this.scene.launch('BackgroundScene');

        // Set up audio
        try {
            this.audioManager.playMusic();
            console.log('[MenuScene] Music started.');
        } catch (err) {
            console.error('[MenuScene] Error playing music:', err);
        }

        // Update Pinia store to show menu
        const store = useSceneStore();
        console.log('[MenuScene] Calling store.setView("menu")');
        store.setView('menu');
        console.log('[MenuScene] store.setView("menu") called');

        // Register game instance in window object for Vue components to access
        // This ensures Vue components can access Phaser methods
        (window as any).PhaserGame = this.game;

        // Listen for navigation events from buttons
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Button event handlers will be set up in Vue components
        // They will update the Pinia store which we can react to
    }

    // Make this method public so Vue components can call it
    public startGame(): void {
        // Create fade overlay
        const fadeRect = this.screenManager.createFadeOverlay();

        // Animate fade and start game scene
        this.tweens.add({
            targets: fadeRect,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Update store and start game scene
                const store = useSceneStore();
                store.setView('game');
                this.scene.start('GameScene');
            }
        });
    }

    // Make this method public so Vue components can call it
    public openInitialUpgradesShop(): void {
        // Create fade overlay
        const fadeRect = this.screenManager.createFadeOverlay();

        // Animate fade
        this.tweens.add({
            targets: fadeRect,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Update store and start upgrades scene
                const store = useSceneStore();
                store.setView('upgrades');
                this.scene.start('InitialUpgradesShopScene');
            }
        });
    }

    // Make this method public so Vue components can call it
    public openEmblemsShop(): void {
        // Create fade overlay
        const fadeRect = this.screenManager.createFadeOverlay();

        // Animate fade
        this.tweens.add({
            targets: fadeRect,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Update store and start emblems scene
                const store = useSceneStore();
                store.setView('emblems');
                this.scene.start('EmblemsShopScene');
            }
        });
    }

    destroy(): void {
        // Clean up resources
        if (this.screenManager) {
            this.screenManager.destroy();
        }
    }

    shutdown(): void {
        // Update store when scene shuts down
        const store = useSceneStore();
        if (store.view === 'menu') {
            store.setView('none');
        }

        // Stop audio retry mechanism when scene shuts down
        if (this.audioManager) {
            this.audioManager.stopRetryMechanism();
        }

        // Remove game reference from window
        if ((window as any).PhaserGame === this.game) {
            (window as any).PhaserGame = null;
        }
    }
}
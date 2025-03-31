import Phaser from 'phaser';
import AudioManager from '../managers/AudioManager';
import { IScene } from '../types/IScene';
import { ScreenManager } from '../managers/ScreenManager';
import { UIManager } from '../managers/UIManager';

export default class PermanentUpgradesShopScene extends Phaser.Scene implements IScene {
    private audioManager!: AudioManager;
    public screenManager!: ScreenManager;
    public uiManager!: UIManager;

    constructor() {
        super({ key: 'PermanentUpgradesShopScene' });
    }

    preload(): void {
        // Preload resources if needed
    }

    create(): void {
        // Initialize ScreenManager
        this.screenManager = new ScreenManager(this);
        
        // Check if we're running on iOS for special handling
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        
        try {
            // Initialize AudioManager
            this.audioManager = AudioManager.getInstance(this);
        } catch (err) {
            console.error('Error setting up audio in PermanentUpgradesShopScene:', err);
        }

        // Create background using ScreenManager
        this.screenManager.setupBackground();

        // Get screen dimensions
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();

        // Create title text
        const titleFontSize = this.screenManager.getResponsiveFontSize(72);
        const title = this.add.text(center.x, height * 0.15, 'Permanent Upgrades Shop', {
            fontSize: `${titleFontSize}px`,
            color: '#ffffff',
            fontFamily: 'pixelFont',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Create back button
        const backButtonFontSize = this.screenManager.getResponsiveFontSize(48);
        const backButton = this.add.text(center.x, height * 0.9, 'Back to Menu', {
            fontSize: `${backButtonFontSize}px`,
            color: '#ffffff',
            fontFamily: 'pixelFont'
        }).setOrigin(0.5);

        // Add interactivity to back button
        backButton.setInteractive()
            .on('pointerover', () => {
                backButton.setScale(1.2);
            })
            .on('pointerout', () => {
                backButton.setScale(1);
            })
            .on('pointerdown', () => {
                try {
                    // Play sound if available
                    if (this.audioManager.hasSoundCached('playButton')) {
                        this.audioManager.playSound('playButton');
                    }
                } catch (err) {
                    console.error('Error playing audio on button click:', err);
                }
                
                this.returnToMenu();
            });

        // Subscribe to screen resize events
        this.events.on('screenResize', this.handleScreenResize, this);
    }

    private handleScreenResize(gameScale: number): void {
        // Get updated screen dimensions
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        
        // Update title position and size
        const title = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Text && 
            (child as Phaser.GameObjects.Text).text === 'Permanent Upgrades Shop'
        ) as Phaser.GameObjects.Text;
        
        if (title) {
            const titleFontSize = this.screenManager.getResponsiveFontSize(72);
            title.setFontSize(titleFontSize);
            title.setPosition(center.x, height * 0.15);
        }
        
        // Update back button position and size
        const backButton = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Text && 
            (child as Phaser.GameObjects.Text).text === 'Back to Menu'
        ) as Phaser.GameObjects.Text;
        
        if (backButton) {
            const backButtonFontSize = this.screenManager.getResponsiveFontSize(48);
            backButton.setFontSize(backButtonFontSize);
            backButton.setPosition(center.x, height * 0.9);
        }
    }

    update(time: number, delta: number): void {
        // Update logic if needed
    }

    private returnToMenu(): void {
        // Create fade overlay for transition
        const fadeRect = this.screenManager.createFadeOverlay();
        
        // Store reference to scene for clean completion
        const currentScene = this;

        // Animate fade-out transition
        this.tweens.add({
            targets: fadeRect,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: function() {
                // Start the menu scene
                currentScene.time.delayedCall(600, () => {
                    currentScene.scene.start('MenuScene');
                });
            }
        });
    }

    destroy(): void {
        // Unsubscribe from events
        this.events.off('screenResize', this.handleScreenResize, this);
        
        if (this.screenManager) {
            this.screenManager.destroy();
        }
    }
} 
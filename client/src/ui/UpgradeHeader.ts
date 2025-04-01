import Phaser from 'phaser';
import { ScreenManager } from '../managers/ScreenManager';

export interface UpgradeHeaderConfig {
    width: number;
    height: number;
    scene: Phaser.Scene;
    onClose: () => void;
    screenManager?: ScreenManager;
}

export class UpgradeHeader extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private titleText: Phaser.GameObjects.Text;
    private closeButton: Phaser.GameObjects.Text;
    private goldIcon: Phaser.GameObjects.Image;
    private goldText: Phaser.GameObjects.Text;
    private screenManager: ScreenManager;

    constructor(config: UpgradeHeaderConfig) {
        super(config.scene, 0, 0);
        
        // Initialize ScreenManager
        this.screenManager = config.screenManager || new ScreenManager(config.scene);
        
        // Get responsive sizing
        const gameScale = this.screenManager.getGameScale();
        const titleFontSize = this.screenManager.getResponsiveFontSize(32);
        const buttonFontSize = this.screenManager.getResponsiveFontSize(24);
        const goldFontSize = this.screenManager.getResponsiveFontSize(28);
        const padding = this.screenManager.getResponsivePadding(40);
        const iconScale = 0.6 * gameScale;

        // Create background
        this.background = new Phaser.GameObjects.Rectangle(
            this.scene,
            0,
            0,
            config.width,
            config.height,
            0x000000,
            1
        ).setOrigin(0);

        // Create title
        this.titleText = new Phaser.GameObjects.Text(
            this.scene,
            config.width / 2,
            config.height / 2,
            'Улучшения замка',
            {
                fontFamily: 'pixelFont',
                fontSize: `${titleFontSize}px`,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: Math.max(2, Math.round(4 * gameScale))
            }
        ).setOrigin(0.5);

        // Create close button
        this.closeButton = new Phaser.GameObjects.Text(
            this.scene,
            config.width - padding,
            config.height / 2,
            'X',
            {
                fontFamily: 'pixelFont',
                fontSize: `${buttonFontSize}px`,
                color: '#ffffff'
            }
        )
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.closeButton.setColor('#ff0000'))
            .on('pointerout', () => this.closeButton.setColor('#ffffff'))
            .on('pointerdown', config.onClose);

        // Create gold display
        this.goldIcon = new Phaser.GameObjects.Image(
            this.scene,
            this.screenManager.getResponsivePadding(20),
            config.height / 2,
            'gold'
        )
            .setScale(iconScale)
            .setOrigin(0, 0.5);

        this.goldText = new Phaser.GameObjects.Text(
            this.scene,
            this.screenManager.getResponsivePadding(70),
            config.height / 2,
            '0',
            {
                fontFamily: 'pixelFont',
                fontSize: `${goldFontSize}px`,
                color: '#ffdd00',
                stroke: '#000000',
                strokeThickness: Math.max(2, Math.round(4 * gameScale))
            }
        ).setOrigin(0, 0.5);

        // Add all elements to container
        this.add([
            this.background,
            this.titleText,
            this.closeButton,
            this.goldIcon,
            this.goldText
        ]);

        // Subscribe to screen resize events
        this.scene.events.on('screenResize', this.handleScreenResize, this);

        // Add container to scene
        this.scene.add.existing(this);
    }
    
    private handleScreenResize(gameScale: number): void {
        // Update font sizes
        const titleFontSize = this.screenManager.getResponsiveFontSize(32);
        const buttonFontSize = this.screenManager.getResponsiveFontSize(24);
        const goldFontSize = this.screenManager.getResponsiveFontSize(28);
        const padding = this.screenManager.getResponsivePadding(40);
        const iconScale = 0.6 * gameScale;
        
        // Update text styles
        this.titleText.setFontSize(titleFontSize);
        this.closeButton.setFontSize(buttonFontSize);
        this.goldText.setFontSize(goldFontSize);
        
        // Update positions
        this.closeButton.setPosition(
            this.background.width - padding,
            this.background.height / 2
        );
        
        this.goldIcon
            .setPosition(this.screenManager.getResponsivePadding(20), this.background.height / 2)
            .setScale(iconScale);
            
        this.goldText.setPosition(
            this.screenManager.getResponsivePadding(70),
            this.background.height / 2
        );
    }

    updateGold(amount: number): void {
        this.goldText.setText(Math.floor(amount).toString());
    }
    
    destroy(fromScene?: boolean): void {
        // Clean up event listeners
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        super.destroy(fromScene);
    }
} 
import Phaser from 'phaser';

export interface UpgradeHeaderConfig {
    width: number;
    height: number;
    scene: Phaser.Scene;
    onClose: () => void;
}

export class UpgradeHeader extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private titleText: Phaser.GameObjects.Text;
    private closeButton: Phaser.GameObjects.Text;
    private coinIcon: Phaser.GameObjects.Image;
    private coinText: Phaser.GameObjects.Text;

    constructor(config: UpgradeHeaderConfig) {
        super(config.scene, 0, 0);

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
                fontSize: '32px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        // Create close button
        this.closeButton = new Phaser.GameObjects.Text(
            this.scene,
            config.width - 40,
            config.height / 2,
            'X',
            {
                fontFamily: 'pixelFont',
                fontSize: '24px',
                color: '#ffffff'
            }
        )
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.closeButton.setColor('#ff0000'))
            .on('pointerout', () => this.closeButton.setColor('#ffffff'))
            .on('pointerdown', config.onClose);

        // Create coin display
        this.coinIcon = new Phaser.GameObjects.Image(
            this.scene,
            20,
            config.height / 2,
            'coin'
        )
            .setScale(0.6)
            .setOrigin(0, 0.5);

        this.coinText = new Phaser.GameObjects.Text(
            this.scene,
            70,
            config.height / 2,
            '0',
            {
                fontFamily: 'pixelFont',
                fontSize: '28px',
                color: '#ffdd00',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0, 0.5);

        // Add all elements to container
        this.add([
            this.background,
            this.titleText,
            this.closeButton,
            this.coinIcon,
            this.coinText
        ]);

        // Add container to scene
        this.scene.add.existing(this);
    }

    updateCoins(amount: number): void {
        this.coinText.setText(Math.floor(amount).toString());
    }
} 
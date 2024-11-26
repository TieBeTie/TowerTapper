import Phaser from 'phaser';
import { UpgradeManager } from '../managers/UpgradeManager';
import { UpgradeType } from '../types/UpgradeType';

export interface UpgradeShopConfig {
    width: number;
    scene: Phaser.Scene;
    y: number;
    upgradeManager: UpgradeManager;
}

export class UpgradeShop extends Phaser.GameObjects.Container {
    private upgradeManager: UpgradeManager;

    constructor(config: UpgradeShopConfig) {
        super(config.scene, 0, config.y);
        this.upgradeManager = config.upgradeManager;

        this.createUpgradeButtons(config.width);
        this.scene.add.existing(this);
    }

    private createUpgradeButtons(width: number): void {
        const spacing = 120;
        const upgrades = this.upgradeManager.getAvailableUpgrades();

        upgrades.forEach((upgrade, index) => {
            const y = spacing * index;

            // Background for each upgrade (semi-transparent)
            const buttonBg = new Phaser.GameObjects.Rectangle(
                this.scene,
                width / 2,
                y,
                width * 0.9,
                100,
                0x000000,
                0.3
            )
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => buttonBg.setFillStyle(0xffffff, 0.1))
                .on('pointerout', () => buttonBg.setFillStyle(0x000000, 0.3));

            // Upgrade name
            const name = new Phaser.GameObjects.Text(
                this.scene,
                width * 0.1,
                y - 25,
                upgrade.name,
                {
                    fontFamily: 'pixelFont',
                    fontSize: '24px',
                    color: '#ffffff'
                }
            );

            // Upgrade description
            const description = new Phaser.GameObjects.Text(
                this.scene,
                width * 0.1,
                y + 5,
                upgrade.description,
                {
                    fontFamily: 'pixelFont',
                    fontSize: '16px',
                    color: '#aaaaaa'
                }
            );

            // Cost display
            const cost = this.upgradeManager.getUpgradeCost(upgrade.type);
            const costContainer = new Phaser.GameObjects.Container(
                this.scene,
                width * 0.6,
                y
            );

            const costIcon = new Phaser.GameObjects.Image(
                this.scene,
                0,
                0,
                'coin'
            ).setScale(0.6);

            const costText = new Phaser.GameObjects.Text(
                this.scene,
                35,
                -12,
                cost.toString(),
                {
                    fontFamily: 'pixelFont',
                    fontSize: '24px',
                    color: '#ffdd00'
                }
            );

            costContainer.add([costIcon, costText]);

            // Buy button
            const buyButton = new Phaser.GameObjects.Text(
                this.scene,
                width * 0.8,
                y - 12,
                'Купить',
                {
                    fontFamily: 'pixelFont',
                    fontSize: '20px',
                    color: '#ffffff',
                    backgroundColor: '#4CAF50',
                    padding: { x: 12, y: 8 }
                }
            )
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.handleUpgrade(upgrade.type));

            this.add([buttonBg, name, description, costContainer, buyButton]);
        });
    }

    private handleUpgrade(type: UpgradeType): void {
        const success = this.upgradeManager.purchaseUpgrade(type);
        if (success) {
            const gameScene = this.scene.scene.get('GameScene');
            (gameScene as any).tower?.upgrade();
            // Emit event for coin update
            this.scene.events.emit('upgradePurchased');
        }
    }
} 
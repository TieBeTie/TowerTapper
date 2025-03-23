import Phaser from 'phaser';
import { UIComponent, UIComponentConfig } from '../UIComponent';
import { Button } from './Button';

interface UpgradeCardConfig extends UIComponentConfig {
    title: string;
    description: string;
    cost: number;
    onPurchase: () => void;
    isPurchased?: boolean;
}

export class UpgradeCard extends UIComponent {
    private title: string;
    private description: string;
    private cost: number;
    private onPurchase: () => void;
    private isPurchased: boolean;
    private background!: Phaser.GameObjects.Rectangle;
    private titleText!: Phaser.GameObjects.Text;
    private descriptionText!: Phaser.GameObjects.Text;
    private costText!: Phaser.GameObjects.Text;
    private purchaseButton!: Button;

    constructor(config: UpgradeCardConfig) {
        super(config);
        this.title = config.title;
        this.description = config.description;
        this.cost = config.cost;
        this.onPurchase = config.onPurchase;
        this.isPurchased = config.isPurchased || false;
        this.init();
    }

    init(): void {
        // Create background
        this.background = this.scene.add.rectangle(0, 0, this.width, this.height, 0x2a2a2a);
        this.add(this.background);

        // Create title
        this.titleText = this.scene.add.text(0, 0, this.title, {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'pixelFont',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.add(this.titleText);

        // Create description
        this.descriptionText = this.scene.add.text(0, 0, this.description, {
            fontSize: '24px',
            color: '#cccccc',
            fontFamily: 'pixelFont',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: 300 }
        }).setOrigin(0.5);
        this.add(this.descriptionText);

        // Create cost text
        this.costText = this.scene.add.text(0, 0, `Cost: ${this.cost}`, {
            fontSize: '28px',
            color: '#ffff00',
            fontFamily: 'pixelFont',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.add(this.costText);

        // Create purchase button
        this.purchaseButton = new Button({
            scene: this.scene,
            text: this.isPurchased ? 'Purchased' : 'Purchase',
            onClick: this.onPurchase,
            width: this.width - this.getPadding() * 2,
            height: 40,
            backgroundColor: this.isPurchased ? 0x666666 : 0x4a4a4a
        });
        this.add(this.purchaseButton);

        // Layout
        this.layout();
    }

    layout(): void {
        super.layout();
        this.background.setSize(this.width, this.height);

        // Position title
        this.titleText.setPosition(0, this.getPadding());

        // Position description
        this.descriptionText.setPosition(0, this.titleText.y + this.titleText.height + this.getPadding());

        // Position cost text
        this.costText.setPosition(0, this.descriptionText.y + this.descriptionText.height + this.getPadding());

        // Position purchase button
        this.purchaseButton.setPosition(0, this.costText.y + this.costText.height + this.getPadding());
    }

    destroy(fromScene?: boolean): void {
        if (this.background) {
            this.background.destroy();
        }
        if (this.titleText) {
            this.titleText.destroy();
        }
        if (this.descriptionText) {
            this.descriptionText.destroy();
        }
        if (this.costText) {
            this.costText.destroy();
        }
        if (this.purchaseButton) {
            this.purchaseButton.destroy();
        }
        super.destroy(fromScene);
    }
} 
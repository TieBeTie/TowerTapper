import { UIComponent } from './UIComponent';
import { UpgradeType } from '../../types/UpgradeType';
import { UpgradeManager } from '../../managers/UpgradeManager';

export interface UpgradeButtonConfig {
    scene: Phaser.Scene;
    upgradeType: UpgradeType;
    upgradeManager: UpgradeManager;
    fontSize: number;
    buttonText: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export class UpgradeButton extends UIComponent {
    private levelText!: Phaser.GameObjects.Text;
    private costText!: Phaser.GameObjects.Text;
    private costIcon!: Phaser.GameObjects.Image;
    private buttonText!: Phaser.GameObjects.Text;
    private upgradeInfoContainer!: Phaser.GameObjects.Container;
    
    // Сохраняем необходимые параметры в отдельных полях
    private readonly buttonTextValue: string;
    private readonly fontSizeValue: number;
    private readonly upgradeTypeValue: UpgradeType;
    private readonly upgradeManagerValue: UpgradeManager;

    constructor(config: UpgradeButtonConfig) {
        const componentConfig = {
            scene: config.scene,
            x: config.x,
            y: config.y,
            width: config.width,
            height: config.height
        };
        super(config.scene, componentConfig);
        
        // Инициализируем поля до вызова init()
        this.buttonTextValue = config.buttonText;
        this.fontSizeValue = config.fontSize;
        this.upgradeTypeValue = config.upgradeType;
        this.upgradeManagerValue = config.upgradeManager;
        this.createButton();
        this.setupInteractivity();
    }

    protected init(): void {}

    private createButton(): void {
        this.buttonText = this.scene.add.text(0, 0, this.buttonTextValue, {
            fontSize: `${this.fontSizeValue}px`,
            color: '#ffffff',
            fontFamily: 'pixelFont',
            align: 'center'
        }).setOrigin(1, 0.5);

        this.levelText = this.scene.add.text(0, -this.fontSizeValue/2, 'Level 1', {
            fontSize: `${this.fontSizeValue}px`,
            color: '#ffffff',
            fontFamily: 'pixelFont',
            align: 'center'
        }).setOrigin(0, 0.5);

        this.costIcon = this.scene.add.image(0, this.fontSizeValue/2, 'coin')
            .setDisplaySize(this.fontSizeValue, this.fontSizeValue)
            .setOrigin(0, 0.5);

        this.costText = this.scene.add.text(this.fontSizeValue * 1.2, this.fontSizeValue/2, '200', {
            fontSize: `${this.fontSizeValue}px`,
            color: '#FFD700',
            fontFamily: 'pixelFont',
            align: 'center'
        }).setOrigin(0, 0.5);

        const costContainer = this.scene.add.container(0, 0, [this.costIcon, this.costText]);
        this.upgradeInfoContainer = this.scene.add.container(0, 0, [this.levelText, costContainer]);
        this.upgradeInfoContainer.setPosition(this.buttonText.width + 20, 0);

        this.add([this.buttonText, this.upgradeInfoContainer]);
        this.updateUI();
    }

    private setupInteractivity(): void {
        this.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                const success = this.upgradeManagerValue.purchaseUpgrade(this.upgradeTypeValue);
                if (success) {
                    this.updateUI();
                }
            });
    }

    private updateUI(): void {
        console.log(this.upgradeManagerValue);
        console.log(this.upgradeTypeValue);
        const currentLevel = this.upgradeManagerValue.getState(this.upgradeTypeValue);
        const newCost = this.upgradeManagerValue.getUpgradeCost(this.upgradeTypeValue);
        
        this.levelText.setText(`Level ${currentLevel}`);
        this.costText.setText(newCost.toString());
    }
} 
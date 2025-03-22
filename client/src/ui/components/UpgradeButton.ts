import { UIComponent } from './UIComponent';
import { UpgradeType } from '../../types/UpgradeType';
import { UpgradeManager } from '../../managers/UpgradeManager';

// Константы для прозрачности
const BUTTON_BACKGROUND_ALPHA = 0.5;
const BUTTON_HOVER_ALPHA = 0.5;
const BUTTON_PRESSED_ALPHA = 0.5;

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
    // Константы для пропорций
    private static readonly BUTTON_PADDING_RATIO = 0.4;  // Отступы внутри кнопки как % от fontSize
    private static readonly COST_ICON_SIZE_RATIO = 0.5;    // Размер иконки монеты относительно fontSize
    private static readonly LEVEL_TEXT_OFFSET_RATIO = 0.5; // Отступ текста уровня как % от fontSize
    private static readonly COST_TEXT_OFFSET_RATIO = 1; // Отступ текста стоимости как % от fontSize

    private levelText!: Phaser.GameObjects.Text;
    private costText!: Phaser.GameObjects.Text;
    private costIcon!: Phaser.GameObjects.Image;
    private buttonText!: Phaser.GameObjects.Text;
    private background!: Phaser.GameObjects.Rectangle;
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
        
        this.buttonTextValue = config.buttonText;
        this.fontSizeValue = config.fontSize;
        this.upgradeTypeValue = config.upgradeType;
        this.upgradeManagerValue = config.upgradeManager;

        this.createButtonBackground();
        this.createButton();
        this.setupInteractivity();
    }

    private createButtonBackground(): void {
        // Создаем фон кнопки
        this.background = this.scene.add.rectangle(
            0,
            0,
            this.width,
            this.height,
            0x444444,
            BUTTON_BACKGROUND_ALPHA
        );
        this.background.setOrigin(0.5);
        this.add(this.background);
    }

    private createButton(): void {
        const padding = this.fontSizeValue * UpgradeButton.BUTTON_PADDING_RATIO;

        // Создаем основной текст кнопки
        this.buttonText = this.scene.add.text(
            -padding,  // Смещаем влево для центрирования
            0,
            this.buttonTextValue,
            {
                fontSize: `${this.fontSizeValue}px`,
                color: '#ffffff',
                fontFamily: 'pixelFont',
                align: 'center'
            }
        ).setOrigin(1, 0.5);

        // Создаем текст уровня
        this.levelText = this.scene.add.text(
            padding,  // Смещаем вправо от основного текста
            -this.fontSizeValue * UpgradeButton.LEVEL_TEXT_OFFSET_RATIO,
            'Level 1',
            {
                fontSize: `${this.fontSizeValue}px`,
                color: '#ffffff',
                fontFamily: 'pixelFont',
                align: 'center'
            }
        ).setOrigin(0, 0.5);

        // Создаем иконку монеты
        this.costIcon = this.scene.add.image(
            padding,
            this.fontSizeValue * UpgradeButton.LEVEL_TEXT_OFFSET_RATIO,
            'coin'
        )
        .setDisplaySize(
            this.fontSizeValue * UpgradeButton.COST_ICON_SIZE_RATIO,
            this.fontSizeValue * UpgradeButton.COST_ICON_SIZE_RATIO
        )
        .setOrigin(0, 0.5);

        // Создаем текст стоимости
        this.costText = this.scene.add.text(
            padding + this.fontSizeValue * UpgradeButton.COST_TEXT_OFFSET_RATIO,
            this.fontSizeValue * UpgradeButton.LEVEL_TEXT_OFFSET_RATIO,
            '200',
            {
                fontSize: `${this.fontSizeValue}px`,
                color: '#FFD700',
                fontFamily: 'pixelFont',
                align: 'center'
            }
        ).setOrigin(0, 0.5);

        // Создаем контейнер для стоимости
        const costContainer = this.scene.add.container(0, 0, [this.costIcon, this.costText]);
        
        // Создаем контейнер для информации об улучшении
        this.upgradeInfoContainer = this.scene.add.container(0, 0, [this.levelText, costContainer]);

        // Добавляем все элементы в кнопку
        this.add([this.buttonText, this.upgradeInfoContainer]);

        // Обновляем UI
        this.updateUI();
    }

    private setupInteractivity(): void {
        // Делаем интерактивным весь контейнер
        this.setInteractive(this.background, Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => {
                this.background.setFillStyle(0x666666, BUTTON_HOVER_ALPHA);
            })
            .on('pointerout', () => {
                this.background.setFillStyle(0x444444, BUTTON_BACKGROUND_ALPHA);
            })
            .on('pointerdown', () => {
                this.background.setFillStyle(0x333333, BUTTON_PRESSED_ALPHA);
                this.handleClick();
            })
            .on('pointerup', () => {
                this.background.setFillStyle(0x666666, BUTTON_HOVER_ALPHA);
            });
    }

    protected handleClick(): void {
        const success = this.upgradeManagerValue.purchaseUpgrade(this.upgradeTypeValue);
        if (success) {
            this.updateUI();
        }
    }

    protected init(): void {
        // Пустой метод, так как вся инициализация происходит в конструкторе
    }

    private updateUI(): void {
        const currentLevel = this.upgradeManagerValue.getState(this.upgradeTypeValue);
        const newCost = this.upgradeManagerValue.getUpgradeCost(this.upgradeTypeValue);
        
        this.levelText.setText(`Level ${currentLevel}`);
        this.costText.setText(newCost.toString());
    }
} 
import { UIComponent } from '../UIComponent';
import { SkillType, CurrencyType } from '../../types/SkillType';
import { UpgradeManager } from '../../managers/UpgradeManager';

// Константы для прозрачности
const BUTTON_BACKGROUND_ALPHA = 0.5;
const BUTTON_HOVER_ALPHA = 0.5;
const BUTTON_PRESSED_ALPHA = 0.5;

// Константы для цветов
const BUTTON_COLOR_DEFAULT = 0x444444;
const BUTTON_COLOR_HOVER = 0x666666;
const BUTTON_COLOR_PRESSED = 0x333333;
const BUTTON_COLOR_AFFORD = 0x45a049;
const BUTTON_COLOR_AFFORD_HOVER = 0x4CAF50;
const BUTTON_COLOR_AFFORD_PRESSED = 0x3d8b40;

export interface UpgradeButtonConfig {
    scene: Phaser.Scene;
    skillType: SkillType;
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
    private static readonly CORNER_RADIUS = 8; // Радиус закругления углов кнопки

    private levelText!: Phaser.GameObjects.Text;
    private costText!: Phaser.GameObjects.Text;
    private costIcon!: Phaser.GameObjects.Image;
    private buttonText!: Phaser.GameObjects.Text;
    private background!: Phaser.GameObjects.Graphics;
    private upgradeInfoContainer!: Phaser.GameObjects.Container;
    
    // Сохраняем необходимые параметры в отдельных полях
    private readonly buttonTextValue: string;
    private readonly fontSizeValue: number;
    private readonly skillTypeValue: SkillType;
    private readonly upgradeManagerValue: UpgradeManager;

    constructor(config: UpgradeButtonConfig) {
        super({
            scene: config.scene,
            x: config.x,
            y: config.y,
            width: config.width,
            height: config.height,
            fontSize: config.fontSize,
            responsive: true // Add responsive flag to use screen resizing
        });
        this.buttonTextValue = config.buttonText;
        this.fontSizeValue = config.fontSize;
        this.skillTypeValue = config.skillType;
        this.upgradeManagerValue = config.upgradeManager;

        // Set high depth to ensure visibility
        this.setDepth(2000);

        // Подписываемся на событие обновления монет
        this.scene.events.on('updateGold', this.updateUI, this);
        
        // Use only the specific event name for upgrade buttons to avoid recursive emissions
        this.scene.events.on('upgradeButtonsVisibility', this.forceVisibility, this);
        
        this.init();
    }

    init(): void {
        this.createButtonBackground();
        this.createButton();
        this.setupInteractivity();
        this.updateUI();
    }

    destroy(fromScene?: boolean): void {
        try {
            // Remove all event listeners
            if (this.scene && this.input) {
                this.removeInteractive();
                this.off('pointerover');
                this.off('pointerout');
                this.off('pointerdown');
                this.off('pointerup');
            }
            
            // Remove additional event listeners - only the specific upgrade button event
            if (this.scene) {
                this.scene.events.off('upgradeButtonsVisibility', this.forceVisibility, this);
            }
            
            // Mark component as inactive
            this.active = false;
            
            // Call parent destroy method
            super.destroy(fromScene);
        } catch (error) {
            console.warn('Error in destroy:', error);
        }
    }

    private createButtonBackground(): void {
        // Создаем фон кнопки с закругленными углами
        this.background = this.scene.add.graphics();
        this.updateButtonColor(); // Начальный цвет кнопки
        this.add(this.background);
        this.background.setDepth(1999); // Set high depth but below text
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
        ).setOrigin(1, 0.5).setDepth(2002); // Increased from 1001 to 2002

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
        ).setOrigin(0, 0.5).setDepth(2002); // Increased from 1001 to 2002

        // Создаем иконку монеты
        this.costIcon = this.scene.add.image(
            padding,
            this.fontSizeValue * UpgradeButton.LEVEL_TEXT_OFFSET_RATIO,
            'gold'
        )
        .setDisplaySize(
            this.fontSizeValue * UpgradeButton.COST_ICON_SIZE_RATIO,
            this.fontSizeValue * UpgradeButton.COST_ICON_SIZE_RATIO
        )
        .setOrigin(0, 0.5)
        .setDepth(2002); // Increased from 1001 to 2002

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
        ).setOrigin(0, 0.5).setDepth(2002); // Increased from 1001 to 2002

        // Создаем контейнер для стоимости
        const costContainer = this.scene.add.container(0, 0, [this.costIcon, this.costText])
            .setDepth(2002); // Increased from 1001 to 2002
        
        // Создаем контейнер для информации об улучшении
        this.upgradeInfoContainer = this.scene.add.container(0, 0, [this.levelText, costContainer])
            .setDepth(2002); // Increased from 1001 to 2002

        // Добавляем все элементы в кнопку
        this.add([this.buttonText, this.upgradeInfoContainer]);

        // Ensure all elements are visible
        this.buttonText.setVisible(true);
        this.levelText.setVisible(true);
        this.costIcon.setVisible(true);
        this.costText.setVisible(true);

        // Обновляем UI
        this.updateUI();
    }

    private setupInteractivity(): void {
        try {
            // Skip if the button or background is invalid
            if (!this.scene || !this.background || !this.active) {
                return;
            }
            
            // Делаем интерактивным весь контейнер с учетом координат
            this.setSize(this.width, this.height);
            this.setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    if (!this.scene || !this.background) return;
                    const color = this.canAffordUpgrade() ? BUTTON_COLOR_AFFORD_HOVER : BUTTON_COLOR_HOVER;
                    this.updateButtonColor(color, BUTTON_HOVER_ALPHA);
                })
                .on('pointerout', () => {
                    if (!this.scene || !this.background) return;
                    this.updateButtonColor();
                })
                .on('pointerdown', () => {
                    if (!this.scene || !this.background) return;
                    const color = this.canAffordUpgrade() ? BUTTON_COLOR_AFFORD_PRESSED : BUTTON_COLOR_PRESSED;
                    this.updateButtonColor(color, BUTTON_PRESSED_ALPHA);
                    this.handleClick();
                })  
                .on('pointerup', () => {
                    if (!this.scene || !this.background) return;
                    const color = this.canAffordUpgrade() ? BUTTON_COLOR_AFFORD_HOVER : BUTTON_COLOR_HOVER;
                    this.updateButtonColor(color, BUTTON_HOVER_ALPHA);
                });
        } catch (error) {
            console.warn('Error in setupInteractivity:', error);
        }
    }

    private canAffordUpgrade(): boolean {
        try {
            // Safety check for scene existence
            if (!this.scene) {
                console.warn('UpgradeButton: scene не существует');
                return false;
            }
            
            const cost = this.upgradeManagerValue.getSkillCost(this.skillTypeValue, CurrencyType.GOLD);
            
            // Check if the scene has a scene property and it's properly initialized
            if (!this.scene.scene || typeof this.scene.scene.get !== 'function') {
                console.warn('UpgradeButton: scene.scene не существует или get не является функцией');
                return false;
            }
            
            const gameScene = this.scene.scene.get('GameScene');
            if (!gameScene) {
                console.warn('UpgradeButton: gameScene не существует');
                return false;
            }
            
            const gold = (gameScene as any).goldManager?.gold_count || 0;
            const canAfford = gold >= cost;
            
            console.log(`UpgradeButton: Проверка доступности для ${this.skillTypeValue}:
                - Стоимость: ${cost}
                - Монеты: ${gold}
                - Доступно: ${canAfford}`);
            
            return canAfford;
        } catch (error) {
            console.warn('Error in canAffordUpgrade:', error);
            return false;
        }
    }

    private updateButtonColor(color?: number, alpha?: number): void {
        try {
            // Skip color update if the scene is invalid
            if (!this.scene || !this.background) {
                return;
            }
            
            // Если цвет не указан, используем цвет по умолчанию
            if (color === undefined) {
                color = this.canAffordUpgrade() ? BUTTON_COLOR_AFFORD : BUTTON_COLOR_DEFAULT;
            }
            
            // Если прозрачность не указана, используем по умолчанию
            if (alpha === undefined) {
                alpha = BUTTON_BACKGROUND_ALPHA;
            }
            
            // Очищаем предыдущий фон
            this.background.clear();
            
            // Рисуем закругленный прямоугольник
            this.background.fillStyle(color, alpha);
            this.background.lineStyle(2, 0x666666, 1);
            
            // Смещаем в центр
            this.background.fillRoundedRect(
                -this.width / 2, 
                -this.height / 2, 
                this.width, 
                this.height, 
                UpgradeButton.CORNER_RADIUS
            );
            
            // Добавляем обводку
            this.background.strokeRoundedRect(
                -this.width / 2, 
                -this.height / 2, 
                this.width, 
                this.height, 
                UpgradeButton.CORNER_RADIUS
            );
        } catch (error) {
            console.warn('Error in updateButtonColor:', error);
        }
    }

    protected handleClick(): void {
        try {
            // Safety check for scene and upgradeManager
            if (!this.scene || !this.upgradeManagerValue) {
                console.warn('UpgradeButton: scene или upgradeManager не существует');
                return;
            }
            
            console.log(`UpgradeButton: Попытка покупки ${this.skillTypeValue} за GOLD`);
            
            // Теперь явно указываем, что покупаем за золото
            const success = this.upgradeManagerValue.purchaseUpgrade(this.skillTypeValue, CurrencyType.GOLD);
            
            console.log(`UpgradeButton: Результат покупки: ${success ? 'успешно' : 'неудачно'}`);
            
            if (success) {
                // Check if scene.scene exists and has the get method
                if (!this.scene.scene || typeof this.scene.scene.get !== 'function') {
                    console.warn('UpgradeButton: scene.scene не существует или get не является функцией');
                    return;
                }
                
                const gameScene = this.scene.scene.get('GameScene');
                if (!gameScene) {
                    console.warn('UpgradeButton: gameScene не существует');
                    return;
                }
                
                // Play upgrade sound
                const audioManager = (gameScene as any).audioManager;
                if (audioManager) {
                    audioManager.playSound('upgradeButton');
                }

                // Update tower
                (gameScene as any).tower?.upgrade();
                
                // Update gold immediately
                const currentGold = (gameScene as any).goldManager?.gold_count || 0;
                const uiManager = (gameScene as any).uiManager;
                if (uiManager) {
                    uiManager.updateGoldCount(currentGold);
                    console.log(`UpgradeButton: UI обновлен, текущее количество монет: ${currentGold}`);
                }

                // Update button UI
                this.updateUI();
            }
        } catch (error) {
            console.warn('Error in handleClick:', error);
        }
    }

    private updateUI(): void {
        try {
            // Skip UI update if the scene is invalid
            if (!this.scene || !this.levelText || !this.costText) {
                return;
            }
            
            // Get current upgrade info from the manager
            const currentValue = this.upgradeManagerValue.getState(this.skillTypeValue);
            const cost = this.upgradeManagerValue.getSkillCost(this.skillTypeValue, CurrencyType.GOLD);
            
            // Обновляем текст уровня и стоимости
            this.levelText.setText(`Amount ${currentValue}`);
            this.costText.setText(`${cost}`);
            
            // Обновляем цвет кнопки в зависимости от доступности улучшения
            this.updateButtonColor();
            
            // Force visibility
            this.setVisible(true);
            this.buttonText.setVisible(true);
            this.levelText.setVisible(true);
            this.costIcon.setVisible(true);
            this.costText.setVisible(true);
            if (this.upgradeInfoContainer) {
                this.upgradeInfoContainer.setVisible(true);
            }
        } catch (error) {
            console.warn('Error in updateUI:', error);
        }
    }

    // Force visibility of all elements - safer implementation
    private forceVisibility(): void {
        // Check if button is still active to avoid issues with destroyed objects
        if (!this.active || !this.scene) return;
        
        try {
            // Update the background
            this.updateButtonColor();
            
            // Make all elements visible
            if (this.background && this.background.visible !== undefined) {
                this.background.setVisible(true);
            }
            
            if (this.buttonText && this.buttonText.visible !== undefined) {
                this.buttonText.setVisible(true);
                this.buttonText.setDepth(2002);
            }
            
            if (this.levelText && this.levelText.visible !== undefined) {
                this.levelText.setVisible(true);
                this.levelText.setDepth(2002);
            }
            
            if (this.costIcon && this.costIcon.visible !== undefined) {
                this.costIcon.setVisible(true);
                this.costIcon.setDepth(2002);
            }
            
            if (this.costText && this.costText.visible !== undefined) {
                this.costText.setVisible(true);
                this.costText.setDepth(2002);
            }
            
            if (this.upgradeInfoContainer && this.upgradeInfoContainer.visible !== undefined) {
                this.upgradeInfoContainer.setVisible(true);
                this.upgradeInfoContainer.setDepth(2002);
            }
            
            // Set proper depths
            this.setDepth(2000);
            if (this.background) this.background.setDepth(1999);
            
            // Force text refresh - only do this if elements are still valid
            if (this.levelText && this.levelText.text !== undefined) {
                this.levelText.setText(this.levelText.text);
            }
            
            if (this.costText && this.costText.text !== undefined) {
                this.costText.setText(this.costText.text);
            }
            
            if (this.buttonText && this.buttonText.text !== undefined) {
                this.buttonText.setText(this.buttonText.text);
            }
        } catch (error) {
            console.warn('Error in forceVisibility:', error);
        }
    }

    // Override handleScreenResize from parent UIComponent
    protected handleScreenResize(gameScale: number): void {
        super.handleScreenResize(gameScale);
        
        // Update after resize
        this.updateUI();
        this.forceVisibility();
    }
} 
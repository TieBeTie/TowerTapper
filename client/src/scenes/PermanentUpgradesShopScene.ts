import Phaser from 'phaser';
import AudioManager from '../managers/AudioManager';
import { IScene } from '../types/IScene';
import { ScreenManager } from '../managers/ScreenManager';
import { UIManager } from '../managers/UIManager';
import { EmblemManager } from '../managers/EmblemManager';
import { UpgradeManager } from '../managers/UpgradeManager';
import { SkillType, CurrencyType, SkillInfo } from '../types/SkillType';

// Категории улучшений
enum UpgradeCategory {
    ATTACK = 'Attack Upgrades',
    DEFENCE = 'Defence Upgrades',
    UTILITY = 'Utility Upgrades'
}

export default class PermanentUpgradesShopScene extends Phaser.Scene implements IScene {
    private audioManager!: AudioManager;
    public screenManager!: ScreenManager;
    public uiManager!: UIManager;
    private emblemManager!: EmblemManager;
    private upgradeManager!: UpgradeManager;
    
    // UI элементы
    private emblemCountText!: Phaser.GameObjects.Text;
    private emblemIcon!: Phaser.GameObjects.Image;
    private upgradeButtons: Phaser.GameObjects.GameObject[] = [];
    private leftButton!: Phaser.GameObjects.Container;
    private rightButton!: Phaser.GameObjects.Container;
    private categoryTitleText!: Phaser.GameObjects.Text;
    private currentCategory: UpgradeCategory = UpgradeCategory.ATTACK;
    private readonly BUTTON_HEIGHT = 70;
    private categories: UpgradeCategory[] = [
        UpgradeCategory.ATTACK,
        UpgradeCategory.DEFENCE,
        UpgradeCategory.UTILITY
    ];

    constructor() {
        super({ key: 'PermanentUpgradesShopScene' });
    }

    preload(): void {
        // Preload resources if needed
    }

    create(): void {
        // Initialize ScreenManager
        this.screenManager = new ScreenManager(this);
        
        // Получить менеджер эмблем
        this.emblemManager = EmblemManager.getInstance();
        
        // Инициализировать менеджер улучшений
        this.upgradeManager = new UpgradeManager(this);
        
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

        // Create title text using ScreenManager
        const titleFontSize = this.screenManager.getResponsiveFontSize(48);
        const title = this.screenManager.createText(
            center.x, 
            height * 0.1, 
            'Permanent Upgrades Shop', 
            titleFontSize,
            '#ffffff',
            {
                stroke: '#000000',
                strokeThickness: 4,
                fontFamily: 'pixelFont'
            }
        );
        
        // Создать текст категории
        this.createCategoryTitle();
        
        // Создать отображение эмблем в правом верхнем углу
        this.createEmblemDisplay();
        
        // Создать панель улучшений
        this.createUpgradesPanel();

        // Create back button using ScreenManager
        const backButtonFontSize = this.screenManager.getResponsiveFontSize(36);
        const backButton = this.screenManager.createText(
            center.x, 
            height * 0.9, 
            'Back to Menu',
            backButtonFontSize,
            '#ffffff',
            {
                fontFamily: 'pixelFont'
            }
        );

        // Add interactivity to back button
        backButton.setInteractive()
            .on('pointerover', () => {
                backButton.setScale(1.1);
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
    
    // Создание заголовка категории
    private createCategoryTitle(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        const categoryFontSize = this.screenManager.getResponsiveFontSize(36);
        
        this.categoryTitleText = this.screenManager.createText(
            center.x,
            height * 0.18,
            this.currentCategory,
            categoryFontSize,
            '#FFC107', // Золотой цвет для заголовка категории
            {
                fontFamily: 'pixelFont',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
    }
    
    // Создание отображения количества эмблем
    private createEmblemDisplay(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const padding = this.screenManager.getResponsivePadding(20);
        const iconSize = this.screenManager.getResponsiveFontSize(30);
        const fontSize = this.screenManager.getResponsiveFontSize(28);
        
        // Создать иконку эмблемы
        this.emblemIcon = this.add.image(width - padding - iconSize, padding + iconSize/2, 'emblem_icon')
            .setDisplaySize(iconSize, iconSize)
            .setDepth(100);
            
        // Создать текст с количеством эмблем
        this.emblemCountText = this.screenManager.createText(
            width - padding - iconSize - 10, 
            padding + iconSize/2, 
            this.emblemManager.getEmblemCount().toString(),
            fontSize,
            '#ffffff',
            {
                fontFamily: 'pixelFont',
                stroke: '#000000',
                strokeThickness: 2,
                origin: { x: 1, y: 0.5 }
            }
        );
        this.emblemCountText.setDepth(100);
    }
    
    // Создание панели улучшений
    private createUpgradesPanel(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        const padding = this.screenManager.getResponsivePadding(12);
        const buttonHeight = this.screenManager.getResponsivePadding(this.BUTTON_HEIGHT);
        const buttonWidth = width * 0.85;
        const startY = height * 0.25;
        const spacing = buttonHeight + padding;
        
        // Очищаем предыдущие кнопки
        this.upgradeButtons.forEach(button => button.destroy());
        this.upgradeButtons = [];
        
        // Получаем улучшения для текущей категории
        const availableSkills = this.getSkillsByCategory(this.currentCategory);
        
        // Создаем кнопки для улучшений текущей категории
        if (availableSkills.length === 0) {
            // Если категория пуста, показываем сообщение
            const noSkillsText = this.screenManager.createText(
                center.x,
                startY + spacing * 2,
                'No upgrades available in this category',
                this.screenManager.getMediumFontSize(),
                '#aaaaaa',
                {
                    fontFamily: 'pixelFont'
                }
            );
            this.upgradeButtons.push(noSkillsText);
        } else {
            // Создаем кнопки для доступных улучшений
            for (let i = 0; i < availableSkills.length; i++) {
                const skill = availableSkills[i];
                this.createUpgradeButton(skill, startY + (i * spacing), i);
            }
        }
        
        // Создаем кнопки навигации между категориями
        this.createCategoryButtons(center.x, height * 0.18); // Размещаем рядом с заголовком категории
    }
    
    // Получение улучшений по категории
    private getSkillsByCategory(category: UpgradeCategory): SkillInfo[] {
        const allSkills = this.upgradeManager.getAvailableSkills();
        
        // Распределяем умения по категориям на основе доступных типов в SkillType
        switch (category) {
            case UpgradeCategory.ATTACK:
                return allSkills.filter(skill => 
                    skill.type === SkillType.DAMAGE ||
                    skill.type === SkillType.ATTACK_SPEED ||
                    skill.type === SkillType.ATTACK_RANGE ||
                    skill.type === SkillType.MULTISHOT ||
                    skill.type === SkillType.CRIT_CHANCE ||
                    skill.type === SkillType.CRIT_MULTIPLIER);
                
            case UpgradeCategory.DEFENCE:
                return allSkills.filter(skill => 
                    skill.type === SkillType.MAX_HEALTH ||
                    skill.type === SkillType.DEFENSE ||
                    skill.type === SkillType.HEALTH_REGEN ||
                    skill.type === SkillType.KNOCKBACK ||
                    skill.type === SkillType.LIFESTEAL_AMOUNT ||
                    skill.type === SkillType.LIFESTEAL_CHANCE);
                
            case UpgradeCategory.UTILITY:
                return allSkills.filter(skill => 
                    skill.type === SkillType.COIN_REWARD ||
                    skill.type === SkillType.DAILY_GOLD ||
                    skill.type === SkillType.EMBLEM_BONUS ||
                    skill.type === SkillType.FREE_UPGRADE ||
                    skill.type === SkillType.SUPPLY_DROP ||
                    skill.type === SkillType.GAME_SPEED);
                
            default:
                return allSkills;
        }
    }
    
    private createCategoryButtons(x: number, y: number): void {
        const { width } = this.screenManager.getScreenSize();
        const padding = this.screenManager.getResponsivePadding(20);
        const buttonWidth = width * 0.1;
        const buttonHeight = this.screenManager.getResponsivePadding(40);
        
        // Определяем позицию кнопок
        const leftButtonX = x - width * 0.4;
        const rightButtonX = x + width * 0.4;
        
        // Создаем кнопку "влево"
        this.leftButton = this.createNavigationButton(leftButtonX, y, "◀", () => {
            this.changeCategory(-1);
        });
        
        // Создаем кнопку "вправо"
        this.rightButton = this.createNavigationButton(rightButtonX, y, "▶", () => {
            this.changeCategory(1);
        });
        
        // Обновляем состояние кнопок
        this.updateNavigationButtonsState();
    }
    
    private createNavigationButton(x: number, y: number, text: string, callback: Function): Phaser.GameObjects.Container {
        const buttonWidth = this.screenManager.getResponsivePadding(50);
        const buttonHeight = this.screenManager.getResponsivePadding(40);
        
        const button = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x333333, 0.9);
        bg.setStrokeStyle(2, 0xFFFFFF, 0.8);
        button.add(bg);
        
        const textObj = this.add.text(
            0, 
            0, 
            text, 
            {
                fontFamily: 'pixelFont',
                fontSize: `${this.screenManager.getMediumFontSize() * 0.9}px`,
                color: '#ffffff'
            }
        ).setOrigin(0.5);
        button.add(textObj);
        
        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                bg.fillColor = 0x555555;
            })
            .on('pointerout', () => {
                bg.fillColor = 0x333333;
            })
            .on('pointerdown', () => {
                callback();
                try {
                    if (this.audioManager.hasSoundCached('clickSound')) {
                        this.audioManager.playSound('clickSound');
                    }
                } catch (err) {
                    console.error('Error playing audio on button click:', err);
                }
            });
            
        return button;
    }
    
    private updateNavigationButtonsState(): void {
        if (!this.leftButton || !this.rightButton) {
            return;
        }
        
        const currentIndex = this.categories.indexOf(this.currentCategory);
        
        // Включаем/отключаем кнопку влево
        const canGoLeft = currentIndex > 0;
        const leftButtonBg = this.leftButton.getAt(0) as Phaser.GameObjects.Rectangle;
        if (canGoLeft) {
            leftButtonBg.fillColor = 0x333333;
            (leftButtonBg as any).input.enabled = true;
        } else {
            leftButtonBg.fillColor = 0x222222;
            (leftButtonBg as any).input.enabled = false;
        }
        
        // Включаем/отключаем кнопку вправо
        const canGoRight = currentIndex < this.categories.length - 1;
        const rightButtonBg = this.rightButton.getAt(0) as Phaser.GameObjects.Rectangle;
        if (canGoRight) {
            rightButtonBg.fillColor = 0x333333;
            (rightButtonBg as any).input.enabled = true;
        } else {
            rightButtonBg.fillColor = 0x222222;
            (rightButtonBg as any).input.enabled = false;
        }
    }
    
    private changeCategory(direction: number): void {
        const currentIndex = this.categories.indexOf(this.currentCategory);
        const newIndex = currentIndex + direction;
        
        // Проверяем границы
        if (newIndex >= 0 && newIndex < this.categories.length) {
            this.currentCategory = this.categories[newIndex];
            
            // Обновляем заголовок категории
            if (this.categoryTitleText) {
                this.categoryTitleText.setText(this.currentCategory);
            }
            
            // Обновляем панель улучшений
            this.updateUpgradeButtons();
        }
    }
    
    private createUpgradeButton(
        skill: SkillInfo,
        y: number,
        index: number
    ): void {
        const { width } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        const containerWidth = width * 0.85;
        const buttonHeight = this.screenManager.getResponsivePadding(65);
        
        // Create button background with rounded corners
        const buttonBg = this.add.rectangle(center.x, y, containerWidth, buttonHeight, 0x333333, 0.9);
        buttonBg.setStrokeStyle(2, 0xFFFFFF, 0.8);
        this.upgradeButtons.push(buttonBg);
        
        // Add skill name
        const nameText = this.add.text(
            center.x - containerWidth * 0.45, 
            y - buttonHeight * 0.3, 
            skill.name, 
            {
                fontFamily: 'pixelFont',
                fontSize: `${this.screenManager.getLargeFontSize() * 0.85}px`,
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0, 0.5);
        this.upgradeButtons.push(nameText);
        
        // Add skill description - сделаем короче текст если нужно
        let description = skill.description;
        if (description.length > 35) {
            description = description.substring(0, 33) + '...';
        }
        
        const descriptionText = this.add.text(
            center.x - containerWidth * 0.45, 
            y, 
            description,
            {
                fontFamily: 'pixelFont',
                fontSize: `${this.screenManager.getSmallFontSize() * 0.85}px`,
                color: '#aaaaaa'
            }
        ).setOrigin(0, 0.5);
        this.upgradeButtons.push(descriptionText);
        
        // Add level text
        const levelText = this.add.text(
            center.x - containerWidth * 0.45, 
            y + buttonHeight * 0.3, 
            `Level: ${skill.currentLevel}/${skill.maxLevel}`, 
            {
                fontFamily: 'pixelFont',
                fontSize: `${this.screenManager.getSmallFontSize() * 0.85}px`,
                color: '#cccccc'
            }
        ).setOrigin(0, 0.5);
        this.upgradeButtons.push(levelText);
        
        // Add value text 
        const currentValue = this.upgradeManager.getSkillValue(skill.type);
        const valueText = this.add.text(
            center.x, 
            y + buttonHeight * 0.3, 
            `Value: ${currentValue}`, 
            {
                fontFamily: 'pixelFont',
                fontSize: `${this.screenManager.getSmallFontSize() * 0.85}px`,
                color: '#cccccc'
            }
        ).setOrigin(0, 0.5);
        this.upgradeButtons.push(valueText);
        
        // Create purchase button for emblems only
        this.createEmblemPurchaseButton(skill.type, containerWidth, y, index);
    }
    
    private createEmblemPurchaseButton(
        skillType: SkillType,
        containerWidth: number,
        y: number,
        index: number
    ): void {
        const padding = this.screenManager.getResponsivePadding(10);
        const buttonHeight = this.screenManager.getResponsivePadding(45);
        const buttonWidth = containerWidth * 0.28;
        const center = this.screenManager.getScreenCenter();
        const x = center.x + containerWidth * 0.32;
        
        // Get emblem cost
        const emblemsCost = this.upgradeManager.getSkillCost(skillType, CurrencyType.EMBLEMS);
        
        // Check if we can afford the upgrade
        const canAfford = this.upgradeManager.canAffordUpgrade(skillType, CurrencyType.EMBLEMS);
        
        // Create emblem purchase button background
        const emblemButtonBg = this.add.rectangle(x, y, buttonWidth, buttonHeight, 
            canAfford ? 0x2196F3 : 0x757575, 0.9);
        emblemButtonBg.setStrokeStyle(2, canAfford ? 0xB19CD9 : 0x555555, 0.8);
        this.upgradeButtons.push(emblemButtonBg);
        
        // Create emblem icon
        const emblemIcon = this.add.sprite(x - buttonWidth/3.5, y, 'emblem_icon');
        emblemIcon.setDisplaySize(buttonHeight * 0.65, buttonHeight * 0.65);
        this.upgradeButtons.push(emblemIcon);
        
        // Create cost text
        const costText = this.add.text(
            x + buttonWidth/10, 
            y, 
            `${emblemsCost}`, 
            {
                fontFamily: 'pixelFont',
                fontSize: `${this.screenManager.getMediumFontSize() * 0.85}px`,
                color: '#ffffff'
            }
        ).setOrigin(0, 0.5);
        this.upgradeButtons.push(costText);
        
        // Add interactivity to the button
        if (canAfford) {
            emblemButtonBg.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    this.purchaseUpgrade(skillType);
                })
                .on('pointerover', () => {
                    emblemButtonBg.fillColor = 0x64B5F6;
                })
                .on('pointerout', () => {
                    emblemButtonBg.fillColor = 0x2196F3;
                });
        }
    }
    
    private purchaseUpgrade(skillType: SkillType): void {
        // Покупаем улучшение за эмблемы
        if (this.upgradeManager.purchaseUpgrade(skillType, CurrencyType.EMBLEMS)) {
            // Обновляем отображение эмблем
            this.updateEmblemDisplay();
            
            // Обновляем кнопки после покупки
            this.updateUpgradeButtons();
            
            // Воспроизводим звук покупки
            this.sound.play('purchase_sound');
        }
    }
    
    private updateEmblemDisplay(): void {
        if (this.emblemCountText) {
            this.emblemCountText.setText(this.emblemManager.getEmblemCount().toString());
        }
    }
    
    private updateUpgradeButtons(): void {
        // Уничтожаем старые кнопки
        this.upgradeButtons.forEach(button => button.destroy());
        this.upgradeButtons = [];
        
        // Уничтожаем кнопки навигации
        if (this.leftButton) this.leftButton.destroy();
        if (this.rightButton) this.rightButton.destroy();
        
        // Пересоздаем кнопки
        this.createUpgradesPanel();
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
            const titleFontSize = this.screenManager.getResponsiveFontSize(48);
            title.setFontSize(titleFontSize);
            title.setPosition(center.x, height * 0.1);
        }
        
        // Update category title if exists
        if (this.categoryTitleText) {
            const categoryFontSize = this.screenManager.getResponsiveFontSize(36);
            this.categoryTitleText.setFontSize(categoryFontSize);
            this.categoryTitleText.setPosition(center.x, height * 0.18);
        }
        
        // Update back button position and size
        const backButton = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Text && 
            (child as Phaser.GameObjects.Text).text === 'Back to Menu'
        ) as Phaser.GameObjects.Text;
        
        if (backButton) {
            const backButtonFontSize = this.screenManager.getResponsiveFontSize(36);
            backButton.setFontSize(backButtonFontSize);
            backButton.setPosition(center.x, height * 0.9);
        }
        
        // Обновляем отображение эмблем
        if (this.emblemIcon && this.emblemCountText) {
            const padding = this.screenManager.getResponsivePadding(20);
            const iconSize = this.screenManager.getResponsiveFontSize(30);
            
            this.emblemIcon.setPosition(width - padding - iconSize, padding + iconSize/2);
            this.emblemIcon.setDisplaySize(iconSize, iconSize);
            
            const fontSize = this.screenManager.getResponsiveFontSize(28);
            this.emblemCountText.setPosition(width - padding - iconSize - 10, padding + iconSize/2);
            this.emblemCountText.setFontSize(fontSize);
        }
        
        // Пересоздаем панель улучшений
        this.updateUpgradeButtons();
    }
    
    update(time: number, delta: number): void {
        // Update logic here if needed
    }
    
    private returnToMenu(): void {
        // Остановим звуки если необходимо
        if (this.audioManager) {
            try {
                this.audioManager.stopMusic();
            } catch (err) {
                console.error('Error stopping sounds:', err);
            }
        }
        
        // Отключаем все обработчики событий
        this.events.off('screenResize', this.handleScreenResize, this);
        
        // Уничтожаем все кнопки и элементы интерфейса
        this.upgradeButtons.forEach(button => button.destroy());
        this.upgradeButtons = [];
        
        if (this.leftButton) this.leftButton.destroy();
        if (this.rightButton) this.rightButton.destroy();
        
        // Сначала завершаем текущую сцену полностью
        this.scene.stop('PermanentUpgradesShopScene');
        
        // Перезапускаем главное меню с правильным названием
        this.scene.start('MenuScene');
    }
    
    shutdown(): void {
        // Clean up when scene is shutdown
        this.events.off('screenResize', this.handleScreenResize, this);
        
        // Освобождаем ресурсы, но не уничтожаем элементы полностью
        this.upgradeButtons.forEach(button => {
            if (button instanceof Phaser.GameObjects.GameObject) {
                button.removeAllListeners();
            }
        });
        
        // Очищаем интерактивность навигационных кнопок
        if (this.leftButton) {
            const bg = this.leftButton.getAt(0) as Phaser.GameObjects.Rectangle;
            if (bg && bg.input) {
                bg.removeAllListeners();
            }
        }
        
        if (this.rightButton) {
            const bg = this.rightButton.getAt(0) as Phaser.GameObjects.Rectangle;
            if (bg && bg.input) {
                bg.removeAllListeners();
            }
        }
    }
    
    destroy(): void {
        // Clean up when scene is destroyed
        this.events.off('screenResize', this.handleScreenResize, this);
        
        // Destroy UI elements
        if (this.emblemIcon && this.emblemIcon.active) {
            this.emblemIcon.destroy();
        }
        
        if (this.emblemCountText && this.emblemCountText.active) {
            this.emblemCountText.destroy();
        }
        
        if (this.categoryTitleText && this.categoryTitleText.active) {
            this.categoryTitleText.destroy();
        }
        
        // Destroy all upgrade buttons
        this.upgradeButtons.forEach(button => {
            if (button instanceof Phaser.GameObjects.GameObject && button.active) {
                button.destroy();
            }
        });
        this.upgradeButtons = [];
        
        // Destroy navigation buttons
        if (this.leftButton && this.leftButton.active) {
            this.leftButton.destroy();
        }
        
        if (this.rightButton && this.rightButton.active) {
            this.rightButton.destroy();
        }
    }
} 
// managers/UIManager.js
import Phaser from 'phaser';
import { StatsView } from '../ui/components/StatsView';
import { ScrollableButtonPanel } from '../ui/components/ScrollableButtonPanel';
import { UpgradeButton } from '../ui/components/UpgradeButton';
import { SkillType } from '../types/SkillType';
import { UpgradeManager } from './UpgradeManager';
import { ScreenManager } from './ScreenManager';


export class UIManager {
    private statsView!: StatsView;
    private upgradePanel!: ScrollableButtonPanel;
    private coinCount: number = 0;
    private coinIcon!: Phaser.GameObjects.Image;
    private coinNumberText!: Phaser.GameObjects.Text;
    private emblemIcon!: Phaser.GameObjects.Image;
    private emblemNumberText!: Phaser.GameObjects.Text;
    private upgradeManager: UpgradeManager;
    private screenManager: ScreenManager;

    // Responsive design constants
    private readonly STATS_VIEW_HEIGHT_PIXEL = 24;
    private readonly BUTTON_SIZE_RATIO = 0.02; // 2% of screen width
    private readonly BUTTON_SPACING_RATIO = 0.04; // 4% of screen width
    private readonly ICON_SIZE_RATIO = 0.04; // 4% of screen width
    private readonly FONT_SIZE_RATIO = 0.04; // 4% of screen width
    
    // Категории улучшений
    private readonly CATEGORIES = ["Attack Upgrades", "Defense Upgrades", "Utility Upgrades"];

    constructor(
        private scene: Phaser.Scene,
        private onPauseToggle: () => void,
        private onUpgradeClick: () => void,
        private onSettingsClick: () => void,
        private onShopClick: () => void,
        upgradeManager: UpgradeManager,
        screenManager: ScreenManager
    ) {
        this.upgradeManager = upgradeManager;
        this.screenManager = screenManager;
        this.initialize();
        
        // Subscribe to screen resize events from ScreenManager
        this.scene.events.on('screenResize', this.handleScreenResize, this);
        
        // Listen for ui-force-visibility event with the updated name
        this.scene.events.on('ui-refresh-visibility', this.forceAllButtonsVisible, this);
        
        // Listen for emblem updates
        this.scene.events.on('updateEmblems', this.updateEmblemCount, this);
        
        // Set up update callback for regular updates
        this.scene.events.on('update', this.onUpdate, this);
    }

    private getStatsViewBeginY() {
        const { height } = this.screenManager.getScreenSize();
        return height * this.screenManager.getGameViewHeightRatio();
    }

    private getStatsViewEndY() {
        return this.getStatsViewBeginY() + this.STATS_VIEW_HEIGHT_PIXEL;
    }

    private initilizeStatsView(iconSize: number, fontSize: number): void {
        // Create statsView with screenManager
        this.statsView = new StatsView(this.scene, this.screenManager);
        
         // Create coin elements - уменьшаем размер иконки монеты
         this.coinIcon = this.scene.add.image(0, 0, 'coin');
         
         // Уменьшаем размер иконки монеты до 60% от оригинального размера
         const reducedIconSize = iconSize * 0.6;
         this.coinIcon.setDisplaySize(reducedIconSize, reducedIconSize);

         this.coinNumberText = this.scene.add.text(0, 0, '0', {
             fontSize: `${fontSize}px`,
             color: '#ffffff',
             fontFamily: 'pixelFont'
         }).setOrigin(0, 0.5);

         // Add elements to statsView
         // Create a container for coin display
         const coinContainer = this.scene.add.container(0, 0);
         coinContainer.add(this.coinIcon);
         coinContainer.add(this.coinNumberText);
         
         // Position the coin text closer to the icon
         this.coinNumberText.setPosition(reducedIconSize * 0.8, 0);
         
         // Add the container as a single element
         this.statsView.addCurrencyElement(coinContainer);
         
         // Create emblem elements
         this.emblemIcon = this.scene.add.image(0, 0, 'emblem_icon');
         
         // Set emblem icon size
         this.emblemIcon.setDisplaySize(reducedIconSize, reducedIconSize);
         
         this.emblemNumberText = this.scene.add.text(0, 0, '0', {
             fontSize: `${fontSize}px`,
             color: '#ffffff',
             fontFamily: 'pixelFont'
         }).setOrigin(0, 0.5);
         
         // Create a container for emblem display
         const emblemContainer = this.scene.add.container(0, 0);
         emblemContainer.add(this.emblemIcon);
         emblemContainer.add(this.emblemNumberText);
         
         // Position the emblem text closer to the icon
         this.emblemNumberText.setPosition(reducedIconSize * 0.8, 0);
         
         // Add the container as a single element
         this.statsView.addCurrencyElement(emblemContainer);
         
         // Update emblem count
         this.updateEmblemCount();
    }

    private initilizeUpgradePanel(): void {
        // Создаем ScrollableButtonPanel с 3 колонками и 2 строками
        this.upgradePanel = new ScrollableButtonPanel(
            this.scene, 
            2, // 2 колонки
            3, // 3 строки
            undefined, // не используем параметр totalButtons
            this.screenManager,
            this.CATEGORIES // категории кнопок
        );
        
        // Единый размер шрифта для всех кнопок (固定サイズ)
        const fontSize = this.screenManager.getResponsiveFontSize(20);
        
        // Создаем кнопки улучшений атаки (Attack Upgrades)
        const attackButtons = this.createAttackUpgradeButtons(fontSize);
        
        // Создаем кнопки улучшений защиты (Defense Upgrades)
        const defenseButtons = this.createDefenseUpgradeButtons(fontSize);
        
        // Создаем кнопки утилитарных улучшений (Utility Upgrades)
        const utilityButtons = this.createUtilityUpgradeButtons(fontSize);
        
        // Добавляем кнопки в соответствующие категории
        this.upgradePanel.addButtonsToCategory(attackButtons, 0);
        this.upgradePanel.addButtonsToCategory(defenseButtons, 1);
        this.upgradePanel.addButtonsToCategory(utilityButtons, 2);
    }
    
    private createAttackUpgradeButtons(fontSize: number): Phaser.GameObjects.GameObject[] {
        const buttons: Phaser.GameObjects.GameObject[] = [];
        
        // 1. Damage – увеличивает урон
        const damageButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.DAMAGE,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Damage',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(damageButton);
        
        // 2. Attack Speed – увеличивает скорость атаки
        const attackSpeedButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.ATTACK_SPEED,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Attack\nSpeed',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(attackSpeedButton);
        
        // 3. Attack Range – увеличивает дальность атаки
        const attackRangeButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.ATTACK_RANGE,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Attack\nRange',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(attackRangeButton);
        
        // 4. Multishot Chance – шанс атаки несколькими снарядами
        const multishotButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.MULTISHOT,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Multishot\nChance',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(multishotButton);
        
        // 5. Critical Chance – шанс критического удара
        const critChanceButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.CRIT_CHANCE,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Critical\nChance',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(critChanceButton);
        
        // 6. Critical Multiplier – множитель критического урона
        const critMultButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.CRIT_MULTIPLIER,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Critical\nMultiplier',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(critMultButton);
        
        return buttons;
    }
    
    private createDefenseUpgradeButtons(fontSize: number): Phaser.GameObjects.GameObject[] {
        const buttons: Phaser.GameObjects.GameObject[] = [];
        
        // 1. Max Health – увеличивает максимальное здоровье
        const maxHealthButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.MAX_HEALTH,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Max\nHealth',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(maxHealthButton);
        
        // 2. Health Regen – увеличивает восстановление здоровья
        const regenButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.HEALTH_REGEN,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Health\nRegen',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(regenButton);
        
        // 3. Defense – уменьшает получаемый урон
        const defenseButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.DEFENSE,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Defense',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(defenseButton);
        
        // 4. Knockback – увеличивает силу отталкивания врагов
        const knockbackButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.KNOCKBACK,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Knockback',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(knockbackButton);
        
        // 5. Lifesteal Chance – шанс восстановления здоровья при атаке
        const lifestealChanceButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.LIFESTEAL_CHANCE,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Lifesteal\nChance',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(lifestealChanceButton);
        
        // 6. Lifesteal Amount – количество восстанавливаемого здоровья
        const lifestealAmountButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.LIFESTEAL_AMOUNT,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Lifesteal\nAmount',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(lifestealAmountButton);
        
        return buttons;
    }
    
    private createUtilityUpgradeButtons(fontSize: number): Phaser.GameObjects.GameObject[] {
        const buttons: Phaser.GameObjects.GameObject[] = [];
        
        // 1. Daily Gold Bonus – дополнительное золото каждый день
        const dailyGoldButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.DAILY_GOLD,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Daily Gold\nBonus',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(dailyGoldButton);
        
        // 2. Kill Gold Bonus – больше золота за убийства
        const killGoldButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.COIN_REWARD,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Kill Gold\nBonus',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(killGoldButton);
        
        // 3. Daily Gem Bonus – дополнительные гемы каждый день
        const dailyGemButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.EMBLEM_BONUS,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Emblem\nBonus',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(dailyGemButton);
        
        // 4. Free Upgrade Chance – шанс получить бесплатное улучшение
        const freeUpgradeButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.FREE_UPGRADE,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Free\nUpgrade',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(freeUpgradeButton);
        
        // 5. Supply Drop Chance – шанс выпадения предметов
        const supplyDropButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.SUPPLY_DROP,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Supply\nDrop',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(supplyDropButton);
        
        // 6. Max Gamespeed – максимальная скорость игры
        const gameSpeedButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.GAME_SPEED,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Max Game\nSpeed',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(gameSpeedButton);
        
        // Emblem Bonus upgrade
        const emblemBonusButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.EMBLEM_BONUS,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Emblem\nBonus',
            x: 0, y: 0,
            width: fontSize * 10,
            height: fontSize * 3
        });
        buttons.push(emblemBonusButton);
        
        return buttons;
    }

    private initialize(): void {
        // Use ScreenManager to get screen dimensions
        const { width } = this.screenManager.getScreenSize();
        const iconSize = width * this.ICON_SIZE_RATIO;
        const fontSize = this.screenManager.getResponsiveFontSize(20);
        
        this.initilizeStatsView(iconSize, fontSize);
        this.initilizeUpgradePanel(); 
        this.updatePositions();
    }

    public updatePositions(): void {
        const { width, height } = this.screenManager.getScreenSize();

        // Calculate dimensions
        const statsViewHeight = this.STATS_VIEW_HEIGHT_PIXEL;
        
        // Рассчитываем высоту доступную для игрового поля
        const gameViewHeight = height * this.screenManager.getGameViewHeightRatio();
        
        // Position and size statsView
        this.statsView.setPosition(0, gameViewHeight);
        this.statsView.setSize(width, statsViewHeight);
 
        // Position the upgradePanel so its bottom edge aligns with the bottom of the screen
        // We need to subtract the panel height from the screen height
        this.upgradePanel.setPosition(0, height - this.upgradePanel.getHeight());
        
        // Ensure components are visible
        this.statsView.setVisible(true);
        this.upgradePanel.setVisible(true);
        
        // Ensure coin display is visible
        if (this.coinIcon && this.coinNumberText) {
            this.coinIcon.setVisible(true);
            this.coinNumberText.setVisible(true);
            
            // Set high depth for coin display
            this.coinIcon.setDepth(100);
            this.coinNumberText.setDepth(100);
            
            // Update coin text to force redraw
            this.coinNumberText.setText(this.coinCount.toString());
        }
        
        // Delay a final visibility check to ensure elements appear
        if (this.scene && this.scene.time) {
            this.scene.time.delayedCall(150, () => {
                // Final visibility check
                this.statsView.setVisible(true);
                this.upgradePanel.setVisible(true);
                
                if (this.coinIcon && this.coinNumberText) {
                    this.coinIcon.setVisible(true);
                    this.coinNumberText.setVisible(true);
                    this.coinIcon.setDepth(100);
                    this.coinNumberText.setDepth(100);
                }
                
                // Try one more delayed update as last resort
                this.scene.time.delayedCall(300, () => {
                    this.statsView.setVisible(true);
                    this.upgradePanel.setVisible(true);
                });
            });
        }
    }

    private handleScreenResize(gameScale: number): void {
        // Use ScreenManager to get updated dimensions
        this.updatePositions();
        
        // Force upgrade buttons to be visible
        this.forceAllButtonsVisible();
    }

    // Add a new method to ensure all buttons are visible
    private forceAllButtonsVisible(): void {
        // Ensure upgradePanel buttons are visible, using a specific event name
        // to avoid recursive event emission
        this.scene.events.emit('upgradeButtonsVisibility');
        
        // Ensure stats view and upgrade panel are visible
        this.statsView.setVisible(true);
        this.upgradePanel.setVisible(true);
        
        // Ensure coin display is visible
        if (this.coinIcon && this.coinNumberText) {
            this.coinIcon.setVisible(true);
            this.coinNumberText.setVisible(true);
            this.coinIcon.setDepth(100);
            this.coinNumberText.setDepth(100);
        }
    }

    public updateCoins(coins: number): void {
        this.coinCount = coins;
        if (this.coinNumberText) {
            this.coinNumberText.setText(coins.toString());
        }
        
        // Update StatsView with new coin amount
        if (this.statsView) {
            this.statsView.setCurrency(coins);
        }
        
        // Trigger event for buttons to update their state
        this.scene.events.emit('updateCoins', coins);
    }

    // Additional method used by the UpgradeButton
    public updateCoinCount(amount: number): void {
        this.coinCount = amount;
        if (this.coinNumberText) {
            this.coinNumberText.setText(amount.toString());
        }
        
        // Update StatsView with new coin amount
        if (this.statsView) {
            this.statsView.setCurrency(amount);
        }
    }

    // Add simple notification method
    showNotification(message: string, color: number = 0xFFFFFF): void {
        console.log(message);
        
        // Create a notification text
        const fontSize = this.screenManager.getResponsiveFontSize(28);
        
        // Get cursor position or use center of screen as fallback
        const pointer = this.scene.input.activePointer;
        const x = pointer.x || this.scene.cameras.main.width / 2;
        const y = pointer.y - 50 || this.scene.cameras.main.height / 2; // Offset above cursor
        
        // Convert the color from number to hex string
        const colorString = '#' + color.toString(16).padStart(6, '0');
        
        const notificationText = this.scene.add.text(
            x,
            y,
            message,
            {
                fontSize: `${fontSize}px`,
                fontFamily: 'pixelFont',
                fontStyle: 'bold',
                color: '#FFFFFF', // White text
                stroke: colorString, // Colored stroke based on parameter
                strokeThickness: 6, // Increased thickness for better visibility
                align: 'center',
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 5,
                    stroke: true,
                    fill: true
                }
            }
        ).setOrigin(0.5).setDepth(5000);
        
        // Animation
        this.scene.tweens.add({
            targets: notificationText,
            alpha: 0,
            y: '-=50',
            ease: 'Power2',
            duration: 2000,
            onComplete: () => {
                notificationText.destroy();
            }
        });
    }

    getCoinCount(): number {
        return this.coinCount;
    }

    destroy(): void {
        // Clean up event listeners
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        this.scene.events.off('ui-refresh-visibility', this.forceAllButtonsVisible, this);
        
        // Destroy UI components
        this.statsView.destroy();
        this.upgradePanel.destroy();
    }

    private updateEmblemCount(): void {
        try {
            // Get the emblem count from the GameScene
            const gameScene = this.scene.scene.get('GameScene');
            if (!gameScene) return;
            
            // Get emblem count directly
            const emblemCount = (gameScene as any).emblemManager?.getEmblemCount() || 0;
            
            // Update the emblem text
            if (this.emblemNumberText) {
                this.emblemNumberText.setText(emblemCount.toString());
            }
        } catch (error) {
            console.log('Emblem count not available yet');
            // Use default value when emblem manager is not yet initialized
            if (this.emblemNumberText) {
                this.emblemNumberText.setText('0');
            }
        }
    }

    // Update both coin and emblem counts
    updateCounts(): void {
        this.updateCoins(this.coinCount);
        this.updateEmblemCount();
    }

    // Update method that gets called every frame
    private onUpdate(): void {
        // Update the emblem count every frame
        this.updateEmblemCount();
    }

    // Add a method to update the health display in StatsView
    updateHealthDisplay(currentHP: number, maxHP: number): void {
        if (this.statsView) {
            this.statsView.setHP(currentHP, maxHP);
        }
    }
}

// managers/UIManager.js
import Phaser from 'phaser';
import { Header } from '../ui/components/Header';
import { ButtonPanel } from '../ui/components/ButtonPanel';
import Button from '../ui/Button';
import Tower from '../objects/towers/Tower';
import { UpgradeButton } from '../ui/components/UpgradeButton';
import { SkillType } from '../types/SkillType';
import { UpgradeManager } from './UpgradeManager';
import { ScreenManager } from './ScreenManager';


export class UIManager {
    private header!: Header;
    private buttonPanel!: ButtonPanel;
    private coinCount: number = 0;
    private coinIcon!: Phaser.GameObjects.Image;
    private coinNumberText!: Phaser.GameObjects.Text;
    private upgradeManager: UpgradeManager;
    private screenManager: ScreenManager;

    // Responsive design constants
    private readonly HEADER_HEIGHT_RATIO = 0.03; // 3% of screen height
    private readonly BUTTON_PANEL_HEIGHT_RATIO = 0.21; // 21% of screen height
    private readonly BUTTON_SIZE_RATIO = 0.02; // 2% of screen width
    private readonly BUTTON_SPACING_RATIO = 0.04; // 4% of screen width
    private readonly GAME_VIEW_HEIGHT_RATIO = 0.70; // 70% of screen height
    private readonly ICON_SIZE_RATIO = 0.04; // 4% of screen width
    private readonly FONT_SIZE_RATIO = 0.04; // 4% of screen width

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
    }

    private initilizeHeader(iconSize: number, fontSize: number): void {
        // Create header with screenManager
        this.header = new Header(this.scene, this.screenManager);
        
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

         // Add elements to header
         // Create a container for coin display
         const coinContainer = this.scene.add.container(0, 0);
         coinContainer.add(this.coinIcon);
         coinContainer.add(this.coinNumberText);
         
         // Position the coin text relative to the icon
         this.coinNumberText.setPosition(this.coinIcon.width * 0.6, 0);
         
         // Add the container as a single element
         this.header.addElement(coinContainer);
    }

    private initilizeButtonPanel(): void {
        this.buttonPanel = new ButtonPanel(this.scene, 2, 3, this.screenManager);
        
        // Get responsive font size from ScreenManager
        const fontSize = this.screenManager.getResponsiveFontSize(16);

        // Create interactive text for regen
        const regenButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.HEALTH_REGEN,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Health\nRegen',
            x: 0,
            y: 0,
            width: fontSize * 8,
            height: fontSize * 3
        });
        const healthButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.MAX_HEALTH,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Health',
            x: 0,
            y: 0,
            width: fontSize * 8,
            height: fontSize * 3
        })
        const defenseButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.DEFENSE,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Defense',
            x: 0,
            y: 0,
            width: fontSize * 8,
            height: fontSize * 3
        })
        const damageButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.DAMAGE,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Damage',
            x: 0,
            y: 0,
            width: fontSize * 8,
            height: fontSize * 3
        })
        const goldRewardButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.COIN_REWARD,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Gold\nBonus',
            x: 0,
            y: 0,
            width: fontSize * 8,
            height: fontSize * 3
        })
        const attackSpeedButton = new UpgradeButton({
            scene: this.scene,
            skillType: SkillType.ATTACK_SPEED,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Attack\nSpeed',
            x: 0,
            y: 0,
            width: fontSize * 8,
            height: fontSize * 3
        })

        this.buttonPanel.addElement(regenButton);
        this.buttonPanel.addElement(healthButton);
        this.buttonPanel.addElement(defenseButton);
        this.buttonPanel.addElement(damageButton);
        this.buttonPanel.addElement(goldRewardButton);
        this.buttonPanel.addElement(attackSpeedButton);
        this.updatePositions();
    }

    private initialize(): void {
        // Use ScreenManager to get screen dimensions
        const { width } = this.screenManager.getScreenSize();
        const iconSize = width * this.ICON_SIZE_RATIO;
        const fontSize = this.screenManager.getResponsiveFontSize(16);
        
        this.initilizeHeader(iconSize, fontSize);
        this.initilizeButtonPanel();
    }

    private handleScreenResize(gameScale: number): void {
        // Use ScreenManager to get updated dimensions
        const { width, height } = this.screenManager.getScreenSize();
        
        // Update positions based on new dimensions
        this.updatePositions();
    }

    private updatePositions(): void {
        const { width, height } = this.screenManager.getScreenSize();

        // Calculate dimensions
        const headerHeight = height * this.HEADER_HEIGHT_RATIO;
        const buttonPanelHeight = height * this.BUTTON_PANEL_HEIGHT_RATIO;
        const buttonSize = width * this.BUTTON_SIZE_RATIO;
        const buttonSpacing = width * this.BUTTON_SPACING_RATIO;

        // Position and size header
        const gameViewHeight = height * this.GAME_VIEW_HEIGHT_RATIO; // 70% of screen for game view
        this.header.setPosition(0, gameViewHeight);
        this.header.setSize(width, headerHeight);

        // Position and size button panel
        this.buttonPanel.setPosition(0, gameViewHeight + headerHeight);
        this.buttonPanel.setSize(width, buttonPanelHeight);
    }

    updateCoinCount(count: number): void {
        this.coinCount = count;
        if (this.coinNumberText) {
            this.coinNumberText.setText(count.toString());
        }
    }

    getCoinCount(): number {
        return this.coinCount;
    }

    destroy(): void {
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        this.header.destroy();
        this.buttonPanel.destroy();
    }
}

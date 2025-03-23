// managers/UIManager.js
import Phaser from 'phaser';
import { Header } from '../ui/components/Header';
import { ButtonPanel } from '../ui/components/ButtonPanel';
import Button from '../ui/Button';
import Tower from '../objects/towers/Tower';
import { UpgradeButton } from '../ui/components/UpgradeButton';
import { UpgradeType } from '../types/UpgradeType';
import { UpgradeManager } from '../managers/UpgradeManager';

export class UIManager {
    private header!: Header;
    private buttonPanel!: ButtonPanel;
    private coinCount: number = 0;
    private tapCoefficient: number = 1;
    private coinIcon!: Phaser.GameObjects.Image;
    private coinNumberText!: Phaser.GameObjects.Text;
    private tapText!: Phaser.GameObjects.Text;
    private upgradeManager: UpgradeManager;

    // Responsive design constants
    private readonly HEADER_HEIGHT_RATIO = 0.04; // 10% of screen height
    private readonly BUTTON_PANEL_HEIGHT_RATIO = 0.2; // 20% of screen height
    private readonly BUTTON_SIZE_RATIO = 0.04; // 4% of screen width
    private readonly BUTTON_SPACING_RATIO = 0.02; // 2% of screen width
    private readonly GAME_VIEW_HEIGHT_RATIO = 0.75;
    private readonly ICON_SIZE_RATIO = 0.05; // 5% of screen width
    private readonly FONT_SIZE_RATIO = 0.04; // 3% of screen width

    constructor(
        private scene: Phaser.Scene,
        private onPauseToggle: () => void,
        private onUpgradeClick: () => void,
        private onSettingsClick: () => void,
        private onShopClick: () => void,
        upgradeManager: UpgradeManager
    ) {
        this.upgradeManager = upgradeManager;
        this.initialize();
        this.scene.scale.on('resize', this.handleResize, this);
    }

    private initilizeHeader(iconSize: number, fontSize: number): void {
        // Create header
        this.header = new Header(this.scene);
         // Create coin elements
         this.coinIcon = this.scene.add.image(0, 0, 'coin');
         this.coinIcon.setDisplaySize(iconSize, iconSize);
 
         this.coinNumberText = this.scene.add.text(0, 0, '0', {
             fontSize: `${fontSize}px`,
             color: '#ffffff',
             fontFamily: 'pixelFont'
         }).setOrigin(0, 0.5);
 
         // Create tap text
         this.tapText = this.scene.add.text(0, 0, `X ${this.tapCoefficient.toFixed(1)}`, {
             fontSize: `${fontSize}px`,
             color: '#ffffff',
             fontFamily: 'pixelFont'
         }).setOrigin(0.5, 0.5);
 
         // Add elements to header
         // Create a container for coin display
         const coinContainer = this.scene.add.container(0, 0);
         coinContainer.add(this.coinIcon);
         coinContainer.add(this.coinNumberText);
         
         // Position the coin text relative to the icon
         this.coinNumberText.setPosition(this.coinIcon.width * 0.6, 0);
         
         // Add the container as a single element
         this.header.addElement(coinContainer);
         this.header.addElement(this.tapText);
    }

    private initilizeButtonPanel(): void {
        this.buttonPanel = new ButtonPanel(this.scene, 2, 2);
        
        const { width } = this.scene.scale;
        const fontSize = width * this.FONT_SIZE_RATIO;

        // Create interactive text for regen
        const regenButton = new UpgradeButton({
            scene: this.scene,
            upgradeType: UpgradeType.REGENERATION,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Regen\nHealth',
            x: 0,
            y: 0,
            width: fontSize * 8,
            height: fontSize * 3
        });
        const healthButton = new UpgradeButton({
            scene: this.scene,
            upgradeType: UpgradeType.HEALTH,
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
            upgradeType: UpgradeType.DEFENSE,
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
            upgradeType: UpgradeType.DAMAGE,
            upgradeManager: this.upgradeManager,
            fontSize: fontSize,
            buttonText: 'Damage',
            x: 0,
            y: 0,
            width: fontSize * 8,
            height: fontSize * 3
        })

        this.buttonPanel.addElement(regenButton);
        this.buttonPanel.addElement(healthButton);
        this.buttonPanel.addElement(defenseButton);
        this.buttonPanel.addElement(damageButton);
        this.updatePositions();
    }

    private initialize(): void {
        const { width } = this.scene.scale;
        const iconSize = width * this.ICON_SIZE_RATIO;
        const fontSize = width * this.FONT_SIZE_RATIO;
        this.initilizeHeader(iconSize, fontSize);
        this.initilizeButtonPanel();
    }

    private handleResize(gameSize: Phaser.Structs.Size): void {
        const { width, height } = gameSize;
        
        // Update header
        this.header.handleResize(width);
        
        // Update button panel
        this.buttonPanel.handleResize(width);
        
        // Update positions
        this.updatePositions();
    }

    private updatePositions(): void {
        const { width, height } = this.scene.scale;

        // Calculate dimensions
        const headerHeight = height * this.HEADER_HEIGHT_RATIO;
        const buttonPanelHeight = height * this.BUTTON_PANEL_HEIGHT_RATIO;
        const buttonSize = width * this.BUTTON_SIZE_RATIO;
        const buttonSpacing = width * this.BUTTON_SPACING_RATIO;

        // Position and size header
        const gameViewHeight = height * this.GAME_VIEW_HEIGHT_RATIO; // 60% of screen for game view
        this.header.setPosition(0, gameViewHeight);
        this.header.setSize(width, headerHeight);

        // Position and size button panel
        this.buttonPanel.setPosition(0, gameViewHeight + headerHeight);
        this.buttonPanel.setSize(width, buttonPanelHeight);
    }

    updateCoinCount(count: number): void {
        this.coinCount = count;
        this.coinNumberText.setText(`${Math.floor(count)}`);
    }

    updateTapCoefficient(coefficient: number): void {
        this.tapCoefficient = coefficient;
        this.tapText.setText(`X ${coefficient.toFixed(1)}`);
    }

    destroy(): void {
        this.scene.scale.removeListener('resize', this.handleResize, this);
        this.header.destroy();
        this.buttonPanel.destroy();
    }
}

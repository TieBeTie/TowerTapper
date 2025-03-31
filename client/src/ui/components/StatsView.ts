import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';
import { ProgressBar } from '../ProgressBar';

export class StatsView {
    private container!: Phaser.GameObjects.Container;
    private background!: Phaser.GameObjects.Graphics;
    private contentContainer!: Phaser.GameObjects.Container;
    private progressBar!: ProgressBar;
    private hpText!: Phaser.GameObjects.Text;
    private hpContainer!: Phaser.GameObjects.Container;
    private currencyContainer!: Phaser.GameObjects.Container;
    private currentWidth: number = 0;
    private currentHeight: number = 0;
    private screenManager: ScreenManager;
    private currentHP: number = 100;
    private maxHP: number = 100;

    // Layout constants
    private readonly ELEMENTS_SPACING_RATIO = 0.03; // 3% of screen width
    private readonly PADDING_RATIO = 0.03; // 3% of screen width
    private readonly HP_BAR_WIDTH_RATIO = 0.12; // 12% of screen width

    constructor(
        private scene: Phaser.Scene,
        screenManager: ScreenManager
    ) {
        this.screenManager = screenManager;
        this.create();
        
        // Subscribe to screen resize events
        this.scene.events.on('screenResize', this.handleScreenResize, this);
    }

    private create(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const gameScale = this.screenManager.getGameScale();

        // Create main container
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(900); // High depth to appear above most game elements but below UI panels
        
        // Create semi-transparent background
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x000000, 0.5); // Semi-transparent black
        this.container.add(this.background);

        // Create content container for elements
        this.contentContainer = this.scene.add.container(0, 0);
        this.container.add(this.contentContainer);
        
        // Create HP container (left side)
        this.hpContainer = this.scene.add.container(0, 0);
        this.contentContainer.add(this.hpContainer);
        
        // Create progress bar (for HP display) - narrower
        const progressBarWidth = width * this.HP_BAR_WIDTH_RATIO * gameScale;
        const progressBarHeight = height * 0.02 * gameScale; // Reduced height
        
        this.progressBar = new ProgressBar(
            this.scene,
            0,
            0,
            progressBarWidth,
            progressBarHeight,
            {
                background: 0x222222,
                fill: 0xff3333,       // Red for HP
                border: 0x000000,
                borderAlpha: 0.7
            }
        );
        this.progressBar.setValue((this.currentHP / this.maxHP) * 100);
        this.hpContainer.add(this.progressBar);
        
        // Create HP text (smaller font)
        const fontSize = Math.max(10, Math.round(11 * gameScale));
        this.hpText = this.scene.add.text(0, 0, `${this.currentHP}/${this.maxHP}`, {
            fontSize: `${fontSize}px`,
            color: '#ffffff',
            fontFamily: 'pixelFont',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        
        // Add text to HP container
        this.hpContainer.add(this.hpText);
        
        // Create currency container (right side)
        this.currencyContainer = this.scene.add.container(0, 0);
        this.contentContainer.add(this.currencyContainer);
    }

    private handleScreenResize(gameScale: number): void {
        const { width, height } = this.screenManager.getScreenSize();
        
        // Resize progress bar
        const progressBarWidth = width * this.HP_BAR_WIDTH_RATIO * gameScale;
        const progressBarHeight = height * 0.02 * gameScale;
        
        // Remove old progress bar and HP text
        if (this.progressBar) {
            this.progressBar.destroy();
        }
        
        if (this.hpText) {
            this.hpText.destroy();
        }
        
        // Create new progress bar with updated size
        this.progressBar = new ProgressBar(
            this.scene,
            0,
            0,
            progressBarWidth,
            progressBarHeight,
            {
                background: 0x222222,
                fill: 0xff3333,       // Red for HP
                border: 0x000000,
                borderAlpha: 0.7
            }
        );
        this.progressBar.setValue((this.currentHP / this.maxHP) * 100);
        this.hpContainer.add(this.progressBar);
        
        // Create new HP text with updated font size
        const fontSize = Math.max(10, Math.round(11 * gameScale));
        this.hpText = this.scene.add.text(0, 0, `${this.currentHP}/${this.maxHP}`, {
            fontSize: `${fontSize}px`,
            color: '#ffffff',
            fontFamily: 'pixelFont',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        this.hpContainer.add(this.hpText);
        
        this.distributeElements();
    }

    setPosition(x: number, y: number): void {
        this.container.setPosition(x, y);
    }

    setSize(width: number, height: number): void {
        this.currentWidth = width;
        this.currentHeight = height;
        
        // Redraw background
        this.background.clear();
        this.background.fillStyle(0x000000, 0.5);
        this.background.fillRect(0, 0, width, height);
        
        this.distributeElements();
    }

    // Set HP value and update progress bar
    setHP(currentHP: number, maxHP: number): void {
        this.currentHP = currentHP;
        this.maxHP = maxHP;
        
        // Update progress bar
        if (this.progressBar) {
            this.progressBar.setValue((currentHP / maxHP) * 100);
        }
        
        // Update HP text
        if (this.hpText) {
            this.hpText.setText(`${Math.floor(currentHP)}/${maxHP}`);
        }
    }

    // Add element specifically to the currency container
    addCurrencyElement(element: Phaser.GameObjects.GameObject | Phaser.GameObjects.Container): void {
        this.currencyContainer.add(element);
        this.distributeElements();
    }

    // Add generic element to the content container
    addElement(element: Phaser.GameObjects.GameObject | Phaser.GameObjects.Container): void {
        this.contentContainer.add(element);
        this.distributeElements();
    }

    private distributeElements(): void {
        // Get screen size info
        const { width } = this.screenManager.getScreenSize();
        const gameScale = this.screenManager.getGameScale();
        
        // Calculate spacing and padding
        const elementsSpacing = width * this.ELEMENTS_SPACING_RATIO * gameScale;
        const padding = width * this.PADDING_RATIO * gameScale;
        
        // Vertical center
        const centerY = this.currentHeight / 2;
        
        // Position HP container (left side)
        if (this.hpContainer) {
            this.hpContainer.setPosition(padding, centerY);
            
            // Position HP text over the progress bar
            if (this.hpText && this.progressBar) {
                this.hpText.setPosition(this.progressBar.width / 2, 0);
            }
        }
        
        // Prepare to position currency elements - calculate available width
        const availableWidth = this.currentWidth - padding * 2;
        const hpWidth = this.progressBar ? this.progressBar.width + padding : 0;
        const currencyWidth = availableWidth - hpWidth;
        
        // Get all currency elements
        const elements = this.contentContainer.list.filter(e => e !== this.hpContainer);
        
        // Calculate total width needed for all elements
        let totalWidth = 0;
        elements.forEach(element => {
            if (element instanceof Phaser.GameObjects.Container) {
                let maxWidth = 0;
                element.each((child: any) => {
                    if (child.x + child.displayWidth / 2 > maxWidth) {
                        maxWidth = child.x + child.displayWidth / 2;
                    }
                });
                totalWidth += maxWidth + elementsSpacing;
            } else if (element instanceof Phaser.GameObjects.Sprite || 
                      element instanceof Phaser.GameObjects.Image || 
                      element instanceof Phaser.GameObjects.Text) {
                totalWidth += element.displayWidth + elementsSpacing;
            }
        });
        
        // Start positioning from right
        let currentX = this.currentWidth - padding;
        
        // Position elements
        for (let i = elements.length - 1; i >= 0; i--) {
            const element = elements[i];
            
            if (element instanceof Phaser.GameObjects.Container) {
                // For containers (coin and emblem displays)
                let containerWidth = 0;
                element.each((child: any) => {
                    if (child.x + child.displayWidth / 2 > containerWidth) {
                        containerWidth = child.x + child.displayWidth / 2;
                    }
                });
                
                // Position from the right
                currentX -= containerWidth;
                element.setPosition(currentX, centerY);
                currentX -= elementsSpacing;
                
            } else if (element instanceof Phaser.GameObjects.Sprite || 
                      element instanceof Phaser.GameObjects.Image || 
                      element instanceof Phaser.GameObjects.Text) {
                
                // Position from the right
                currentX -= element.displayWidth;
                element.setPosition(currentX + element.displayWidth / 2, centerY);
                currentX -= elementsSpacing;
            }
        }
    }

    setVisible(visible: boolean): void {
        this.container.setVisible(visible);
    }

    destroy(): void {
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        if (this.progressBar) {
            this.progressBar.destroy();
        }
        if (this.hpText) {
            this.hpText.destroy();
        }
        this.container.destroy();
    }
} 
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
    private readonly ELEMENTS_SPACING_RATIO = 0.1; // 3% of screen width
    private readonly PADDING_RATIO = 0.08; // 3% of screen width
    private readonly HP_BAR_WIDTH_RATIO = 0.24; // Снижаем с 0.2 до 0.18
    private readonly HP_BAR_HEIGHT_RATIO = 0.06; // Снижаем высоту с 0.4 до 0.02 (2% высоты экрана)
    private readonly HP_COLOR = 0x009900; // darker green
    private readonly HP_BACKGROUND_COLOR = 0x005500; // even darker green

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
        this.container.setDepth(1500); // Increased from 900 to 1500
        
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
        
        // Инициализируем currentWidth/Height для начального создания полоски HP
        this.currentWidth = width;
        this.currentHeight = height * 0.1; // Примерная высота StatsView (10% от высоты экрана)
        
        // Create progress bar (for HP display) - относительно размеров StatsView
        const progressBarWidth = this.currentWidth * this.HP_BAR_WIDTH_RATIO * gameScale;
        const progressBarHeight = this.currentHeight * this.HP_BAR_HEIGHT_RATIO * gameScale;
        
        this.progressBar = new ProgressBar(
            this.scene,
            0,
            0,
            progressBarWidth,
            progressBarHeight,
            {
                background: this.HP_BACKGROUND_COLOR,
                fill: this.HP_COLOR,      // dark green for HP
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
        
        // Force higher depth on HP text to ensure visibility
        this.hpText.setDepth(1600);
        
        // Add text to HP container
        this.hpContainer.add(this.hpText);
        
        // Create currency container (right side)
        this.currencyContainer = this.scene.add.container(0, 0);
        this.contentContainer.add(this.currencyContainer);
        
        // Log creation for debugging
        console.log('StatsView created with HP container at depth:', this.container.depth);
    }

    private handleScreenResize(gameScale: number): void {
        const { width, height } = this.screenManager.getScreenSize();
        
        // Resize progress bar - используем размеры StatsView, а не экрана
        const progressBarWidth = this.currentWidth * this.HP_BAR_WIDTH_RATIO * gameScale;
        const progressBarHeight = this.currentHeight * this.HP_BAR_HEIGHT_RATIO * gameScale;
        
        // Safely destroy existing objects before creating new ones
        try {
            // Remove old progress bar and HP text
            if (this.progressBar) {
                this.progressBar.destroy();
                this.progressBar = null as any;
            }
            
            if (this.hpText) {
                this.hpText.destroy();
                this.hpText = null as any;
            }
            
            // Create new progress bar with updated size
            this.progressBar = new ProgressBar(
                this.scene,
                0,
                0,
                progressBarWidth,
                progressBarHeight,
                {
                    background: this.HP_BACKGROUND_COLOR,
                    fill: this.HP_COLOR,
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
            
            // Ensure all elements are visible after resize
            this.forceVisibility();
        } catch (error) {
            console.error('Error during screen resize handling:', error);
        }
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
        
        // Update HP text with null check
        if (this.hpText && this.hpText.scene) {
            try {
                this.hpText.setText(`${Math.floor(currentHP)}/${maxHP}`);
                
                // Ensure visibility and depth
                this.hpText.setVisible(true);
                this.hpText.setDepth(1600);
                } catch (error) {
                console.warn('Error updating HP text:', error);
                // Recreate text if there was an error
                this.recreateHPText();
            }
        } else {
            // If HP text doesn't exist, recreate it
            console.warn('HP text missing or invalid, recreating...');
            this.recreateHPText();
        }
        
        // Ensure parent containers are visible
        this.hpContainer.setVisible(true);
        this.contentContainer.setVisible(true);
        this.container.setVisible(true);
    }

    // Method to safely recreate the HP text if it gets into a broken state
    private recreateHPText(): void {
        const gameScale = this.screenManager.getGameScale();
        
        // Safely destroy previous text if it exists
        if (this.hpText) {
            try {
                this.hpText.destroy();
            } catch (error) {
                console.warn('Error destroying HP text:', error);
            }
        }
        
        // Create new HP text with updated font size
        const fontSize = Math.max(10, Math.round(11 * gameScale));
        try {
            this.hpText = this.scene.add.text(0, 0, `${this.currentHP}/${this.maxHP}`, {
                fontSize: `${fontSize}px`,
                color: '#ffffff',
                fontFamily: 'pixelFont',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            }).setOrigin(0.5);
            
            // Force higher depth on recreated HP text
            this.hpText.setDepth(1600);
            
            this.hpContainer.add(this.hpText);
            
            // Position the text correctly
            this.distributeElements();
            
            // Log recreation for debugging
            console.log('HP text recreated with depth:', this.hpText.depth);
        } catch (error) {
            console.error('Failed to recreate HP text:', error);
        }
    }

    // Update currency display
    setCurrency(amount: number): void {
        // Find currency text element in the currency container
        if (this.currencyContainer) {
            const currencyElements = this.currencyContainer.list;
            
            // Find text element that displays currency amount
            const currencyText = currencyElements.find(element => 
                element instanceof Phaser.GameObjects.Text
            ) as Phaser.GameObjects.Text | undefined;
            
            // Update the text if found
            if (currencyText && currencyText.scene) {
                try {
                    currencyText.setText(`${amount}`);
                } catch (error) {
                    console.warn('Error updating currency text:', error);
                    this.recreateCurrencyText(amount);
                }
            }
        }
    }
    
    // Recreate currency text if needed
    private recreateCurrencyText(amount: number): void {
        if (!this.currencyContainer) return;
        
        const gameScale = this.screenManager.getGameScale();
        
        // Find and remove old text
        const oldText = this.currencyContainer.list.find(element => 
            element instanceof Phaser.GameObjects.Text
        );
        
        if (oldText) {
            try {
                this.currencyContainer.remove(oldText);
                oldText.destroy();
            } catch (error) {
                console.warn('Error destroying currency text:', error);
            }
        }
        
        // Create new currency text
        try {
            const fontSize = Math.max(10, Math.round(11 * gameScale));
            const newText = this.scene.add.text(0, 0, `${amount}`, {
                fontSize: `${fontSize}px`,
                color: '#ffffff',
                fontFamily: 'pixelFont',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            }).setOrigin(0.5);
            
            this.currencyContainer.add(newText);
            this.distributeElements();
        } catch (error) {
            console.error('Failed to recreate currency text:', error);
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
        const leftCenterOfCenterX = this.currentWidth / 4;
        const beginOfCenterX = leftCenterOfCenterX - (this.progressBar.width / 2);
        
        // Position HP container (left side) - возвращаем оригинальную позицию
        if (this.hpContainer) {
            // Корректируем позиционирование, сдвигая на половину высоты прогресс-бара
            this.hpContainer.setPosition(beginOfCenterX, centerY - (this.progressBar.height / 2));
            
            // Position HP text over the progress bar
            if (this.hpText && this.progressBar) {
                // Позиционируем текст точно по центру полоски HP
                this.hpText.setPosition(this.progressBar.width / 2, this.progressBar.height / 2);
                
                // Убеждаемся, что текст видим поверх полоски
                this.hpText.setDepth(1600);
                this.hpText.setVisible(true);
            }
        }

        // Calculate right side container position (centered in right half)
        const rightHalfWidth = this.currentWidth / 2;
        const rightHalfCenter = this.currentWidth * 0.75; // Center of right half
        
        // Position currency container in the right side (centered)
        if (this.currencyContainer) {
            this.currencyContainer.setPosition(rightHalfCenter, centerY);
            
            // Get all currency elements
            const currencyElements = this.currencyContainer.list;
            
            // If there are currency elements, arrange them horizontally centered
            if (currencyElements.length > 0) {
                let totalWidth = 0;
                
                // Calculate total width of all elements
                currencyElements.forEach(element => {
                    if ('width' in element) {
                        totalWidth += (element.width as number) + elementsSpacing;
                    }
                });
                
                // Subtract last spacing
                if (currencyElements.length > 0) {
                    totalWidth -= elementsSpacing;
                }
                
                // Position elements horizontally centered
                let currentX = -totalWidth / 2;
                
                currencyElements.forEach(element => {
                    if ('width' in element) {
                        const elementWidth = element.width as number;
                        (element as any).setPosition(currentX + elementWidth / 2, 0);
                        currentX += elementWidth + elementsSpacing;
                    }
                });
            }
        }
    }

    setVisible(visible: boolean): void {
        this.container.setVisible(visible);
        
        // If setting to visible, also ensure all child elements are visible
        if (visible) {
            this.forceVisibility();
        }
    }

    // Force visibility on all elements
    forceVisibility(): void {
        // Make sure main containers are visible
        this.container.setVisible(true);
        this.contentContainer.setVisible(true);
        this.hpContainer.setVisible(true);
        
        // Ensure HP bar elements are visible
        if (this.progressBar && 'setVisible' in this.progressBar) {
            (this.progressBar as any).setVisible(true);
        }
        
        // Ensure HP text is visible with proper depth
        if (this.hpText) {
            this.hpText.setVisible(true);
            this.hpText.setDepth(1600);
            
            // Force text refresh
            this.hpText.setText(this.hpText.text);
        }
        
        // Log visibility enforcement
        console.log('Forced visibility on StatsView elements');
    }

    destroy(): void {
        // Unsubscribe from events first
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        
        // Safe destruction of components
        try {
            if (this.progressBar) {
                this.progressBar.destroy();
                this.progressBar = null as any;
            }
            
            if (this.hpText && this.hpText.scene) {
                this.hpText.destroy();
                this.hpText = null as any;
            }
            
            // Finally destroy the container (which will destroy children)
            if (this.container && this.container.scene) {
                this.container.destroy();
            }
        } catch (error) {
            console.warn('Error during StatsView destruction:', error);
        }
    }
} 
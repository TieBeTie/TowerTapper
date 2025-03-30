import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';

export class StatsView {
    private container!: Phaser.GameObjects.Container;
    private background!: Phaser.GameObjects.Graphics;
    private contentContainer!: Phaser.GameObjects.Container;
    private currentWidth: number = 0;
    private currentHeight: number = 0;
    private screenManager: ScreenManager;

    // Layout constants
    private readonly ELEMENTS_SPACING_RATIO = 0.02; // 2% of screen width
    private readonly PADDING_RATIO = 0.01; // 1% of screen width

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
    }

    private handleScreenResize(gameScale: number): void {
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

    addElement(element: Phaser.GameObjects.GameObject | Phaser.GameObjects.Container): void {
        this.contentContainer.add(element);
        this.distributeElements();
    }

    private distributeElements(): void {
        const elements = this.contentContainer.list;
        if (elements.length === 0) return;
        
        // Get screen size info from ScreenManager
        const { width } = this.screenManager.getScreenSize();
        const gameScale = this.screenManager.getGameScale();
        
        // Calculate element spacing
        const elementsSpacing = width * this.ELEMENTS_SPACING_RATIO * gameScale;
        const padding = width * this.PADDING_RATIO * gameScale;
        
        // Position elements in a row with equal spacing
        let currentX = padding;
        const centerY = this.currentHeight / 2;
        
        elements.forEach((element) => {
            if (element instanceof Phaser.GameObjects.Container) {
                element.setPosition(currentX, centerY);
                // Get the width of the container by finding its rightmost element
                let maxWidth = 0;
                element.each((child: any) => {
                    if (child.x + child.displayWidth / 2 > maxWidth) {
                        maxWidth = child.x + child.displayWidth / 2;
                    }
                });
                currentX += maxWidth + elementsSpacing;
            } else if (element instanceof Phaser.GameObjects.Sprite || 
                      element instanceof Phaser.GameObjects.Image || 
                      element instanceof Phaser.GameObjects.Text) {
                element.setPosition(currentX + element.displayWidth / 2, centerY);
                currentX += element.displayWidth + elementsSpacing;
            }
        });
    }

    setVisible(visible: boolean): void {
        this.container.setVisible(visible);
    }

    destroy(): void {
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        this.container.destroy();
    }
} 
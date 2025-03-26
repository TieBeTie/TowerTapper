import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';

export class Header {
    private container!: Phaser.GameObjects.Container;
    private contentContainer!: Phaser.GameObjects.Container;
    private background!: Phaser.GameObjects.Graphics;
    private currentWidth: number = 0;
    private currentHeight: number = 0;
    private screenManager: ScreenManager;

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
        const { width } = this.screenManager.getScreenSize();

        // Create main container
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(1000); // Set high depth to appear above game scene
        
        // Create background
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x000000, 0.3);
        this.container.add(this.background);

        // Create content container for elements
        this.contentContainer = this.scene.add.container(0, 0);
        this.container.add(this.contentContainer);

        // Set initial size with percentage-based height
        const height = width * 0.1; // 10% of screen width
        this.setSize(width, height);
    }

    private handleScreenResize(gameScale: number): void {
        const { width } = this.screenManager.getScreenSize();
        const height = width * 0.1; // 10% of screen width
        this.setSize(width, height);
        this.distributeElements();
    }

    setPosition(x: number, y: number): void {
        this.container.setPosition(x, y);
    }

    setSize(width: number, height: number): void {
        this.currentWidth = width;
        this.currentHeight = height;
        this.background.clear();
        this.background.fillStyle(0x000000, 0.3);
        this.background.fillRect(0, 0, width, height);
        this.distributeElements();
    }

    // Method to add elements to the content container
    addElement(element: Phaser.GameObjects.GameObject): void {
        this.contentContainer.add(element);
        this.distributeElements();
    }

    private distributeElements(): void {
        const elements = this.contentContainer.list;
        if (elements.length === 0) return;

        const sectionWidth = this.currentWidth / elements.length;
        const centerY = this.currentHeight / 2;
        
        // Use game scale to adjust element positions and sizes
        const gameScale = this.screenManager.getGameScale();

        elements.forEach((element, index) => {
            const x = sectionWidth * index + sectionWidth / 2;
            
            if (element instanceof Phaser.GameObjects.Container) {
                element.setPosition(x, centerY);
                // Scale container contents if needed
                element.setScale(gameScale);
            } else if (element instanceof Phaser.GameObjects.Text) {
                element.setPosition(x, centerY);
                // Set text size based on responsive font size
                const baseFontSize = parseInt(element.style.fontSize as string) || 16;
                element.setFontSize(this.screenManager.getResponsiveFontSize(baseFontSize));
            } else if (element instanceof Phaser.GameObjects.Image) {
                element.setPosition(x, centerY);
                element.setScale(gameScale);
            }
        });
    }

    destroy(): void {
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        this.container.destroy();
    }
} 
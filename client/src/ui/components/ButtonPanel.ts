import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';

export class ButtonPanel {
    private container!: Phaser.GameObjects.Container;
    private contentContainer!: Phaser.GameObjects.Container;
    private background!: Phaser.GameObjects.Graphics;
    private currentWidth: number = 0;
    private currentHeight: number = 0;
    private screenManager: ScreenManager;

    // Layout constants
    private readonly BUTTON_SIZE_RATIO = 0.03; // 3% of screen width
    private readonly BUTTON_SPACING_RATIO = 0.04; // 4% of screen width
    private readonly BUTTON_PADDING_RATIO = 0.01; // 1% of screen width
    private readonly BUTTON_MARGIN_RATIO = 0.01; // 1% of screen width
    private readonly BUTTON_BORDER_RATIO = 0.005; // 0.5% of screen width

    constructor(
        private scene: Phaser.Scene,
        private columns: number = 2,
        private rows: number = 2,
        screenManager?: ScreenManager
    ) {
        this.screenManager = screenManager || new ScreenManager(scene);
        this.create();
        
        // Subscribe to screen resize events
        this.scene.events.on('screenResize', this.handleScreenResize, this);
    }

    private create(): void {
        const { width } = this.screenManager.getScreenSize();

        // Create main container
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(1000); // Set high depth to appear above game scene
        
        // Create completely transparent background
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x000000, 0); // Полностью прозрачный
        this.container.add(this.background);

        // Create content container for elements
        this.contentContainer = this.scene.add.container(0, 0);
        this.container.add(this.contentContainer);

        // Set initial size based on percentage of screen width
        const height = width * 0.4; // 40% of screen width for 2x2 grid
        this.setSize(width, height);
    }

    private handleScreenResize(gameScale: number): void {
        const { width } = this.screenManager.getScreenSize();
        const height = width * 0.4; // 40% of screen width for 2x2 grid
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
        this.background.fillStyle(0x000000, 0); // Полностью прозрачный
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

        // Get screen size and game scale from ScreenManager
        const { width } = this.screenManager.getScreenSize();
        const gameScale = this.screenManager.getGameScale();

        // Get sizes from constants
        const buttonSize = width * this.BUTTON_SIZE_RATIO * gameScale;
        const buttonSpacing = width * this.BUTTON_SPACING_RATIO * gameScale;
        const buttonPadding = width * this.BUTTON_PADDING_RATIO * gameScale;
        const buttonMargin = width * this.BUTTON_MARGIN_RATIO * gameScale;

        // Calculate cell dimensions for even distribution
        const cellWidth = this.currentWidth / this.columns;
        const cellHeight = this.currentHeight / this.rows;

        // Position elements in grid
        elements.forEach((element, index) => {
            const row = Math.floor(index / this.columns);
            const col = index % this.columns;
            
            // Calculate cell center position with spacing
            const x = (col * cellWidth) + (cellWidth / 2);
            const y = (row * cellHeight) + (cellHeight / 2);

            // Apply position and size based on element type
            if (element instanceof Phaser.GameObjects.Container) {
                element.setPosition(x, y);
                if (element instanceof Phaser.GameObjects.Sprite) {
                    element.setDisplaySize(buttonSize, buttonSize);
                }
            } else if (element instanceof Phaser.GameObjects.Text) {
                element.setPosition(x, y);
                // Adjust text size for responsive layout
                const baseFontSize = parseInt(element.style.fontSize as string) || 16;
                element.setFontSize(this.screenManager.getResponsiveFontSize(baseFontSize));
            } else if (element instanceof Phaser.GameObjects.Image || element instanceof Phaser.GameObjects.Sprite) {
                element.setPosition(x, y);
                element.setDisplaySize(buttonSize, buttonSize);
            }
        });
    }

    destroy(): void {
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        this.container.destroy();
    }
} 
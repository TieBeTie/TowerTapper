import Phaser from 'phaser';

export class ButtonPanel {
    private container!: Phaser.GameObjects.Container;
    private contentContainer!: Phaser.GameObjects.Container;
    private background!: Phaser.GameObjects.Graphics;
    private currentWidth: number = 0;
    private currentHeight: number = 0;

    constructor(
        private scene: Phaser.Scene
    ) {
        this.create();
    }

    private create(): void {
        const { width } = this.scene.scale;

        // Create main container
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(1000); // Set high depth to appear above game scene
        
        // Create background
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x000000, 0.5);
        this.container.add(this.background);

        // Create content container for elements
        this.contentContainer = this.scene.add.container(0, 0);
        this.container.add(this.contentContainer);

        // Set initial size
        const height = width * 0.2; // 20% of screen width
        this.setSize(width, height);
    }

    handleResize(width: number): void {
        const height = width * 0.2; // 20% of screen width
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
        this.background.fillStyle(0x000000, 0.5);
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

        elements.forEach((element, index) => {
            const x = sectionWidth * index + sectionWidth / 2;
            if (element instanceof Phaser.GameObjects.Container) {
                element.setPosition(x, centerY);
            } else if (element instanceof Phaser.GameObjects.Text) {
                element.setPosition(x, centerY);
            } else if (element instanceof Phaser.GameObjects.Image) {
                element.setPosition(x, centerY);
            }
        });
    }

    destroy(): void {
        // No need to remove resize listener anymore
    }
} 
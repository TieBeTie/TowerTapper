import Phaser from 'phaser';

interface ButtonOptions {
    scene: Phaser.Scene;
    x: number;
    y: number;
    texture: string;
    callback: () => void;
}

class Button extends Phaser.GameObjects.Sprite {
    private callback: () => void;

    constructor(options: ButtonOptions) {
        const { scene, x, y, texture, callback } = options;
        super(scene, x, y, texture);
        scene.add.existing(this);

        this.callback = callback;

        // Set initial scale based on screen size
        this.updateScale();

        this.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.callback();
            });

        // Ensure the Button GameObject exists before setting it as draggable
        scene.input.setDraggable(this, true);

        // Listen for resize events
        scene.scale.on('resize', this.handleResize, this);
    }

    private handleResize(gameSize: Phaser.Structs.Size): void {
        this.updateScale();
    }

    private updateScale(): void {
        const { width, height } = this.scene.scale;
        const baseWidth = this.scene.scale.baseSize.width;
        const baseHeight = this.scene.scale.baseSize.height;
        const scaleX = width / baseWidth;
        const scaleY = height / baseHeight;
        const scale = Math.min(scaleX, scaleY);
        this.setScale(scale);
    }

    destroy(fromScene?: boolean): void {
        this.scene.scale.removeListener('resize', this.handleResize, this);
        super.destroy(fromScene);
    }
}

export default Button;

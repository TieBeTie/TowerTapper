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

        this.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.callback();
            });

        // Ensure the Button GameObject exists before setting it as draggable
        scene.input.setDraggable(this, true);
    }

    // Add additional methods and type annotations as needed
}

export default Button;

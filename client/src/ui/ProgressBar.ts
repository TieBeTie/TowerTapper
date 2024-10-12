import Phaser from 'phaser';

class ProgressBar extends Phaser.GameObjects.Graphics {
    width: number;
    height: number;
    value: number;
    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
        super(scene);
        this.setPosition(x, y);
        this.width = width;
        this.height = height;
        this.value = 0;
        scene.add.existing(this);
        this.draw();
    }

    setValue(value: number): void {
        this.value = Phaser.Math.Clamp(value, 0, 100);
        this.draw();
    }

    draw(): void {
        this.clear();
        // Background
        this.fillStyle(0x808080, 1);
        this.fillRect(0, 0, this.width, this.height);
        // Progress
        this.fillStyle(0x00ff00, 1);
        this.fillRect(0, 0, (this.value / 100) * this.width, this.height);
    }
}

export default ProgressBar;
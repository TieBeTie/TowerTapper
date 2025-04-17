import Phaser from 'phaser';

class Panel extends Phaser.GameObjects.Container {
    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
        super(scene, x, y);
        this.setSize(width, height);
        scene.add.existing(this);
    }

    // Add additional methods and properties as needed
}

export default Panel;
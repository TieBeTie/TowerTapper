import Phaser from 'phaser';

class Button extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture, callback) {
        super(scene, x, y, texture);
        this.setInteractive({ useHandCursor: true });
        this.on('pointerdown', callback);
        scene.add.existing(this);
    }
}

export default Button;
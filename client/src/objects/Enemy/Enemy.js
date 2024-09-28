import Phaser from 'phaser';

class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        // Инициализация параметров врага
    }

    update(time, delta) {
        // Логика обновления врага
    }
}

export default Enemy;
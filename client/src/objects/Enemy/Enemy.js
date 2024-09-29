import Phaser from 'phaser';

class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.speed = 100;
        this.health = 100;

        // Получение ссылки на замок
        this.castle = scene.castle;

        // Настройка столкновений
        this.body.setCollideWorldBounds(false);
    }

    update(time, delta) {
        // Логика движения к замку
        this.scene.physics.moveToObject(this, this.castle, this.speed);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroy();
        }
    }
}

export default Enemy;
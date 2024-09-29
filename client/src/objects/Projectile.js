import Phaser from 'phaser';

class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, targetX, targetY) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Расчёт направления к цели
        const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        this.body.velocity.x = Math.cos(angle) * 300; // Скорость X
        this.body.velocity.y = Math.sin(angle) * 300; // Скорость Y
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Уничтожение снаряда, если он вышел за пределы сцены
        if (this.x < 0 || this.x > this.scene.scale.width || this.y < 0 || this.y > this.scene.scale.height) {
            this.destroy();
        }
    }
}

export default Projectile;

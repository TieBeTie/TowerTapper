import Phaser from 'phaser';

class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, targetX, targetY) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 300; // Скорость снаряда

        // Расчёт направления к цели
        const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        this.body.velocity.x = Math.cos(angle) * this.speed; // Скорость X
        this.body.velocity.y = Math.sin(angle) * this.speed; // Скорость Y
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Уничтожение снаряда, если он вышел за пределы сцены
        if (this.x < 0 || this.scene.scale.width < this.x || this.y < 0 || this.scene.scale.height < this.y) {
            this.destroy();
        }
    }

    update(time, delta) {
        const nearestEnemy = this.scene.findNearestEnemy(this.x, this.y);
        if (nearestEnemy) {
            // Move towards the nearest enemy
            this.scene.physics.moveToObject(this, nearestEnemy, this.speed);

            // Rotate projectile to face the direction it's moving
            this.rotation = Phaser.Math.Angle.Between(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
        }
    }
}

export default Projectile;

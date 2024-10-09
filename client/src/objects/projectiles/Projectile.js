import Phaser from 'phaser';

class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, target) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 300; // Скорость снаряда
        this.target = target; // Цель снаряда
        this.targetX = target.x;
        this.targetY = target.y;

        // Расчёт направления к цели
        const angle = Phaser.Math.Angle.Between(x, y, target.x, target.y);
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
        if (this.target && this.target.active) {
            // Rotate projectile to face the direction it's moving
            this.rotation = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        }
        this.scene.physics.moveTo(this, this.targetX, this.targetY, this.speed);
        const radius = 10; // Define the radius within which the target is considered "hit"
        if (Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY) <= radius) {
            this.destroy();
        }
    }
}

export default Projectile;

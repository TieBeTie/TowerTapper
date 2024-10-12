import Phaser from 'phaser';
import { Projectile } from './Projectile';

export class Arrow extends Projectile {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        // Additional initialization for Arrow if needed
    }

    fire(targetX: number, targetY: number): void {
        const velocity = 500;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        const velocityVector = new Phaser.Math.Vector2();
        this.scene.physics.velocityFromRotation(angle, velocity, velocityVector);

        if (this.body instanceof Phaser.Physics.Arcade.Body) {
            this.body.setVelocity(velocityVector.x, velocityVector.y);
        } else {
            console.error("The body is not an instance of Phaser.Physics.Arcade.Body");
        }
    }

    update(time: number, delta: number): void {
        super.update(time, delta);
        // Arrow-specific update logic if any
    }
}

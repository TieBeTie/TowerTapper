import Phaser from 'phaser';
import { Projectile } from './Projectile';

export class Arrow extends Projectile {
    targetX: number;
    targetY: number;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        this.targetX = -10000;
        this.targetY = -10000;
        // Additional initialization for Arrow if needed
    }

    fire(targetX: number, targetY: number): void {
        this.targetX = targetX;
        this.targetY = targetY;
    }

    update(time: number, delta: number) {
        if (this.targetX !== -10000 && this.targetY !== -10000) {
            // Rotate projectile to face the direction it's moving
            this.rotation = Phaser.Math.Angle.Between(this.x, this.y, this.targetX, this.targetY);
        }
        this.scene.physics.moveTo(this, this.targetX, this.targetY, 500);
        const radius = 10; // Define the radius within which the target is considered "hit"
        if (Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY) <= radius) {
            this.destroy();
        }
    }
}

import Phaser from 'phaser';
import { Projectile } from './Projectile';

export class Arrow extends Projectile {
    targetX: number;
    targetY: number;
    private speed: number;
    private maxSpeed: number;
    private acceleration: number;
    private deceleration: number;
    private initialDelay: number;
    private elapsedTime: number;
    private direction: Phaser.Math.Vector2;
    private speedMultiplier: number;
    private damage: number = 1000; // Base damage

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        this.targetX = -10000;
        this.targetY = -10000;

        // Set arrow size (increased from 0.5)
        this.setScale(0.7);

        // Initialize movement properties
        this.speed = 0;
        this.maxSpeed = 800; // Base max speed
        this.acceleration = 5000;
        this.deceleration = 3000;
        this.initialDelay = 0;
        this.elapsedTime = 0;
        this.direction = new Phaser.Math.Vector2(0, 0);
        this.speedMultiplier = 1;
    }

    setDamage(damage: number): void {
        this.damage = damage;
    }

    getDamage(): number {
        return this.damage;
    }

    fire(targetX: number, targetY: number, speedMultiplier: number = 1): void {
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = 0;
        this.elapsedTime = 0;
        this.speedMultiplier = speedMultiplier;
        this.direction = new Phaser.Math.Vector2(targetX - this.x, targetY - this.y).normalize();
    }

    update(time: number, delta: number) {
        this.elapsedTime += delta;

        if (this.elapsedTime < this.initialDelay) {
            return;
        }

        const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);
        const decelerationDistance = 100;

        if (distanceToTarget <= decelerationDistance) {
            this.speed -= this.deceleration * (delta / 1000);
            if (this.speed < 0) this.speed = 0;
        } else {
            this.speed += this.acceleration * (delta / 1000);
            const currentMaxSpeed = this.maxSpeed * this.speedMultiplier;
            if (this.speed > currentMaxSpeed) this.speed = currentMaxSpeed;
        }

        if (this.body && 'setVelocity' in this.body) {
            (this.body as Phaser.Physics.Arcade.Body).setVelocity(
                this.direction.x * this.speed,
                this.direction.y * this.speed
            );
        }

        if (this.speed > 0) {
            this.rotation = Phaser.Math.Angle.Between(this.x, this.y, this.targetX, this.targetY);
        }
    }
}
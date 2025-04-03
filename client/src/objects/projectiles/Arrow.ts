import Phaser from 'phaser';
import { Projectile } from './Projectile';
import { SkillType } from '../../types/SkillType';
import { SkillStateManager } from '../../managers/SkillStateManager';

export class Arrow extends Projectile {
    private speed: number;
    private maxSpeed: number;
    private initialDelay: number;
    private elapsedTime: number;
    private direction: Phaser.Math.Vector2;
    private damage: number = 0;
    private skillManager: SkillStateManager;
    static readonly ARROW_SCALE = 0.2;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        this.skillManager = SkillStateManager.getInstance();
        this.damage = this.skillManager.getState(SkillType.DAMAGE) || 0;

        // Set arrow size
        this.setScale(Arrow.ARROW_SCALE);
        
        // Set a circular hitbox for better collision detection
        if (this.body) {
            const circleRadius = Math.max(this.width, this.height);
            (this.body as Phaser.Physics.Arcade.Body).setCircle(
                circleRadius,
                (this.width - circleRadius * 2) * 0.5,
                (this.height - circleRadius * 2) * 0.5
            );
        }

        // Initialize movement properties
        this.speed = 0;
        this.maxSpeed = 300; // Base speed
        this.initialDelay = 0;
        this.elapsedTime = 0;
        this.direction = new Phaser.Math.Vector2(0, 0);
    }

    setDamage(damage: number): void {
        console.log('Arrow setDamage called with:', damage); // Debug log
        this.damage = damage;
    }

    getDamage(): number {
        return this.damage;
    }

    fire(targetX: number, targetY: number): void {
        // Set the direction vector toward the target
        this.direction = new Phaser.Math.Vector2(targetX - this.x, targetY - this.y).normalize();
        // Set rotation to face the target
        this.rotation = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        // Immediately set to max speed
        this.speed = this.maxSpeed;
    }

    update(time: number, delta: number) {
        this.elapsedTime += delta;

        if (this.elapsedTime < this.initialDelay) {
            return;
        }

        // Apply velocity in the direction
        if (this.body && 'setVelocity' in this.body) {
            (this.body as Phaser.Physics.Arcade.Body).setVelocity(
                this.direction.x * this.speed,
                this.direction.y * this.speed
            );
        }
    }
}
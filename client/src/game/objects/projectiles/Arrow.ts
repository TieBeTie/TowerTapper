import Phaser from 'phaser';
import { Projectile } from './Projectile';
import { SkillType } from '../../types/SkillType';
import { SkillStateManager } from '../../managers/SkillStateManager';
import { ScreenManager } from '../../managers/ScreenManager';

export class Arrow extends Projectile {
    // Константы класса
    static readonly ARROW_SCALE = 0.2; // Масштаб стрелы
    private static readonly BASE_ARROW_SPEED = 300; // Базовая скорость стрелы

    private speed: number;
    private maxSpeed: number;
    private initialDelay: number;
    private elapsedTime: number;
    private direction: Phaser.Math.Vector2;
    private damage: number = 0;
    private skillManager: SkillStateManager;
    private speedMultiplier: number;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        this.skillManager = SkillStateManager.getInstance();
        this.damage = this.skillManager.getState(SkillType.DAMAGE) || 0;

        // Определяем масштаб игры, чтобы адаптировать размеры под экран
        let gameScale = 1;
        const gs: any = scene.scene.get('GameScene');
        if (gs && gs.screenManager) {
            gameScale = gs.screenManager.getGameScale();
        } else {
            // Фоллбэк: приближенная формула из ScreenManager
            const { width, height } = scene.scale;
            const baseScale = Math.min(width / 600, height / 1000);
            gameScale = baseScale * (height > width ? 1.2 : 1.5);
        }

        // Масштаб стрелы с учётом экрана
        this.setScale(Arrow.ARROW_SCALE * gameScale);

        // Устанавливаем хитбокс пропорционально масштабу
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
        this.maxSpeed = Arrow.BASE_ARROW_SPEED; // Используем константу вместо жесткого значения
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
        this.speedMultiplier = speedMultiplier;
        // Set the direction vector toward the target
        this.direction = new Phaser.Math.Vector2(targetX - this.x, targetY - this.y).normalize();
        // Set rotation to face the target
        this.rotation = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        // Immediately set to max speed with multiplier
        // speedMultiplier combines both game speed and attack speed from ProjectileManager
        this.speed = this.maxSpeed * this.speedMultiplier;
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
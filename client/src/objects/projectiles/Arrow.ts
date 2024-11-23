import Phaser from 'phaser';
import { Projectile } from './Projectile';

export class Arrow extends Projectile {
    targetX: number;
    targetY: number;
    private speed: number;
    private maxSpeed: number;
    private acceleration: number;
    private deceleration: number;
    private initialDelay: number; // в миллисекундах
    private elapsedTime: number;
    private direction: Phaser.Math.Vector2;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        this.targetX = -10000;
        this.targetY = -10000;

        // Инициализация свойств движения
        this.speed = 0;
        this.maxSpeed = 1500; // Максимальная скорость (пикселей/с)
        this.acceleration = 10000; // Ускорение (пикселей/с²)
        this.deceleration = 5000; // Замедление (пикселей/с²)
        this.initialDelay = 25; // Задержка перед началом движения (мс)
        this.elapsedTime = 0;
        this.direction = new Phaser.Math.Vector2(0, 0);
    }

    fire(targetX: number, targetY: number): void {
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = 0;
        this.elapsedTime = 0;

        // Вычисление направления движения
        this.direction = new Phaser.Math.Vector2(targetX - this.x, targetY - this.y).normalize();
    }

    update(time: number, delta: number) {
        // Обновление прошедшего времени
        this.elapsedTime += delta;

        if (this.elapsedTime < this.initialDelay) {
            // Внутри задержки: стрела неподвижна
            return;
        }

        // Вычисление текущего расстояния до цели
        const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);

        // Определение расстояния, на котором начнется замедление
        const decelerationDistance = 100;

        if (distanceToTarget <= decelerationDistance) {
            // Замедление
            this.speed -= this.deceleration * (delta / 1000);
            if (this.speed < 0) this.speed = 0;
        } else {
            // Ускорение
            this.speed += this.acceleration * (delta / 1000);
            if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
        }

        // Обновление позиции стрелы на основе текущей скорости и направления
        if (this.body && 'setVelocity' in this.body) {
            (this.body as Phaser.Physics.Arcade.Body).setVelocity(this.direction.x * this.speed, this.direction.y * this.speed);
        }

        // Обновление вращения стрелы
        if (this.speed > 0) {
            this.rotation = Phaser.Math.Angle.Between(this.x, this.y, this.targetX, this.targetY);
        }

        // Проверка попадания в цель
        const hitRadius = 10;
        if (distanceToTarget <= hitRadius) {
            this.destroy();
        }

        // Дополнительная проверка на превышение целевой позиции
        if (this.speed === 0 && distanceToTarget > hitRadius) {
            this.destroy();
        }
    }
}
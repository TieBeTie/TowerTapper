import Phaser from 'phaser';
import { ProjectileFactory } from '../../factories/ProjectileFactory';
import CoinManager from '../../managers/CoinCollectionEffectFromEnemyManager';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    speed: number;
    health: number;
    maxHealth: number;
    cost: number;
    tower: Phaser.Physics.Arcade.Sprite;
    projectileFactory: ProjectileFactory;
    isDying: boolean;
    isUnderAttack: boolean = false;
    baseHealth: number = 100; // Базовое здоровье всех врагов

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, cost: number) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.speed = 100;
        this.health = this.baseHealth; // Устанавливаем базовое здоровье
        this.maxHealth = this.health; // Запоминаем максимальное здоровье
        this.cost = Number(cost);

        this.setScale(0.7);

        this.tower = scene.children.getByName('tower') as Phaser.Physics.Arcade.Sprite;

        this.projectileFactory = new ProjectileFactory(scene);

        this.setCollideWorldBounds(true);

        if (this.body) {
            this.body.setSize(this.width * 0.7, this.height * 0.7);
            this.body.setOffset(this.width, this.height);
        }

        this.anims.play('enemy_walk', true);

        this.isDying = false;
    }

    update(time: number, delta: number): void {
        this.scene.physics.moveToObject(this, this.tower, this.speed);
    }

    takeDamage(amount: number): void {
        this.health -= amount;
        
        // Показываем эффект получения урона (мигание)
        this.scene.tweens.add({
            targets: this,
            alpha: 0.7,
            duration: 100,
            yoyo: true,
            repeat: 1
        });
        
        if (this.health <= 0 && !this.isDying) {
            this.isDying = true;
            this.anims.play('enemy_die');

            const currentVelocity = this.body?.velocity?.clone() || new Phaser.Math.Vector2(0, 0);

            this.scene.tweens.add({
                targets: this,
                currentSpeed: this.speed,
                duration: 1000,
                ease: 'Power1',
                onComplete: () => {
                    this.emit('reached');
                    this.destroy();
                }
            });
        }
    }

    setHealth(value: number): void {
        this.health = value;
        this.maxHealth = value; // Обновляем максимальное здоровье
    }
}

export default Enemy;

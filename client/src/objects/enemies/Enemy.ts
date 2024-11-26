import Phaser from 'phaser';
import { ProjectileFactory } from '../../factories/ProjectileFactory';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    speed: number;
    health: number;
    cost: number;
    tower: Phaser.Physics.Arcade.Sprite;
    projectileFactory: ProjectileFactory;
    isDying: boolean;
    isUnderAttack: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, cost: number) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.speed = 100;
        this.health = 100;
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

    fireArrow(targetX: number, targetY: number): void {
        const arrow = this.projectileFactory.createArrow(targetX, targetY);
        this.scene.physics.add.existing(arrow);
        // Additional logic if needed
    }


}

export default Enemy;

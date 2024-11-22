import Phaser from 'phaser';
import { ProjectileFactory } from '../../factories/ProjectileFactory';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    speed: number;
    health: number;
    cost: number;
    tower: Phaser.Physics.Arcade.Sprite;
    projectileFactory: ProjectileFactory;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, cost: number) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.speed = 100;
        this.health = 100;
        this.cost = Number(cost); // Ensure cost is a number

        // Reference to the tower
        this.tower = scene.children.getByName('tower') as Phaser.Physics.Arcade.Sprite;

        // Initialize ProjectileFactory
        this.projectileFactory = new ProjectileFactory(scene);

        // Configure collisions
        this.setCollideWorldBounds(true);

        // Запуск анимации
        this.anims.play('enemy_walk', true);
    }

    update(time: number, delta: number): void {
        // Movement logic towards the tower
        this.scene.physics.moveToObject(this, this.tower, this.speed);
    }

    takeDamage(amount: number): void {
        console.log(`Enemy takes damage: ${amount}`);
        this.health -= amount;
        console.log(`Enemy health: ${this.health}`);
        if (this.health <= 0) {
            console.log('Playing death animation');
            this.anims.play('enemy_death');
            this.on('animationcomplete', () => {
                console.log('Animation complete, destroying enemy');
                this.destroy();
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

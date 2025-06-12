import Phaser from 'phaser';
import { Arrow } from '../objects/projectiles/Arrow';
import { Fireball } from '../objects/projectiles/Fireball';

export class ProjectileFactory {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    createArrow(x: number, y: number): Arrow {
        const arrow = new Arrow(this.scene, x, y, 'projectile');
        return arrow;
    }

    createFireball(x: number, y: number): Fireball {
        const fireball = new Fireball(this.scene, x, y);
        return fireball;
    }
}

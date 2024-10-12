import Phaser from 'phaser';
import { Arrow } from '../objects/projectiles/Arrow';

export class ProjectileFactory {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    createArrow(x: number, y: number, targetX: number, targetY: number): Arrow {
        const arrow = new Arrow(this.scene, x, y, 'arrowTexture');
        arrow.fire(targetX, targetY);
        return arrow;
    }
}
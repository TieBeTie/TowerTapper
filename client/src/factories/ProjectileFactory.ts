import Phaser from 'phaser';
import { Arrow } from '../objects/projectiles/Arrow';

export class ProjectileFactory {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    createArrow(x: number, y: number): Arrow {
        const arrow = new Arrow(this.scene, x, y, 'arrowTexture');
        return arrow;
    }
}

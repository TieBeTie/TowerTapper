import { Arrow } from './Arrow';
import Phaser from 'phaser';

export class Fireball extends Arrow {
    static readonly FIREBALL_SCALE = 0.1;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'fireball');
        this.setScale(Fireball.FIREBALL_SCALE);
    }
} 
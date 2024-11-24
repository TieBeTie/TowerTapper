import Phaser from 'phaser';
import Enemy from './Enemy';

class OrcEnemy extends Enemy {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, cost: number = 200) {
        super(scene, x, y, texture, cost);
        this.speed = 100;
        this.health = 20; // Increased health
        // Additional initialization specific to Orc
    }

    update(time: number, delta: number): void {
        super.update(time, delta);
        // Additional behavior logic for Orc if needed
    }
}

export default OrcEnemy;
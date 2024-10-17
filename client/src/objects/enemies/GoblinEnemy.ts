import Phaser from 'phaser';
import Enemy from './Enemy';

class GoblinEnemy extends Enemy {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, cost: number = 100) {
        super(scene, x, y, texture, cost);
        this.speed = 400;
        this.health = 20; // Reduced health
        // Additional initialization specific to Goblin
    }

    update(time: number, delta: number): void {
        super.update(time, delta);
        // Additional behavior logic for Goblin if needed
    }

    // Override fire method if necessary
    attack(targetX: number, targetY: number): void {
        this.fireArrow(targetX, targetY);
    }
}

export default GoblinEnemy;
import Phaser from 'phaser';
import Enemy from './Enemy';

class GoblinEnemy extends Enemy {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, cost: number = 100) {
        super(scene, x, y, texture, cost);
        this.speed = 150;
        // Не переопределяем здоровье здесь, так как оно будет установлено WaveManager через setHealth
        // Additional initialization specific to Goblin
    }

    update(time: number, delta: number): void {
        super.update(time, delta);
        // Additional behavior logic for Goblin if needed
    }

}

export default GoblinEnemy;
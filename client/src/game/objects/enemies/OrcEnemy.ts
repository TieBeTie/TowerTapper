import Phaser from 'phaser';
import Enemy from './Enemy';

class OrcEnemy extends Enemy {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, cost: number = 200) {
        super(scene, x, y, texture, cost);
        // Скорость теперь устанавливается через WaveManager.getEnemySpeed() и метод setSpeed
        // Не переопределяем здоровье здесь, так как оно будет установлено WaveManager через setHealth
        // Additional initialization specific to Orc
    }

    update(time: number, delta: number): void {
        super.update(time, delta);
        // Additional behavior logic for Orc if needed
    }
}

export default OrcEnemy;
import Phaser from 'phaser';
import Enemy from './Enemy';

/**
 * Orby — базовый шарообразный враг. Конкретные характеристики
 * (скорость, здоровье, урон) задаёт EnemyFactory через методы set*().
 */
class Orby extends Enemy {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, cost: number) {
        super(scene, x, y, texture, cost);
    }
}

export default Orby; 
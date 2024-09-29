import Phaser from 'phaser';
import Enemy from './Enemy';

class GoblinEnemy extends Enemy {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        this.speed = 150;
        this.health = 80; // Меньший запас здоровья
        // Дополнительная инициализация специфичная для Гоблина
    }

    update(time, delta) {
        super.update(time, delta);
        // Дополнительная логика поведения Гоблина, если необходимо
    }
}

export default GoblinEnemy;
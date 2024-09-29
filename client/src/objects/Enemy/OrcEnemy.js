// client/src/objects/Enemy/OrcEnemy.js
import Phaser from 'phaser';
import Enemy from './Enemy';

class OrcEnemy extends Enemy {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        this.speed = 100;
        this.health = 150; // Увеличенный запас здоровья
        // Дополнительная инициализация специфичная для Орка
    }

    update(time, delta) {
        super.update(time, delta);
        // Дополнительная логика поведения Орка, если необходимо
    }
}

export default OrcEnemy;
// managers/TapManager.js
import Phaser from 'phaser';

class TapManager {
    constructor(scene) {
        this.scene = scene;
        this.coefficient = 1;

        // Настройка увеличения коэффициента тапания каждые 2 секунды
        this.scene.time.addEvent({
            delay: 2000,
            callback: this.increaseTapCoefficient,
            callbackScope: this,
            loop: true
        });

        // Обработка кликов для запуска снарядов
        this.scene.input.on(
            'pointerdown',
            this.handlePointerDown,
            this
        );
    }

    increaseTapCoefficient() {
        this.coefficient += 0.5;
        this.scene.uiManager.updateTapCoefficient(this.coefficient);
    }

    handlePointerDown(pointer, gameObjects) {
        // Проверка, был ли клик на UI элементе
        if (gameObjects.length === 0) {
            const nearestEnemy = this.scene.enemyManager.findNearestEnemy(this.scene.tower.x, this.scene.tower.y);
            this.scene.projectileManager.fireProjectile(this.scene.tower.x, this.scene.tower.y, nearestEnemy);
        }
    }

    // Добавьте метод destroy для очистки обработчика событий при необходимости
    destroy() {
        this.scene.input.off('pointerdown', this.handlePointerDown, this);
    }
}

export default TapManager;

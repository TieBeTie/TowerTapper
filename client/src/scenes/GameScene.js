// GameScene.js
import Phaser from 'phaser';
import Tower from '../objects/towers/Tower';
import UIManager from '../managers/UIManager';
import EnemyManager from '../managers/EnemyManager';
import ProjectileManager from '../managers/ProjectileManager';
import TapManager from '../managers/TapManager';
import CollisionManager from '../managers/CollisionManager';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        const { width, height } = this.scale;
        const panelHeight = 100;

        // Инициализация UIManager
        this.uiManager = new UIManager(this);

        // Инициализация монет
        this.coins = 0;

        // Инициализация замка
        this.tower = new Tower(this, width / 2, (height - panelHeight) / 2, 'tower');

        // Инициализация менеджеров
        this.enemyManager = new EnemyManager(this);
        this.projectileManager = new ProjectileManager(this);
        this.tapManager = new TapManager(this); // Теперь TapManager обрабатывает ввод
        this.collisionManager = new CollisionManager(this);
    }

    update(time, delta) {
        this.projectileManager.update(time, delta);
        this.enemyManager.update(time, delta);
        // Если TapManager не требует обновления, можно не вызывать его здесь
    }

    // Удалили метод обработки ввода, так как он перенесен в TapManager
}

export default GameScene;

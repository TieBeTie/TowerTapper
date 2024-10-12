import Phaser from 'phaser';
import Tower from '../objects/towers/Tower';
import UIManager from '../managers/UIManager';
import EnemyManager from '../managers/EnemyManager';
import ProjectileManager from '../managers/ProjectileManager';
import TapManager from '../managers/TapManager';
import CollisionManager from '../managers/CollisionManager';

class GameScene extends Phaser.Scene {
    tower!: Tower;
    uiManager!: UIManager;
    enemyManager!: EnemyManager;
    projectileManager!: ProjectileManager;
    tapManager!: TapManager;
    collisionManager!: CollisionManager;
    coins!: number;

    constructor() {
        super({ key: 'GameScene' });
    }

    create(): void {
        const { width, height } = this.scale;
        const panelHeight = 100;

        this.uiManager = new UIManager(this);
        this.coins = 0;
        this.tower = new Tower(this, width / 2, (height - panelHeight) / 2, 'tower');
        this.tower.setName('tower'); // Ensure the tower has the correct name
        this.enemyManager = new EnemyManager(this);
        this.projectileManager = new ProjectileManager(this);
        this.tapManager = new TapManager(this);
        this.collisionManager = new CollisionManager(this);
    }

    update(time: number, delta: number): void {
        this.projectileManager.update(time, delta);
        this.enemyManager.update(time, delta);
        // TapManager does not require update
    }
}

export default GameScene;

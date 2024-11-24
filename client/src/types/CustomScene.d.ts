import ProjectileManager from '../managers/ProjectileManager';
import EnemyManager from '../managers/EnemyManager';
import Coins from '../objects/Coins';
import UIManager from '../managers/UIManager';

declare module 'phaser' {
    interface Scene {
        projectileManager: ProjectileManager;
        enemyManager: EnemyManager;
        tower: Phaser.Physics.Arcade.Sprite;
        coins: Coins;
        uiManager: UIManager;
    }
}
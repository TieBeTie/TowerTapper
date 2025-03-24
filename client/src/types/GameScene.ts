import ProjectileManager from '../managers/ProjectileManager';
import EnemyManager from '../managers/EnemyManager';
import Tower from '../objects/towers/Tower';
import { UIManager } from '../managers/UIManager';

export interface IGameScene extends Phaser.Scene {
    projectileManager: ProjectileManager;
    enemyManager: EnemyManager;
    tower: Tower;
    uiManager: UIManager;
} 
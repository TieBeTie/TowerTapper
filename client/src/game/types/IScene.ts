import ProjectileManager from '../managers/ProjectileManager';
import EnemyManager from '../managers/EnemyManager';
import Tower from '../objects/towers/Tower';
import { UIManager } from '../managers/UIManager';
import { ScreenManager } from '../managers/ScreenManager';

export interface IScene extends Phaser.Scene {
    screenManager: ScreenManager;
    uiManager?: UIManager;
    preload(): void;
    create(): void;
    update(time: number, delta: number): void;
} 
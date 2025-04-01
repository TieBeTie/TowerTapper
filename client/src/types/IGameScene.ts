import { IScene } from './IScene';
import Tower from '../objects/towers/Tower';
import { UIManager } from '../managers/UIManager';
import EnemyManager from '../managers/EnemyManager';
import ProjectileManager from '../managers/ProjectileManager';
import CollisionManager from '../managers/CollisionManager';
import GoldManager from '../managers/GoldManager';
import { UpgradeManager } from '../managers/UpgradeManager';
import { WaveManager } from '../managers/WaveManager';
import { WaveIndicator } from '../ui/components/WaveIndicator';
import { WaveClearEffect } from '../ui/components/WaveClearEffect';
import AudioManager from '../managers/AudioManager';

export interface IGameScene extends IScene {
    // Game objects
    tower: Tower;
    uiManager: UIManager;
    upgradeManager: UpgradeManager;
    enemyManager: EnemyManager;
    projectileManager: ProjectileManager;
    collisionManager: CollisionManager;
    goldManager: GoldManager;
    waveManager: WaveManager;
    waveIndicator: WaveIndicator;
    waveClearEffect: WaveClearEffect;
    gold: number;
    audioManager: AudioManager;

    // Game-specific methods
    
}

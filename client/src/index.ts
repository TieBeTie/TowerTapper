import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import MenuScene from './scenes/MenuScene';
import PauseScene from './scenes/PauseScene';
import DeathScene from './scenes/DeathScene';
import UpgradeScene from './scenes/UpgradeScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game-container',
        width: 900,
        height: 1600
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 }
        }
    },
    scene: [BootScene, MenuScene, GameScene, PauseScene, DeathScene, UpgradeScene]
};

const game = new Phaser.Game(config);

import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import MenuScene from './scenes/MenuScene';
import UpgradeScene from './scenes/UpgradeScene';
import PauseScene from './scenes/PauseScene';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scene: [BootScene, MenuScene, GameScene, UpgradeScene, PauseScene]
};

const game = new Phaser.Game(config);

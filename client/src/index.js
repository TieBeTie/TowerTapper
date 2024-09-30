import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import MenuScene from './scenes/MenuScene';
import UpgradeScene from './scenes/UpgradeScene';
import PauseScene from './scenes/PauseScene';
import DeathScene from './scenes/DeathScene';

const config = {
    type: Phaser.AUTO,
    width: 480,
    height: 720,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH, // Центрирование игры
        parent: 'game-container', // Контейнер в HTML для канваса
        width: 480,
        height: 720
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scene: [BootScene, MenuScene, GameScene, UpgradeScene, PauseScene, DeathScene]
};

const game = new Phaser.Game(config);
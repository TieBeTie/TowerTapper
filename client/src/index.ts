import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import MenuScene from './scenes/MenuScene';
import PauseScene from './scenes/PauseScene';
import DeathScene from './scenes/DeathScene';
import { TelegramService } from './services/TelegramService';

// Инициализируем Telegram сервис
const telegramService = TelegramService.getInstance();

// Получаем размеры viewport
const viewportWidth = telegramService.getViewportWidth();
const viewportHeight = telegramService.getViewportHeight();

// Рассчитываем размеры игры с учетом соотношения сторон
const gameWidth = 900;
const gameHeight = 1600;
const scale = Math.min(viewportWidth / gameWidth, viewportHeight / gameHeight);

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game-container',
        width: gameWidth,
        height: gameHeight,
        min: {
            width: gameWidth * 0.5,
            height: gameHeight * 0.5
        },
        max: {
            width: gameWidth,
            height: gameHeight
        }
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 }
        }
    },
    scene: [BootScene, MenuScene, GameScene, PauseScene, DeathScene],
    backgroundColor: '#ffffff'
};

const game = new Phaser.Game(config);

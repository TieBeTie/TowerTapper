import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import { TelegramService } from './services/TelegramService';

// Инициализируем Telegram сервис
const telegramService = TelegramService.getInstance();

// Базовое соотношение сторон игры (9:16)
const ASPECT_RATIO = 9/16;

// Определяем размеры игры на основе Telegram Web App viewport
const viewportWidth = telegramService.getViewportWidth();
const viewportHeight = telegramService.getViewportHeight();

// Определяем размеры игры
let gameWidth, gameHeight;

if (viewportWidth / viewportHeight > ASPECT_RATIO) {
    // Широкий экран - подгоняем по высоте
    gameHeight = viewportHeight;
    gameWidth = viewportHeight * ASPECT_RATIO;
} else {
    // Узкий экран - подгоняем по ширине
    gameWidth = viewportWidth;
    gameHeight = viewportWidth / ASPECT_RATIO;
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,  // Используем RESIZE вместо FIT для Telegram Web App
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game-container',
        width: gameWidth,
        height: gameHeight,
        // Add more detailed resize handling
        resizeInterval: 200,  // Check for resize less frequently to reduce performance impact
        min: {
            width: 300,
            height: 400
        }
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 }
        }
    },
    scene: [BootScene, MenuScene, GameScene],
    backgroundColor: '#ffffff',
    // Add these flags to improve rendering
    render: {
        pixelArt: true,  // Sharper text and pixel rendering
        antialias: false,  // Disable antialiasing for crisp graphics
        roundPixels: true  // Fixes blurry graphics on certain devices
    }
};

const game = new Phaser.Game(config);

// Добавляем обработчик изменения размера viewport в Telegram
telegramService.onViewportChange(() => {
    const newWidth = telegramService.getViewportWidth();
    const newHeight = telegramService.getViewportHeight();
    
    // Обновляем размеры игры с сохранением соотношения сторон
    let newGameWidth, newGameHeight;
    
    if (newWidth / newHeight > ASPECT_RATIO) {
        newGameHeight = newHeight;
        newGameWidth = newHeight * ASPECT_RATIO;
    } else {
        newGameWidth = newWidth;
        newGameHeight = newWidth / ASPECT_RATIO;
    }
    
    game.scale.resize(newGameWidth, newGameHeight);
});

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
    // Modify render settings to be more iOS-friendly
    render: {
        pixelArt: false,  // Changed from true to false for iOS
        antialias: true,  // Changed from false to true for iOS
        roundPixels: false,  // Changed from true to false for iOS
        clearBeforeRender: true,  // Add explicit clear for iOS
        powerPreference: 'high-performance',  // Prioritize performance on iOS
        batchSize: 2048  // Increase batch size for better performance
    },
    // Add these to improve iOS performance
    loader: {
        maxParallelDownloads: 4,  // Limit parallel downloads on iOS
        crossOrigin: 'anonymous'
    },
    // Enable better error handling for debugging on iOS
    callbacks: {
        postBoot: function(game) {
            // Check if running on iOS
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            if (isIOS) {
                console.log('Game booted on iOS, enabling special handling');
                // Add global error handler
                window.addEventListener('error', (e) => {
                    console.error('Game error caught:', e.message);
                });
            }
        }
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

import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import InitialUpgradesShopScene from './scenes/InitialUpgradesShopScene';
import EmblemsShopScene from './scenes/EmblemsShopScene';
import { TelegramService } from './services/TelegramService';

// Инициализируем Telegram сервис
const telegramService = TelegramService.getInstance();

// Force Telegram WebApp to expand immediately to prevent shifting
if (telegramService.isTelegramWebApp()) {
    telegramService.expandWebApp();
}

// Добавляем задержку перед инициализацией игры для Telegram
const initGame = () => {
    // Определяем базовое разрешение для pixel art режима (9:16)
    const BASE_WIDTH = 512;
    const BASE_HEIGHT = 912; // Более высокое разрешение для лучшей детализации

    // Определяем размеры игры на основе Telegram Web App viewport
    const viewportWidth = telegramService.getViewportWidth();
    const viewportHeight = telegramService.getViewportHeight();

    // Определяем размеры игры
    let gameWidth, gameHeight;

    if (viewportWidth / viewportHeight > 16/9) {
        // Широкий экран - подгоняем по высоте
        gameHeight = viewportHeight;
        gameWidth = viewportHeight * 16/9;
    } else {
        // Узкий экран - подгоняем по ширине
        gameWidth = viewportWidth;
        gameHeight = viewportWidth * 9/16;
    }

    // Прикрепляем элемент контейнера к body для исправления позиционирования
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        // Добавляем фиксированное позиционирование для контейнера
        gameContainer.style.position = 'fixed';
        gameContainer.style.top = '0';
        gameContainer.style.left = '0';
        gameContainer.style.width = '100%';
        gameContainer.style.height = '100%';
        gameContainer.style.display = 'flex';
        gameContainer.style.justifyContent = 'center';
        gameContainer.style.alignItems = 'center';
        gameContainer.style.overflow = 'hidden';
    }

    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        scale: {
            mode: Phaser.Scale.RESIZE,  // Используем RESIZE для динамического изменения размера
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: 'game-container',
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
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
        scene: [BootScene, MenuScene, GameScene, InitialUpgradesShopScene, EmblemsShopScene],
        backgroundColor: '#ffffff',
        // Modify render settings for pixel art
        render: {
            pixelArt: true,  // Enable pixelArt for crisp pixel rendering
            antialias: false,  // Disable antialiasing for pixel art
            roundPixels: true,  // Enable roundPixels for crisp rendering
            clearBeforeRender: true,
            powerPreference: 'high-performance',
            batchSize: 2048
        },
        // Add these to improve iOS performance
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

    const gameInstance = new Phaser.Game(config);

    // Instead, set canvas properties directly after the game is created
    if (gameInstance.canvas) {
        // Set crisp rendering CSS properties for pixel art
        gameInstance.canvas.style.imageRendering = 'pixelated';
        gameInstance.canvas.style.imageRendering = 'crisp-edges';
        
        // Добавляем фиксированное позиционирование для canvas
        gameInstance.canvas.style.margin = 'auto';
        gameInstance.canvas.style.display = 'block';
    }

    // Добавляем обработчик изменения размера viewport в Telegram
    telegramService.onViewportChange(() => {
        const newWidth = telegramService.getViewportWidth();
        const newHeight = telegramService.getViewportHeight();
        
        // Обновляем размеры игры с сохранением соотношения сторон
        let newGameWidth, newGameHeight;
        
        if (newWidth / newHeight > 16/9) {
            newGameHeight = newHeight;
            newGameWidth = newHeight * 16/9;
        } else {
            newGameWidth = newWidth;
            newGameHeight = newWidth * 9/16;
        }
        
        // Целочисленное масштабирование для pixel art
        const scale = Math.max(1, Math.floor(newGameWidth / BASE_WIDTH));
        
        // Обновляем размер игры
        gameInstance.scale.resize(newGameWidth, newGameHeight);
        
        // Принудительно привязываем к пиксельной сетке для всех сцен
        gameInstance.scale.emit('pixel-art-resize', { width: newGameWidth, height: newGameHeight, scale: scale });
    });
    
    // Добавляем глобальный обработчик для всех сцен для обеспечения pixel art
    gameInstance.events.on('prestep', () => {
        // Убедимся, что все объекты привязаны к целым пикселям
        if (gameInstance.scene.scenes) {
            gameInstance.scene.scenes.forEach(scene => {
                if (scene.cameras && scene.cameras.main) {
                    // Принудительно выравниваем координаты камеры по целым пикселям
                    scene.cameras.main.scrollX = Math.round(scene.cameras.main.scrollX);
                    scene.cameras.main.scrollY = Math.round(scene.cameras.main.scrollY);
                }
            });
        }
    });
};

// Используем задержку для Telegram чтобы дать WebApp полностью инициализироваться
if (telegramService.isTelegramWebApp()) {
    // Предотвращаем прокрутку страницы
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    // Инициализируем игру с задержкой для Telegram WebApp
    window.addEventListener('load', () => {
        // Небольшая задержка для полной инициализации Telegram WebApp
        setTimeout(() => {
            initGame();
        }, 100);
    });
} else {
    // Для не-Telegram сред инициализируем сразу
    initGame();
}

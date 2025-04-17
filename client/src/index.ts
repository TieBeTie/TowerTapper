import Phaser from 'phaser';
import BootScene from './game/scenes/BootScene';
import MenuScene from './game/scenes/MenuScene';
import GameScene from './game/scenes/GameScene';
import InitialUpgradesShopScene from './game/scenes/InitialUpgradesShopScene';
import EmblemsShopScene from './game/scenes/EmblemsShopScene';
import BackgroundScene from './game/scenes/BackgroundScene';
import { TelegramService } from './game/services/TelegramService';
import { createApp } from 'vue';
import App from './App.vue';

// Инициализируем Telegram сервис
const telegramService = TelegramService.getInstance();

// Force Telegram WebApp to expand immediately to prevent shifting
if (telegramService.isTelegramWebApp()) {
    telegramService.expandWebApp();
}

// Добавляем задержку перед инициализацией игры для Telegram
const initGame = () => {
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
        scene: [BootScene, BackgroundScene, MenuScene, GameScene, InitialUpgradesShopScene, EmblemsShopScene],
        backgroundColor: '#ffffff',
        // Modify render settings to fix blurry text
        render: {
            pixelArt: true,  // Enable pixelArt to prevent anti-aliasing
            antialias: false,  // Disable antialiasing for sharper text
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
        // Set crisp rendering CSS properties
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
        
        if (newWidth / newHeight > ASPECT_RATIO) {
            newGameHeight = newHeight;
            newGameWidth = newHeight * ASPECT_RATIO;
        } else {
            newGameWidth = newWidth;
            newGameHeight = newWidth / ASPECT_RATIO;
        }
        
        gameInstance.scale.resize(newGameWidth, newGameHeight);
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

createApp(App).mount('#game-container');

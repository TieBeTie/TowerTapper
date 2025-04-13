import Phaser from 'phaser';
import { TelegramService } from '../services/TelegramService';

export class ScreenManager {
    private gameScale: number = 1;
    private scene: Phaser.Scene;
    private telegramService: TelegramService;
    private isDestroyed: boolean = false;
    private gameViewHeightRatio: number = 0.67;

    
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.telegramService = TelegramService.getInstance();
        this.calculateGameScale();
        this.setupResizeHandlers();
    }

    private calculateGameScale(): void {
        let width, height;
        
        // Используем размеры из Telegram Web App, если доступны
        if (this.telegramService.isTelegramWebApp()) {
            width = this.telegramService.getViewportWidth();
            height = this.telegramService.getViewportHeight();
        } else {
            // В противном случае используем размеры из Phaser
            const { width: sceneWidth, height: sceneHeight } = this.scene.scale;
            width = sceneWidth;
            height = sceneHeight;
        }
        
        // Базовый масштаб зависит от размера экрана
        // Используем процентное соотношение относительно базового разрешения
        // Увеличиваем масштаб для лучшей видимости
        const baseScale = Math.min(width / 600, height / 1000);
        
        // Применяем дополнительный коэффициент в зависимости от ориентации экрана
        const isMobile = height > width;
        
        // Используем больший коэффициент для всех устройств
        this.gameScale = baseScale * (isMobile ? 1.2 : 1.5);
    }

    private setupResizeHandlers(): void {
        // Обработчик для Phaser resize
        this.scene.scale.on('resize', this.handleResize, this);
        
        // Обработчик для Telegram viewportChanged
        if (this.telegramService.isTelegramWebApp()) {
            this.telegramService.onViewportChange(() => this.handleResize());
        }
    }

    private handleResize(): void {
        if (this.isDestroyed) return;
        
        // Recalculate game scale
        this.calculateGameScale();
        
        // Force a small delay to allow layout to update
        this.scene.time.delayedCall(50, () => {
            // Notify components about screen resize with the new scale
            this.scene.events.emit('screenResize', this.gameScale);
            
            // Force another update after a short delay to ensure all components have updated
            this.scene.time.delayedCall(100, () => {
                this.scene.events.emit('screenResize', this.gameScale);
                
                // Force visibility on all UI elements
                this.scene.events.emit('ui-force-visibility');
            });
        });
    }

    public getLargeFontSize(): number {
        return this.getResponsiveFontSize(32);
    }

    public getMediumFontSize(): number {
        return this.getResponsiveFontSize(28);
    }

    public getSmallFontSize(): number {
        return this.getResponsiveFontSize(24);
    }

    public getSmallestFontSize(): number {
        return this.getResponsiveFontSize(8);
    }

    /**
     * Возвращает текущий масштаб игры
     */
    public getGameScale(): number {
        return this.gameScale;
    }

    /**
     * Возвращает размеры экрана (ширина и высота)
     */
    public getScreenSize(): { width: number; height: number } {
        if (this.telegramService.isTelegramWebApp()) {
            return {
                width: this.telegramService.getViewportWidth(),
                height: this.telegramService.getViewportHeight()
            };
        }
        return this.scene.scale;
    }

    /**
     * Возвращает центр экрана
     */
    public getScreenCenter(): { x: number; y: number } {
        const { width, height } = this.getScreenSize();
        return { x: width / 2, y: height / 2 };
    }

    public getGameViewHeightRatio(): number {
        return this.gameViewHeightRatio;
    }

    /**
     * Возвращает центр игровой области (GameView)
     * Учитывает, что GameView занимает только часть экрана (67% от высоты)
     */
    public getGameViewCenter(): { x: number; y: number } {
        const { width, height } = this.getScreenSize();
        const gameViewHeight = height * this.gameViewHeightRatio;
        return { x: width / 2, y: gameViewHeight / 2 };
    }

    /**
     * Устанавливает фон игры с правильным масштабированием
     */
    public setupBackground(): void {
        // Проверяем, импортирован ли класс MysticalBackground
        const isMysticalBackgroundAvailable = () => {
            try {
                // Динамически импортируем MysticalBackground только при необходимости
                return import('../objects/backgrounds/MysticalBackground')
                    .then(module => {
                        const { MysticalBackground } = module;
                        // Создаем мистический фон
                        return new MysticalBackground(this.scene);
                    })
                    .catch(error => {
                        console.error('Failed to load MysticalBackground:', error);
                        return null;
                    });
            } catch (error) {
                console.error('Error trying to load MysticalBackground:', error);
                return Promise.resolve(null);
            }
        };

        // Асинхронно создаем мистический фон или используем обычный
        isMysticalBackgroundAvailable()
            .then(background => {
                if (background) {
                    // Успешно создали мистический фон
                    // Сохраняем ссылку в объекте сцены для дальнейшего использования
                    this.scene.data.set('mysticalBackground', background);
                } else {
                    // Если не удалось создать MysticalBackground, используем стандартный фон
                    this.setupDefaultBackground();
                }
            });
    }

    /**
     * Устанавливает стандартный фон (используется как запасной вариант)
     */
    private setupDefaultBackground(): void {
        const { width, height } = this.getScreenSize();
        const background = this.scene.add.image(width / 2, height / 2, 'background');
        background.setOrigin(0.5, 0.5);
        
        // Масштабируем фон, чтобы он покрывал весь экран с большим запасом
        const scaleX = (width * 1.5) / background.width;
        const scaleY = (height * 1.5) / background.height;
        const scale = Math.max(scaleX, scaleY);
        background.setScale(scale);
        background.setDepth(-3000);
    }

    /**
     * Создает прямоугольник для затемнения экрана
     */
    public createFadeOverlay(color: number = 0x000000, alpha: number = 0): Phaser.GameObjects.Rectangle {
        const { width, height } = this.getScreenSize();
        const fadeRect = this.scene.add.rectangle(0, 0, width, height, color, alpha);
        fadeRect.setOrigin(0);
        return fadeRect;
    }
    
    /**
     * Вычисляет относительный размер текста в зависимости от размера экрана
     * Использует целочисленные значения для избежания размытия
     */
    public getResponsiveFontSize(baseSize: number = 16): number {
        // Округляем до целого числа и обеспечиваем минимальный размер
        return Math.max(16, Math.round(baseSize * this.gameScale));
    }
    
    /**
     * Вычисляет относительный отступ в зависимости от размера экрана
     */
    public getResponsivePadding(basePadding: number = 10): number {
        // Просто умножаем на масштаб без дополнительных расчетов
        return Math.round(basePadding * this.gameScale);
    }
    
    /**
     * Проверяет, является ли текущее устройство мобильным
     */
    public isMobileDevice(): boolean {
        const { width, height } = this.getScreenSize();
        return height > width;
    }

    /**
     * Очищает все обработчики при уничтожении объекта
     */
    public destroy(): void {
        this.isDestroyed = true;
        this.scene.scale.removeListener('resize', this.handleResize, this);
        
        if (this.telegramService.isTelegramWebApp()) {
            this.telegramService.offViewportChange(() => this.handleResize());
        }
    }

    /**
     * Создает текст с настройками для четкого отображения
     */
    public createText(
        x: number, 
        y: number, 
        text: string, 
        fontSize: number = 16, 
        color: string = '#ffffff',
        options: any = {}
    ): Phaser.GameObjects.Text {
        // Объединяем базовые настройки с пользовательскими
        const textStyle = {
            fontSize: `${Math.max(16, Math.round(fontSize * this.gameScale))}px`,
            color: color,
            fontFamily: 'pixelFont',
            stroke: options.stroke || '#000000',
            strokeThickness: options.strokeThickness || Math.max(2, Math.round(3 * this.gameScale)),
            resolution: 3, // Увеличиваем разрешение для четкости
            align: options.align || 'center',
            padding: options.padding || { x: 1, y: 1 },
            ...options
        };
        
        // Создаем текст с правильным позиционированием
        const textObj = this.scene.add.text(
            Math.floor(x), // Используем floor вместо round для большей четкости
            Math.floor(y), 
            text, 
            textStyle
        );
        
        // Улучшаем четкость текста
        textObj.setResolution(3);
        
        // Устанавливаем origin, если указан
        if (options.origin !== undefined) {
            textObj.setOrigin(options.origin);
        } else {
            textObj.setOrigin(0.5);
        }
        
        return textObj;
    }
} 
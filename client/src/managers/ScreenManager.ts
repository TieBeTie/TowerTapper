import Phaser from 'phaser';
import { TelegramService } from '../services/TelegramService';

export class ScreenManager {
    private gameScale: number = 1;
    private scene: Phaser.Scene;
    private telegramService: TelegramService;
    private isDestroyed: boolean = false;

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
        
        this.calculateGameScale();
        // Оповещаем о необходимости обновления UI
        this.scene.events.emit('screenResize', this.gameScale);
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

    /**
     * Устанавливает фон игры с правильным масштабированием
     */
    public setupBackground(): void {
        const { width, height } = this.getScreenSize();
        const background = this.scene.add.image(width / 2, height / 2, 'background');
        background.setOrigin(0.5, 0.5);
        
        // Масштабируем фон, чтобы он покрывал весь экран
        const scaleX = width / background.width;
        const scaleY = height / background.height;
        const scale = Math.max(scaleX, scaleY);
        background.setScale(scale);
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
            resolution: 2, // Высокое разрешение для четкости
            align: options.align || 'center',
            padding: options.padding || { x: 1, y: 1 },
            ...options
        };
        
        // Создаем текст с правильным позиционированием
        const textObj = this.scene.add.text(
            Math.round(x), // Округляем до целых координат
            Math.round(y), 
            text, 
            textStyle
        );
        
        // Устанавливаем origin, если указан
        if (options.origin !== undefined) {
            textObj.setOrigin(options.origin);
        } else {
            textObj.setOrigin(0.5);
        }
        
        return textObj;
    }
} 
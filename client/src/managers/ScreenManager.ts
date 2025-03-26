import Phaser from 'phaser';

export class ScreenManager {
    private gameScale: number = 1;
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.calculateGameScale();
        this.setupResizeHandler();
    }

    private calculateGameScale(): void {
        const { width, height } = this.scene.scale;
        
        // Базовый масштаб зависит от размера экрана
        const baseScale = Math.min(width / 900, height / 1600);
        
        // Применяем дополнительный коэффициент для мобильных устройств
        const isMobile = height > width;
        this.gameScale = baseScale * (isMobile ? 0.7 : 0.85);
    }

    private setupResizeHandler(): void {
        this.scene.scale.on('resize', this.handleResize, this);
    }

    private handleResize(): void {
        this.calculateGameScale();
        // Оповещаем о необходимости обновления UI
        this.scene.events.emit('screenResize', this.gameScale);
    }

    public getGameScale(): number {
        return this.gameScale;
    }

    public getScreenSize(): { width: number; height: number } {
        return this.scene.scale;
    }

    public getScreenCenter(): { x: number; y: number } {
        const { width, height } = this.getScreenSize();
        return { x: width / 2, y: height / 2 };
    }

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

    public createFadeOverlay(color: number = 0x000000, alpha: number = 0): Phaser.GameObjects.Rectangle {
        const { width, height } = this.getScreenSize();
        const fadeRect = this.scene.add.rectangle(0, 0, width, height, color, alpha);
        fadeRect.setOrigin(0);
        return fadeRect;
    }

    public destroy(): void {
        this.scene.scale.removeListener('resize', this.handleResize, this);
    }
} 
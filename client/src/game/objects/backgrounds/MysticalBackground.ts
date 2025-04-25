import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';
import { SkyGradientLayer } from './components/SkyGradientLayer';
import { MainIslandLayer } from './components/MainIslandLayer';
import { FloatingIslandsLayer } from './components/FloatingIslandsLayer';
import { StarsLayer } from './components/StarsLayer';
import { PerimeterGlowLayer } from './components/PerimeterGlowLayer';
import { PlanetLayer } from './components/PlanetLayer';
import { CometLayer } from './components/CometLayer';

// === Интерфейс для слоев ===
export interface BackgroundLayer {
    create(): void;
    update?(): void;
    destroy(): void;
    handleResize?(): void;
}

export class MysticalBackground {
    private scene: Phaser.Scene;
    private screenManager: ScreenManager;
    private layers: BackgroundLayer[] = [];
    private isDestroyed: boolean = false;
    private glowLayer: PerimeterGlowLayer | null = null;
    
    // Add throttling for resize handling
    private lastResizeTime: number = 0;
    private readonly RESIZE_THROTTLE: number = 1000; // 1 second minimum between resizes

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.screenManager = new ScreenManager(scene);
        this.initialize();
    }

    private initialize(): void {
        this.layers = [
            new PlanetLayer(this.scene, this.screenManager),
            new SkyGradientLayer(this.scene, this.screenManager),
            new MainIslandLayer(this.scene, this.screenManager),
            new FloatingIslandsLayer(this.scene, this.screenManager),
            new StarsLayer(this.scene, this.screenManager),
            new CometLayer(this.scene, this.screenManager)
        ];
        this.layers.forEach(layer => layer.create());
        this.scene.events.on('screenResize', this.handleScreenResize, this);
    }

    private handleScreenResize(): void {
        // Apply throttling to prevent excessive resize handling
        const currentTime = Date.now();
        if (currentTime - this.lastResizeTime < this.RESIZE_THROTTLE) {
            return; // Skip this resize event if not enough time has passed
        }
        this.lastResizeTime = currentTime;
        
        this.layers.forEach(layer => layer.handleResize && layer.handleResize());
    }

    public showGlowLayer() {
        if (!this.glowLayer && this.scene.scene && this.scene.scene.key === 'GameScene') {
            this.glowLayer = new PerimeterGlowLayer(this.scene, this.screenManager);
            this.glowLayer.create();
        }
    }

    public hideGlowLayer() {
        if (this.glowLayer) {
            this.glowLayer.destroy();
            this.glowLayer = null;
        }
    }

    public destroy(): void {
        this.isDestroyed = true;
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        this.layers.forEach(layer => layer.destroy());
        this.layers = [];
        if (this.glowLayer) {
            this.glowLayer.destroy();
            this.glowLayer = null;
        }
    }

    public update(): void {
        this.layers.forEach(layer => layer.update && layer.update());
    }

    public setScene(scene: Phaser.Scene) {
        if (this.scene === scene) return;
        // Отключаем старый resize listener
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        // Обновляем scene и screenManager
        this.scene = scene;
        this.screenManager = new ScreenManager(scene);
        // Подключаем новый resize listener
        this.scene.events.on('screenResize', this.handleScreenResize, this);
        // GlowLayer пересоздавать не нужно, просто обновляем scene внутри слоёв если потребуется
    }
} 
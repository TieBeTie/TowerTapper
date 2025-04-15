import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';
import { SkyGradientLayer } from './components/SkyGradientLayer';
import { MainIslandLayer } from './components/MainIslandLayer';
import { FloatingIslandsLayer } from './components/FloatingIslandsLayer';
import { StarsLayer } from './components/StarsLayer';
import { PerimeterGlowLayer } from './components/PerimeterGlowLayer';
import { PlanetLayer } from './components/PlanetLayer';

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

    constructor(scene: Phaser.Scene) {
        console.log('[MysticalBackground] constructor', scene.scene.key);
        this.scene = scene;
        this.screenManager = new ScreenManager(scene);
        this.initialize();
    }

    private initialize(): void {
        console.log('[MysticalBackground] initialize', this.scene.scene.key);
        this.layers = [
            new PlanetLayer(this.scene, this.screenManager),
            new SkyGradientLayer(this.scene, this.screenManager),
            new MainIslandLayer(this.scene, this.screenManager),
            new FloatingIslandsLayer(this.scene, this.screenManager),
            new StarsLayer(this.scene, this.screenManager)
        ];
        this.layers.forEach(layer => layer.create());
        this.scene.events.on('screenResize', this.handleScreenResize, this);
    }

    private handleScreenResize(): void {
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
        console.log('[MysticalBackground] destroy called');
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
        // console.log('[MysticalBackground] update', this.scene.scene.key);
        this.layers.forEach(layer => layer.update && layer.update());
    }

    public setScene(scene: Phaser.Scene) {
        console.log('[MysticalBackground] setScene called', scene.scene.key);
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
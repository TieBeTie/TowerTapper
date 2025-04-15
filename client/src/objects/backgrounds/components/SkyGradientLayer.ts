import Phaser from 'phaser';
import { ScreenManager } from '../../../managers/ScreenManager';
import { BackgroundLayer } from '../MysticalBackground';

export class SkyGradientLayer implements BackgroundLayer {
    private scene: Phaser.Scene;
    private screenManager: ScreenManager;
    private skyLayer: Phaser.GameObjects.Image | null = null;
    private textureKey = 'skyGradient';

    constructor(scene: Phaser.Scene, screenManager: ScreenManager) {
        this.scene = scene;
        this.screenManager = screenManager;
    }

    create(): void {
        this.createSkyGradient();
    }

    destroy(): void {
        if (this.skyLayer) {
            this.skyLayer.destroy();
            this.skyLayer = null;
        }
        if (this.scene.textures.exists(this.textureKey)) {
            this.scene.textures.remove(this.textureKey);
        }
    }

    handleResize(): void {
        this.destroy();
        this.create();
    }

    private createSkyGradient(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const gradientTexture = this.createGradientTexture();
        this.skyLayer = this.scene.add.image(width / 2, height / 2, gradientTexture);
        this.skyLayer.setDisplaySize(width * 1.5, height * 1.5);
        this.skyLayer.setDepth(-3000);
        this.skyLayer.setScrollFactor(0);
        this.skyLayer.setName('mysticalBackground_sky');
    }

    private createGradientTexture(): string {
        if (this.scene.textures.exists(this.textureKey)) {
            return this.textureKey;
        }
        const width = 512;
        const height = 1024;
        const graphics = this.scene.add.graphics();
        const colorStops = [
            { stop: 0, color: 0x0a0a2a },
            { stop: 0.3, color: 0x1a1a4a },
            { stop: 0.6, color: 0x2a1a6a },
            { stop: 0.8, color: 0x3a1a7a },
            { stop: 1, color: 0x4a1a8a }
        ];
        graphics.fillStyle(colorStops[0].color, 1);
        graphics.fillRect(0, 0, width, height);
        for (let i = 0; i < colorStops.length - 1; i++) {
            const currentStop = colorStops[i];
            const nextStop = colorStops[i + 1];
            const startY = Math.floor(height * currentStop.stop);
            const endY = Math.floor(height * nextStop.stop);
            const steps = endY - startY;
            if (steps <= 0) continue;
            for (let j = 0; j < steps; j++) {
                const ratio = j / steps;
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(currentStop.color),
                    Phaser.Display.Color.ValueToColor(nextStop.color),
                    steps,
                    j
                );
                graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
                graphics.fillRect(0, startY + j, width, 1);
            }
        }
        graphics.generateTexture(this.textureKey, width, height);
        graphics.destroy();
        return this.textureKey;
    }
} 
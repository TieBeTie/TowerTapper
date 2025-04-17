import Phaser from 'phaser';
import { ScreenManager } from '../../../managers/ScreenManager';
import { BackgroundLayer } from '../MysticalBackground';

export class PerimeterGlowLayer implements BackgroundLayer {
    private scene: Phaser.Scene;
    private screenManager: ScreenManager;
    private perimeterGlow: Phaser.GameObjects.Graphics | null = null;

    constructor(scene: Phaser.Scene, screenManager: ScreenManager) {
        this.scene = scene;
        this.screenManager = screenManager;
    }

    create(): void {
        this.createPerimeterGlow();
    }

    destroy(): void {
        if (this.perimeterGlow) {
            this.perimeterGlow.destroy();
            this.perimeterGlow = null;
        }
    }

    handleResize(): void {
        this.destroy();
        this.create();
    }

    private createPerimeterGlow(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const gameViewHeight = height * this.screenManager.getGameViewHeightRatio();
        this.perimeterGlow = this.scene.add.graphics();
        this.perimeterGlow.setDepth(-2000);
        const glowColors = [
            { stop: 0, color: 0x9966ff, alpha: 0.25 },
            { stop: 0.7, color: 0x6633cc, alpha: 0.15 },
            { stop: 1, color: 0x000000, alpha: 0 }
        ];
        const lineWidth = Math.max(10, Math.round(width * 0.015));
        for (let i = 0; i < lineWidth; i++) {
            const ratio = i / lineWidth;
            const colorInfo = this.interpolateColors(glowColors, ratio);
            this.perimeterGlow.lineStyle(2, colorInfo.color, colorInfo.alpha);
            this.perimeterGlow.strokeRect(
                i, 
                i, 
                width - i * 2, 
                gameViewHeight - i * 2
            );
        }
        this.scene.tweens.add({
            targets: this.perimeterGlow,
            alpha: 0.6,
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    private interpolateColors(colors: Array<{stop: number, color: number, alpha: number}>, ratio: number): {color: number, alpha: number} {
        for (let i = 0; i < colors.length - 1; i++) {
            const currentStop = colors[i];
            const nextStop = colors[i + 1];
            if (ratio >= currentStop.stop && ratio <= nextStop.stop) {
                const localRatio = (ratio - currentStop.stop) / (nextStop.stop - currentStop.stop);
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(currentStop.color),
                    Phaser.Display.Color.ValueToColor(nextStop.color),
                    1,
                    localRatio
                );
                const colorValue = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
                const alpha = currentStop.alpha + (nextStop.alpha - currentStop.alpha) * localRatio;
                return { color: colorValue, alpha };
            }
        }
        const last = colors[colors.length - 1];
        return { color: last.color, alpha: last.alpha };
    }
} 
import Phaser from 'phaser';
import { ScreenManager } from '../../../managers/ScreenManager';
import { BackgroundLayer } from '../MysticalBackground';

export class StarsLayer implements BackgroundLayer {
    private scene: Phaser.Scene;
    private screenManager: ScreenManager;
    private stars: Phaser.GameObjects.Image[] = [];
    private textureKey = 'starParticle';

    constructor(scene: Phaser.Scene, screenManager: ScreenManager) {
        this.scene = scene;
        this.screenManager = screenManager;
    }

    create(): void {
        this.createStars();
    }

    destroy(): void {
        this.stars.forEach(star => star.destroy());
        this.stars = [];
        if (this.scene.textures.exists(this.textureKey)) {
            this.scene.textures.remove(this.textureKey);
        }
    }

    handleResize(): void {
        this.destroy();
        this.create();
    }

    private createStars(): void {
        const { width, height } = this.screenManager.getScreenSize();
        this.createStarTexture();
        const starCount = Math.floor(width * height / 10000);
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 0.1 + Math.random() * 0.5;
            const alpha = 0.2 + Math.random() * 0.6;
            const star = this.scene.add.image(x, y, this.textureKey);
            star.setScale(size);
            star.setAlpha(alpha);
            star.setDepth(-2900);
            this.scene.tweens.add({
                targets: star,
                alpha: alpha - 0.2,
                duration: 1000 + Math.random() * 2000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                delay: Math.random() * 1000
            });
            this.stars.push(star);
        }
    }

    private createStarTexture(): void {
        if (this.scene.textures.exists(this.textureKey)) {
            return;
        }
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xffffff);
        this.drawStar(graphics, 8, 8, 5, 8, 4);
        graphics.generateTexture(this.textureKey, 16, 16);
        graphics.destroy();
    }

    private drawStar(graphics: Phaser.GameObjects.Graphics, x: number, y: number, points: number, outerRadius: number, innerRadius: number): void {
        const rot = Math.PI / 2 * 3;
        const step = Math.PI / points;
        graphics.beginPath();
        graphics.moveTo(x, y - outerRadius);
        for (let i = 0; i < points; i++) {
            graphics.lineTo(
                x + Math.cos(rot + step * i) * outerRadius,
                y + Math.sin(rot + step * i) * outerRadius
            );
            graphics.lineTo(
                x + Math.cos(rot + step * i + step / 2) * innerRadius,
                y + Math.sin(rot + step * i + step / 2) * innerRadius
            );
        }
        graphics.lineTo(x, y - outerRadius);
        graphics.closePath();
        graphics.fillPath();
    }
} 
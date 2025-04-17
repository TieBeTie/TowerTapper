import Phaser from 'phaser';
import { ScreenManager } from '../../../managers/ScreenManager';
import { BackgroundLayer } from '../MysticalBackground';

export class PlanetLayer implements BackgroundLayer {
    private scene: Phaser.Scene;
    private screenManager: ScreenManager;
    private planet: Phaser.GameObjects.Image | null = null;
    private readonly textureKey = 'Earth';
    private rotationTween: Phaser.Tweens.Tween | null = null;
    private atmosphere: Phaser.GameObjects.Graphics | null = null;
    private rotationStepTimer: Phaser.Time.TimerEvent | null = null;
    // Сохраняем угол между сценами
    private static lastAngle: number = 0;
    private isLoading = false;

    constructor(scene: Phaser.Scene, screenManager: ScreenManager) {
        this.scene = scene;
        this.screenManager = screenManager;
    }

    create(): void {
        this.addPlanet();
    }

    destroy(): void {
        if (this.planet) {
            // Сохраняем угол перед уничтожением
            PlanetLayer.lastAngle = this.planet.angle;
            this.planet.destroy();
            this.planet = null;
        }
        if (this.atmosphere) {
            this.atmosphere.destroy();
            this.atmosphere = null;
        }
        if (this.rotationTween) {
            this.rotationTween.stop();
            this.rotationTween = null;
        }
        if (this.rotationStepTimer) {
            this.rotationStepTimer.remove(false);
            this.rotationStepTimer = null;
        }
        this.isLoading = false;
        this.scene.load.removeAllListeners('complete');
    }

    handleResize(): void {
        this.destroy();
        this.create();
    }

    private addPlanet(): void {
        const { width, height } = this.screenManager.getScreenSize();
        if (!this.scene.textures.exists(this.textureKey)) {
            if (!this.isLoading) {
                this.isLoading = true;
                this.scene.load.image(this.textureKey, 'assets/images/planet/Earth.png');
                this.scene.load.once('complete', () => {
                    this.isLoading = false;
                    this.addPlanet();
                });
                this.scene.load.start();
            }
            return;
        }
        const planetTexture = this.scene.textures.get(this.textureKey).getSourceImage() as HTMLImageElement;

        // Центр планеты сильно за пределами экрана (влево и вниз)

        const centerX = width / 2;
        // x^2 + b^2 = (x + a)^2
        // x^2 + b^2 = x^2 + 2ax + a^2
        // b^2 = 2ax + a^2
        // x = (b^2 - a^2) / 2a
        // x = b^2 / 2a - a / 2
        // a = (1 - ScreenManager.getGameViewHeightRatio()) * height --- UIHeight
        // b = width / 2 --- halfWidth
        // x = halfWidth^2 / 2 / UIHeight - UIHeight / 2
        // planetRadius = x + UIHeight
        

        const halfWidth = width / 2;
        const UIHeight = this.screenManager.getScreenSize().height * (1 - this.screenManager.getGameViewHeightRatio());
        const planetRadius = (halfWidth * halfWidth) / (2 * UIHeight) - UIHeight / 2 + UIHeight;
        const offsetY = planetRadius * 0.03;
        const centerY = height - UIHeight + planetRadius + offsetY;

        const scale = planetRadius / planetTexture.width;
        this.planet = this.scene.add.image(centerX, centerY, this.textureKey);
        this.planet.setOrigin(0.5, 0.5);
        this.planet.setScale(scale * 2);
        this.planet.setDepth(-10);
        this.planet.setAlpha(1);
        this.planet.setPipeline('TextureTintPipeline');
        // Восстанавливаем угол
        this.planet.angle = PlanetLayer.lastAngle || 0;

        // Атмосфера
        const atmosphereRadius = planetRadius * 1.03; // чуть больше радиуса планеты
        this.atmosphere = this.scene.add.graphics();
        this.atmosphere.setDepth(-9);
        this.atmosphere.setPosition(centerX, centerY);

        const gradientSteps = 32;
        for (let i = gradientSteps; i > 0; i--) {
            const t = i / gradientSteps;
            const r = planetRadius + (atmosphereRadius - planetRadius) * t;
            // Альфа затухает экспоненциально — у края почти 0
            const alpha = 0.08 * Math.pow(t, 2.5);
            this.atmosphere.fillStyle(0x66ccff, alpha);
            this.atmosphere.beginPath();
            this.atmosphere.arc(0, 0, r, 0, Math.PI * 2);
            this.atmosphere.closePath();
            this.atmosphere.fillPath();
        }

        // Можно убрать или сделать очень прозрачным outline:
        this.atmosphere.lineStyle(2, 0x66ccff, 0.06);
        this.atmosphere.beginPath();
        this.atmosphere.arc(0, 0, atmosphereRadius - 1, 0, Math.PI * 2);
        this.atmosphere.closePath();
        this.atmosphere.strokePath();

        // Пошаговое вращение планеты, атмосфера статична
        this.rotationStepTimer = this.scene.time.addEvent({
            delay: 500, // раз в 0.5 секунды
            loop: true,
            callback: () => {
                if (this.planet) {
                    this.planet.angle += 0.01;
                }
            }
        });
    }
} 
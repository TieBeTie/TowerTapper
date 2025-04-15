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
    }

    handleResize(): void {
        this.destroy();
        this.create();
    }

    private addPlanet(): void {
        const { width, height } = this.screenManager.getScreenSize();
        if (!this.scene.textures.exists(this.textureKey)) {
            this.scene.load.image(this.textureKey, 'assets/images/planet/Earth.png');
            this.scene.load.once('complete', () => {
                this.addPlanet();
            });
            this.scene.load.start();
            return;
        }
        const planetTexture = this.scene.textures.get(this.textureKey).getSourceImage() as HTMLImageElement;
        const planetOriginalWidth = planetTexture.width;
        const planetRadius = planetOriginalWidth / 2;

        // Масштаб: чтобы видимая дуга (четверть круга) была чуть шире экрана
        const desiredVisibleArc = width * 1.33; // чуть больше ширины экрана
        const scale = desiredVisibleArc / (planetRadius * Math.SQRT2);

        // Центр планеты сильно за пределами экрана (влево и вниз)
        const centerX = width / 2;
        const centerY = height + height / 4;

        this.planet = this.scene.add.image(centerX, centerY, this.textureKey);
        this.planet.setOrigin(0.5, 0.5);
        this.planet.setScale(scale);
        this.planet.setDepth(-10);
        this.planet.setAlpha(1);
        this.planet.setPipeline('TextureTintPipeline');
        // Восстанавливаем угол
        this.planet.angle = PlanetLayer.lastAngle || 0;

        // Атмосфера
        const atmosphereRadius = planetRadius * scale * 1.04; // на 4% больше
        this.atmosphere = this.scene.add.graphics();
        this.atmosphere.setDepth(-9); // чуть выше планеты
        this.atmosphere.setPosition(centerX, centerY);
        // Градиент атмосферы
        const gradientSteps = 32;
        for (let i = gradientSteps; i > 0; i--) {
            const r = atmosphereRadius * (i / gradientSteps);
            const alpha = 0.08 * (i / gradientSteps); // плавное затухание, менее ярко
            this.atmosphere.fillStyle(0x66ccff, alpha); // голубой
            this.atmosphere.beginPath();
            this.atmosphere.arc(0, 0, r, 0, Math.PI * 2);
            this.atmosphere.closePath();
            this.atmosphere.fillPath();
        }

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
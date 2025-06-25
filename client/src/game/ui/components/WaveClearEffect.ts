import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';
import Ellipse = Phaser.Geom.Ellipse;
import GameScene from '../../scenes/GameScene';
import PerlinNoise from '../../utils/PerlinNoise';

export class WaveClearEffect {
    private scene: Phaser.Scene;
    private tower: Phaser.GameObjects.Sprite;
    private screenManager: ScreenManager;

    constructor(scene: Phaser.Scene, tower: Phaser.GameObjects.Sprite, screenManager?: ScreenManager) {
        this.scene = scene;
        this.tower = tower;
        this.screenManager = screenManager || new ScreenManager(scene);
    }



    // Показать эффект "Wave Clear"
    public show(waveNumber: number): void {
        const gameScene = this.scene as GameScene;
        if (gameScene.audioManager) {
            gameScene.audioManager.playSound('single_firework_sound');
        }
        const gameScale = this.screenManager.getGameScale();

        // Разные размеры: хвост (тонкая вертикаль) и облако (сильнее видимое)
        const tailSize = Math.max(0.1, gameScale * 0.1);   // хвост
        const cloudSize = Math.max(0.2, gameScale * 0.2);   // облако

        // Стартовая позиция: точка верхнего центра башни
        const { x: startX, y: startY } = this.tower.getTopCenter();

        // Верх экрана (учитываем скролл) и безопасный отступ
        const { width, height } = this.screenManager.getScreenSize();
        const safeMargin = 30 * gameScale;

        let explosionY = startY - (height * 0.1);
        // Клап — не ниже головы башни и не выше безопасного отступа
        explosionY = Phaser.Math.Clamp(explosionY, 0 + safeMargin, startY - safeMargin);

        /*
         * 1) Ракета (взлет ~0.2 с)
         * Используем быстрый вертикальный поток частиц, создающий эффект хвоста.
         */
        // Гарантируем, что квадратная текстура создана заранее
        if (!this.scene.textures.exists('square_particle')) {
            const g = this.scene.add.graphics();
            g.fillStyle(0xffffff, 1);
            g.fillRect(0, 0, 6, 6);
            g.generateTexture('square_particle', 6, 6);
            g.destroy();
        }

        const rocketEmitter = this.scene.add.particles(startX, startY, 'particle', {
            frequency: -1, // manual emit mode
            lifespan: 600,
            speed: 0,
            scale: { start: tailSize * 1.4, end: 0 },
            blendMode: 'ADD',
            tint: 0xffffff,
            alpha: { start: 1, end: 0 },
            gravityY: 0
        });

        rocketEmitter.setDepth(8);

        // === Инкрементальный подъём с Перлин-шумом ===
        const steps = 40;
        const stepDelay = 20; // ms, итого ~800мс
        let currentX = startX;
        let currentY = startY;
        const deltaY = (startY - explosionY) / steps;
        let stepIndex = 0;

        const moveTimer = this.scene.time.addEvent({
            delay: stepDelay,
            repeat: steps - 1,
            callback: () => {
                // Шум для смещения X
                const noiseDelta = (PerlinNoise.noise(stepIndex * 0.2, waveNumber * 0.37) - 0.5) * 20 * gameScale;
                currentX += noiseDelta;
                currentY -= deltaY;

                rocketEmitter.setPosition(0, 0);

                // Излучаем одну частицу на текущей позиции
                rocketEmitter.emitParticleAt(currentX, currentY);

                stepIndex++;

                if (stepIndex >= steps) {
                    // Остановим эмиттер, но не уничтожаем, чтобы хвост был видим до конца жизни частиц
                    rocketEmitter.stop();

                    // === Взрыв в финальной точке ===
                    createExplosion(currentX, currentY);
                }
            }
        });

        // Функция создания облака-салюта
        const createExplosion = (explX: number, explY: number) => {
            const ellipseW = 150 * gameScale;
            const ellipseH = 85 * gameScale;
            const emitEllipse = new Ellipse(explX, explY, ellipseW, ellipseH);

            const explosionEmitter = this.scene.add.particles(0, 0, 'square_particle', {
                frequency: -1,
                lifespan: 1600,
                speed: { min: 20 * gameScale, max: 50 * gameScale },
                scale: { start: cloudSize, end: 0 },
                blendMode: 'ADD',
                tint: 0xffffff,
                gravityY: 100 * gameScale,
                alpha: { start: 0.9, end: 0 },
                emitZone: {
                    type: 'random',
                    source: {
                        getRandomPoint: (p: any) => {
                            Ellipse.Random(emitEllipse, p);
                            const noise = PerlinNoise.noise(p.x * 0.05, p.y * 0.05) - 0.5;
                            const offset = noise * 18 * gameScale;
                            p.x += offset;
                            p.y += offset;
                            return p;
                        }
                    }
                }
            });

            explosionEmitter.setDepth(12);
            explosionEmitter.emitParticle(40);

            // квадратная текстура уже создана ранее
        };
    }
} 
import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';
import Ellipse = Phaser.Geom.Ellipse;

// Простая реализация 2-D Perlin-шума (Ken Perlin, лицензия public domain)
class PerlinNoise {
    private static readonly perm: number[] = (() => {
        const base = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
            190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
            88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
            77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
            102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
            135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
            5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
            223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172,
            9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97,
            228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239,
            107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4,
            150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
        return [...base, ...base]; // дубликат для переполнения индекса
    })();

    private static fade(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10); }
    private static lerp(a: number, b: number, t: number): number { return a + t * (b - a); }
    private static grad(hash: number, x: number, y: number): number {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    /** Возвращает значение 0..1 */
    public static noise(x: number, y: number): number {
        const xi = Math.floor(x) & 255;
        const yi = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);

        const u = this.fade(xf);
        const v = this.fade(yf);

        const aa = this.perm[this.perm[xi] + yi];
        const ab = this.perm[this.perm[xi] + yi + 1];
        const ba = this.perm[this.perm[xi + 1] + yi];
        const bb = this.perm[this.perm[xi + 1] + yi + 1];

        const x1 = this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
        const x2 = this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);

        return (this.lerp(x1, x2, v) + 1) / 2; // 0..1
    }
}

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
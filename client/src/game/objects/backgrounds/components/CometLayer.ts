import Phaser from 'phaser';
import { ScreenManager } from '../../../managers/ScreenManager';
import { BackgroundLayer } from '../MysticalBackground';

interface Comet {
    sprite: Phaser.GameObjects.Graphics;
    x: number;
    y: number;
    vx: number;
    vy: number;
    tail: { x: number; y: number }[];
    tailLength: number;
    life: number;
    maxLife: number;
}

export class CometLayer implements BackgroundLayer {
    private scene: Phaser.Scene;
    private screenManager: ScreenManager;
    private comets: Comet[] = [];
    private cometTimer: Phaser.Time.TimerEvent | null = null;
    private isDestroyed = false;

    constructor(scene: Phaser.Scene, screenManager: ScreenManager) {
        this.scene = scene;
        this.screenManager = screenManager;
    }

    create(): void {
        this.isDestroyed = false;
        this.startCometSpawner();
    }

    destroy(): void {
        this.isDestroyed = true;
        this.comets.forEach(comet => comet.sprite.destroy());
        this.comets = [];
        if (this.cometTimer) {
            this.cometTimer.remove(false);
            this.cometTimer = null;
        }
    }

    handleResize(): void {
        this.destroy();
        this.create();
    }

    update(): void {
        this.updateComets();
    }

    private startCometSpawner() {
        this.cometTimer = this.scene.time.addEvent({
            delay: 20000 + Phaser.Math.Between(0, 60000), // 20 + random(0, 60) секунд
            callback: () => {
                if (!this.isDestroyed) {
                    this.spawnComet();
                    this.startCometSpawner();
                }
            },
            callbackScope: this,
            loop: false
        });
    }

    private spawnComet() {
        const { width, height } = this.screenManager.getScreenSize();
        // Случайная сторона появления (0=слева, 1=справа, 2=сверху, 3=снизу)
        const side = Phaser.Math.Between(0, 3);
        let x, y;
        if (side === 0) { // слева
            x = -50;
            y = Phaser.Math.Between(-50, height + 50);
        } else if (side === 1) { // справа
            x = width + 50;
            y = Phaser.Math.Between(-50, height + 50);
        } else if (side === 2) { // сверху
            x = Phaser.Math.Between(-50, width + 50);
            y = -50;
        } else { // снизу
            x = Phaser.Math.Between(-50, width + 50);
            y = height + 50;
        }
        // Случайный угол (всегда в сторону экрана)
        let angle;
        if (side === 0) angle = Phaser.Math.FloatBetween(-Math.PI / 3, Math.PI / 3); // справа
        else if (side === 1) angle = Phaser.Math.FloatBetween(2 * Math.PI / 3, 4 * Math.PI / 3); // влево
        else if (side === 2) angle = Phaser.Math.FloatBetween(Math.PI / 6, 5 * Math.PI / 6); // вниз
        else angle = Phaser.Math.FloatBetween(-5 * Math.PI / 6, -Math.PI / 6); // вверх
        const speed = Phaser.Math.Between(900, 1400) / 1000;
        const vx = Math.cos(angle) * speed * (width / 900);
        const vy = Math.sin(angle) * speed * (height / 600);
        const tailLength = Phaser.Math.Between(18, 28);
        const comet: Comet = {
            sprite: this.scene.add.graphics({ x: 0, y: 0 }).setDepth(-2800),
            x, y, vx, vy,
            tail: [],
            tailLength,
            life: 0,
            maxLife: Phaser.Math.Between(1200, 1800)
        };
        this.comets.push(comet);
    }

    private updateComets() {
        const { width, height } = this.screenManager.getScreenSize();
        for (let i = this.comets.length - 1; i >= 0; i--) {
            const comet = this.comets[i];
            comet.life += this.scene.game.loop.delta;
            // Обновляем позицию
            comet.x += comet.vx * this.scene.game.loop.delta;
            comet.y += comet.vy * this.scene.game.loop.delta;
            // Добавляем точку в хвост
            comet.tail.unshift({ x: comet.x, y: comet.y });
            if (comet.tail.length > comet.tailLength) comet.tail.pop();
            // Рисуем комету
            this.drawComet(comet);
            // Удаляем, если вышла за экран или прожила достаточно
            if (
                comet.x > width + 100 ||
                comet.y > height + 100 ||
                comet.life > comet.maxLife
            ) {
                comet.sprite.destroy();
                this.comets.splice(i, 1);
            }
        }
    }

    private drawComet(comet: Comet) {
        const g = comet.sprite;
        g.clear();
        // Хвост: градиентные эллипсы
        for (let i = comet.tail.length - 1; i > 0; i--) {
            const t = i / comet.tail.length;
            const alpha = 0.18 * (1 - t) + 0.04;
            const size = 18 * (1 - t) + 4;
            g.fillStyle(0x99ccff, alpha);
            g.fillEllipse(comet.tail[i].x, comet.tail[i].y, size * 1.8, size * 0.7);
        }
        // Голова кометы
        if (comet.tail.length > 0) {
            g.fillStyle(0xffffff, 0.95);
            g.fillEllipse(comet.tail[0].x, comet.tail[0].y, 18, 8);
            g.fillStyle(0x99ccff, 0.5);
            g.fillEllipse(comet.tail[0].x, comet.tail[0].y, 28, 12);
        }
    }
} 
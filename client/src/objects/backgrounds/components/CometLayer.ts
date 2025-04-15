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
            delay: Phaser.Math.Between(8000, 18000),
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
        // Стартовая точка: случайно сверху или слева
        let x, y, vx, vy;
        if (Math.random() > 0.5) {
            x = -50;
            y = Phaser.Math.Between(0, height * 0.7);
        } else {
            x = Phaser.Math.Between(0, width * 0.7);
            y = -50;
        }
        // Скорость: быстро по диагонали
        const speed = Phaser.Math.Between(900, 1400) / 1000; // px/ms
        const angle = Phaser.Math.DegToRad(Phaser.Math.Between(20, 60));
        vx = Math.cos(angle) * speed * (width / 900);
        vy = Math.sin(angle) * speed * (height / 600);
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
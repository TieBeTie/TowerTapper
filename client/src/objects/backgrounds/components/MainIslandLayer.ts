import Phaser from 'phaser';
import { ScreenManager } from '../../../managers/ScreenManager';
import { BackgroundLayer } from '../MysticalBackground';

export class MainIslandLayer implements BackgroundLayer {
    private scene: Phaser.Scene;
    private screenManager: ScreenManager;
    private mainIsland: Phaser.GameObjects.Image | null = null;
    private isDestroyed: boolean = false;
    private islandScale: number = 0.3;
    private mainIslandYOffset: number = 0.05;

    constructor(scene: Phaser.Scene, screenManager: ScreenManager) {
        this.scene = scene;
        this.screenManager = screenManager;
    }

    create(): void {
        this.createMainIsland();
    }

    destroy(): void {
        this.isDestroyed = true;
        if (this.mainIsland) {
            this.mainIsland.destroy();
            this.mainIsland = null;
        }
    }

    handleResize(): void {
        this.destroy();
        this.create();
    }

    private createMainIsland(): void {
        const center = this.screenManager.getGameViewCenter();
        if (!this.scene.textures.exists('mainIsland')) {
            this.scene.load.image('mainIsland', 'assets/images/islands/main_island.png');
            this.scene.load.once('complete', () => {
                this.addMainIslandToScene(center);
            });
            this.scene.load.start();
        } else {
            this.addMainIslandToScene(center);
        }
    }

    private addMainIslandToScene(center: { x: number; y: number }): void {
        const { height } = this.screenManager.getScreenSize();
        const gameViewHeight = height * this.screenManager.getGameViewHeightRatio();
        this.mainIsland = this.scene.add.image(center.x, center.y + this.mainIslandYOffset * gameViewHeight, 'mainIsland');
        const scale = this.islandScale * this.screenManager.getGameScale();
        this.mainIsland.setScale(scale);
        this.mainIsland.setDepth(-15);
        this.mainIsland.setName('mysticalBackground_mainIsland');
        this.addCrumblingEffect();
    }

    private addCrumblingEffect(): void {
        if (!this.mainIsland) return;
        const spawnCrumbleEffect = () => {
            if (!this.mainIsland || this.isDestroyed) return;
            const leftParticles = true;
            const rightParticles = true;
            if (leftParticles) {
                const randomLeftAngle = Math.PI * (0.5 + Math.random() * 0.5);
                createParticleGroup(randomLeftAngle, 0);
            }
            if (rightParticles) {
                const randomRightAngle = Math.PI * (1.0 + Math.random() * 1.5);
                createParticleGroup(randomRightAngle, 1);
            }
            if (Math.random() > 0.5) {
                const centerAngle = Math.PI;
                createParticleGroup(centerAngle, 2);
            }
            if (!this.isDestroyed) {
                this.scene.time.delayedCall(
                    3000 + Math.random() * 1000,
                    spawnCrumbleEffect
                );
            }
        };
        const createParticleGroup = (angle: number, side: number) => {
            if (!this.mainIsland) return;
            const radiusMultiplier = 1.1;
            const radiusX = this.mainIsland.width * this.mainIsland.scaleX * 0.4 * radiusMultiplier;
            const radiusY = this.mainIsland.height * this.mainIsland.scaleY * 0.4 * radiusMultiplier;
            const x = this.mainIsland.x + Math.cos(angle) * radiusX;
            const y = this.mainIsland.y + Math.sin(angle) * radiusY;
            if (y >= this.mainIsland.y) {
                createParticlesAtPosition(x, y, side);
            } else {
                const adjustedY = this.mainIsland.y + Math.abs(radiusY * 0.5);
                createParticlesAtPosition(x, adjustedY, side);
            }
        };
        const createParticlesAtPosition = (x: number, y: number, side: number) => {
            const particleCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < particleCount; i++) {
                const particle = this.scene.add.image(
                    x + (Math.random() * 4 - 2),
                    y + (Math.random() * 4),
                    'particle'
                );
                particle.setOrigin(0.5);
                particle.setScale(0.4 + Math.random() * 0.3);
                particle.setAlpha(0.5 + Math.random() * 0.3);
                particle.setDepth(-17);
                const colors = [0x7e5c42, 0x6d4c32, 0x594321];
                particle.setTint(colors[Math.floor(Math.random() * colors.length)]);
                let xVelocity = 0;
                if (side === 0) {
                    xVelocity = -5 - Math.random() * 10;
                } else if (side === 1) {
                    xVelocity = 5 + Math.random() * 10;
                } else {
                    xVelocity = Math.random() * 8 - 4;
                }
                this.scene.tweens.add({
                    targets: particle,
                    y: particle.y + 60 + Math.random() * 30,
                    x: particle.x + xVelocity,
                    alpha: 0,
                    scaleX: 0.2,
                    scaleY: 0.2,
                    duration: 2500 + Math.random() * 1000,
                    ease: 'Power2',
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            }
        };
        this.scene.time.delayedCall(500, spawnCrumbleEffect);
    }
} 
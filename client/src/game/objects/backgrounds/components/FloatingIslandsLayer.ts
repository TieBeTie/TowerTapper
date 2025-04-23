import Phaser from 'phaser';
import { ScreenManager } from '../../../managers/ScreenManager';
import { BackgroundLayer } from '../MysticalBackground';

export class FloatingIslandsLayer implements BackgroundLayer {
    private scene: Phaser.Scene;
    private screenManager: ScreenManager;
    private floatingIslands: Phaser.GameObjects.Image[] = [];
    private isLoading = false;

    constructor(scene: Phaser.Scene, screenManager: ScreenManager) {
        this.scene = scene;
        this.screenManager = screenManager;
    }

    create(): void {
        this.createFloatingIslands();
    }

    destroy(): void {
        this.floatingIslands.forEach(island => island.destroy());
        this.floatingIslands = [];
        this.isLoading = false;
        this.scene.load.removeAllListeners('complete');
    }

    handleResize(): void {
        this.destroy();
        this.create();
    }

    private createFloatingIslands(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const islandSpriteKeys = ['island1', 'island2', 'island3'];
        
        // Проверяем, загружены ли все текстуры
        let allTexturesLoaded = true;
        for (const key of islandSpriteKeys) {
            if (!this.scene.textures.exists(key)) {
                console.warn(`[FloatingIslandsLayer] Texture ${key} not found. Skipping island creation.`);
                allTexturesLoaded = false;
                // Продолжаем проверять другие текстуры вместо немедленного возврата
            }
        }
        
        // Если не все текстуры загружены, выходим без попытки загрузить их
        if (!allTexturesLoaded) {
            return;
        }
        
        this.floatingIslands.forEach(island => island.destroy());
        this.floatingIslands = [];
        const islandPositions = [
            { x: width * 0.2, y: height * 0.25, scale: 0.6, key: 'island1', alpha: 0.45, tint: 0xccccff, blur: 2 },
            { x: width * 0.85, y: height * 0.4, scale: 0.8, key: 'island2', alpha: 0.5, tint: 0xbbbbee, blur: 1.5 },
            { x: width * 0.1, y: height * 0.7, scale: 0.5, key: 'island3', alpha: 0.4, tint: 0xddddff, blur: 2.5 },
            { x: width * 0.75, y: height * 0.2, scale: 0.6, key: 'island2', alpha: 0.35, tint: 0xccccff, blur: 2 },
            { x: width * 0.6, y: height * 0.7, scale: 0.7, key: 'island1', alpha: 0.5, tint: 0xbbbbee, blur: 1.5 },
        ];
        islandPositions.forEach((position, index) => {
            const scale = (position.scale * this.screenManager.getGameScale()) / 5;
            const scaleNorm = Math.max(0.1, Math.min(0.18, scale));
            const farFactor = 1 - (scaleNorm - 0.1) / (0.18 - 0.1);
            const alpha = position.alpha * (0.7 + 0.6 * farFactor);
            const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(position.tint),
                Phaser.Display.Color.ValueToColor(0xffffff),
                1,
                farFactor
            );
            const tintValue = Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b);
            const blur = position.blur + 2 * farFactor;
            const maxAngle = 10 + 15 * farFactor;
            const angle = (Math.random() * 2 - 1) * maxAngle;
            const island = this.scene.add.image(position.x, position.y, position.key);
            island.setScale(scale);
            island.setDepth(-2500 + index * 5);
            island.setName(`mysticalBackground_island_${index}`);
            island.setAlpha(Math.min(1, alpha));
            island.setTint(tintValue);
            if ((island as any).setPipeline) {
                try {
                    (island as any).setPipeline('BlurPostFX');
                } catch {}
            }
            island.setAngle(angle);
            const baseY = island.y;
            const baseAngle = island.angle;
            this.scene.tweens.add({
                targets: island,
                y: { from: baseY, to: baseY - 10 },
                duration: 2500 + Math.random() * 800,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                delay: Math.random() * 1000
            });
            this.scene.tweens.add({
                targets: island,
                angle: { from: baseAngle, to: baseAngle + (Math.random() > 0.5 ? 1.2 : -1.2) },
                duration: 6000 + Math.random() * 2000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            this.floatingIslands.push(island);
        });
    }
} 
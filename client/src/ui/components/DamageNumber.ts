import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';

interface DamageNumberConfig {
    scene: Phaser.Scene;
    damage: number;
    x: number;
    y: number;
    screenManager?: ScreenManager;
}

export class DamageNumber extends Phaser.GameObjects.Container {
    private damageText!: Phaser.GameObjects.Text;
    private screenManager: ScreenManager;

    constructor(config: DamageNumberConfig) {
        super(config.scene, config.x, config.y);
        this.screenManager = config.screenManager || new ScreenManager(config.scene);
        this.createDamageText(config);
        this.scene.add.existing(this);
    }

    private createDamageText(config: DamageNumberConfig): void {
        // Get responsive sizing
        const fontSize = this.screenManager.getResponsiveFontSize(32);
        const gameScale = this.screenManager.getGameScale();
        const verticalOffset = this.screenManager.getResponsivePadding(30);
        const horizontalJitter = this.screenManager.getResponsivePadding(30);
        const shadowSize = Math.max(2, Math.round(3 * gameScale));
        const strokeSize = Math.max(2, Math.round(4 * gameScale));
        const riseDistance = this.screenManager.getResponsivePadding(50);
        
        // Создаем текст урона
        this.damageText = this.scene.add.text(0, -verticalOffset, config.damage.toString(), {
            fontSize: `${fontSize}px`,
            color: '#ff69b4',
            fontFamily: 'pixelFont',
            stroke: '#000000',
            strokeThickness: strokeSize,
            shadow: {
                offsetX: shadowSize,
                offsetY: shadowSize,
                color: '#000000',
                blur: shadowSize * 2
            }
        }).setOrigin(0.5);

        // Добавляем небольшой разброс по X для разных чисел
        this.damageText.x += (Math.random() - 0.5) * horizontalJitter;

        // Анимация появления
        this.scene.tweens.add({
            targets: this.damageText,
            scale: 1.2 * gameScale,
            duration: 100,
            ease: 'Power2',
            yoyo: true
        });

        // Анимация подъема и исчезновения
        this.scene.tweens.add({
            targets: this.damageText,
            y: -verticalOffset - riseDistance,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });

        this.add(this.damageText);
    }

    destroy(fromScene?: boolean): void {
        if (this.damageText) {
            this.damageText.destroy();
        }
        super.destroy(fromScene);
    }
} 
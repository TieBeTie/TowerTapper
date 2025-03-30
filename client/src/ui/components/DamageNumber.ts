import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';

interface DamageNumberConfig {
    scene: Phaser.Scene;
    damage: number;
    x: number;
    y: number;
    screenManager?: ScreenManager;
    isCritical?: boolean;
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
        const fontSize = this.screenManager.getResponsiveFontSize(this.screenManager.getSmallestFontSize());
        const gameScale = this.screenManager.getGameScale();
        const verticalOffset = this.screenManager.getResponsivePadding(30);
        const horizontalJitter = this.screenManager.getResponsivePadding(30);
        const shadowSize = Math.max(2, Math.round(3 * gameScale));
        const strokeSize = Math.max(2, Math.round(4 * gameScale));
        const riseDistance = this.screenManager.getResponsivePadding(50);
        
        // Determine display style based on critical hit status
        const textColor = config.isCritical ? '#ff69b4' : '#ffffff'; // Pink for critical hits (was red)
        const critFontSize = config.isCritical ? fontSize * 1.2 : fontSize; // 50% larger for critical hits
        const critStrokeSize = config.isCritical ? strokeSize * 1.2 : strokeSize; // Thicker outline
        
        // Add a prefix for critical hits
        const displayText = config.isCritical ? 
            `${config.damage}` : // Add exclamation marks for critical hits
            config.damage.toString();
        
        // Создаем текст урона
        this.damageText = this.scene.add.text(0, -verticalOffset, displayText, {
            fontSize: `${critFontSize}px`,
            color: textColor,
            fontFamily: 'pixelFont',
            stroke: '#000000',
            strokeThickness: critStrokeSize,
            resolution: 3, // Высокое разрешение для четкости
            shadow: {
                offsetX: shadowSize,
                offsetY: shadowSize,
                color: config.isCritical ? '#ff9ed8' : '#ffffff', // Light pink shadow for critical hits
                blur: shadowSize * 2
            }
        }).setOrigin(0.5);

        // Устанавливаем точные целочисленные координаты для четкости
        this.damageText.x = Math.floor(this.damageText.x + (Math.random() - 0.5) * horizontalJitter);
        this.damageText.y = Math.floor(this.damageText.y);

        // Анимация появления - more dramatic for critical hits
        this.scene.tweens.add({
            targets: this.damageText,
            scale: config.isCritical ? 1.2 * gameScale : 1.2 * gameScale,
            duration: config.isCritical ? 120 : 100,
            ease: 'Power2',
            yoyo: true
        });

        // Анимация подъема и исчезновения
        this.scene.tweens.add({
            targets: this.damageText,
            y: -verticalOffset - riseDistance,
            alpha: 0,
            duration: config.isCritical ? 1000 : 1000, // Critical hits stay visible longer
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
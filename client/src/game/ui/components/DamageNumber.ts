import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';

interface DamageNumberConfig {
    scene: Phaser.Scene;
    damage: number;
    x: number;
    y: number;
    screenManager?: ScreenManager;
    isCritical?: boolean;
    isHeal?: boolean;
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
        
        // Determine display style based on number type (heal or damage)
        let textColor, shadowColor, textPrefix, finalFontSize, finalStrokeSize;
        
        if (config.isHeal) {
            // Healing number style
            textColor = '#00ff00'; // Green for healing
            shadowColor = '#90ee90'; // Light green shadow
            textPrefix = '+'; // Add plus sign for healing
            finalFontSize = fontSize * 1.1; // Slightly larger for healing
            finalStrokeSize = strokeSize;
        } else if (config.isCritical) {
            // Critical hit style
            textColor = '#ff69b4'; // Pink for critical hits
            shadowColor = '#ff9ed8'; // Light pink shadow
            textPrefix = ''; 
            finalFontSize = fontSize * 1.2; // 20% larger for critical hits
            finalStrokeSize = strokeSize * 1.2; // Thicker outline
        } else {
            // Regular damage style
            textColor = '#ffffff'; // White for regular damage
            shadowColor = '#ffffff'; // White shadow
            textPrefix = '';
            finalFontSize = fontSize;
            finalStrokeSize = strokeSize;
        }
        
        // Create the display text with appropriate prefix
        const displayText = `${textPrefix}${config.damage}`;
        
        // Создаем текст урона
        this.damageText = this.scene.add.text(0, -verticalOffset, displayText, {
            fontSize: `${finalFontSize}px`,
            color: textColor,
            fontFamily: 'pixelFont',
            stroke: '#000000',
            strokeThickness: finalStrokeSize,
            resolution: 3, // Высокое разрешение для четкости
            shadow: {
                offsetX: shadowSize,
                offsetY: shadowSize,
                color: shadowColor,
                blur: shadowSize * 2
            }
        }).setOrigin(0.5);

        // Устанавливаем точные целочисленные координаты для четкости
        this.damageText.x = Math.floor(this.damageText.x + (Math.random() - 0.5) * horizontalJitter);
        this.damageText.y = Math.floor(this.damageText.y);

        // Different animation for different types
        if (config.isHeal) {
            // Healing animation - scale up and float up
            this.scene.tweens.add({
                targets: this.damageText,
                scale: 1.3 * gameScale,
                duration: 150,
                ease: 'Sine.easeOut',
                yoyo: true
            });
        } else {
            // Regular damage animation
            this.scene.tweens.add({
                targets: this.damageText,
                scale: config.isCritical ? 1.2 * gameScale : 1.2 * gameScale,
                duration: config.isCritical ? 120 : 100,
                ease: 'Power2',
                yoyo: true
            });
        }

        // Анимация подъема и исчезновения - healing floats up more gently
        this.scene.tweens.add({
            targets: this.damageText,
            y: -verticalOffset - riseDistance,
            alpha: 0,
            duration: config.isHeal ? 1200 : (config.isCritical ? 1000 : 1000),
            ease: config.isHeal ? 'Sine.easeOut' : 'Power2',
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
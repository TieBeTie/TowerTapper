import Phaser from 'phaser';

interface DamageNumberConfig {
    scene: Phaser.Scene;
    damage: number;
    x: number;
    y: number;
}

export class DamageNumber extends Phaser.GameObjects.Container {
    private damageText!: Phaser.GameObjects.Text;

    constructor(config: DamageNumberConfig) {
        super(config.scene, config.x, config.y);
        this.createDamageText(config);
        this.scene.add.existing(this);
    }

    private createDamageText(config: DamageNumberConfig): void {
        // Создаем текст урона
        this.damageText = this.scene.add.text(0, -30, config.damage.toString(), {
            fontSize: '32px',
            color: '#ff69b4',
            fontFamily: 'pixelFont',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000000',
                blur: 6
            }
        }).setOrigin(0.5);

        // Добавляем небольшой разброс по X для разных чисел
        this.damageText.x += (Math.random() - 0.5) * 30;

        // Анимация появления
        this.scene.tweens.add({
            targets: this.damageText,
            scale: 1.2,
            duration: 100,
            ease: 'Power2',
            yoyo: true
        });

        // Анимация подъема и исчезновения
        this.scene.tweens.add({
            targets: this.damageText,
            y: -80,
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
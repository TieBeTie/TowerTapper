import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';

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
        // Get responsive sizing
        const fontSize = this.screenManager.getResponsiveFontSize(56);
        const gameScale = this.screenManager.getGameScale();
        const verticalOffset = this.screenManager.getResponsivePadding(50);
        const shadowSize = Math.max(3, Math.round(5 * gameScale));
        
        // Создаем текст с улучшенным рендерингом
        const text = this.scene.add.text(
            this.tower.x,
            this.tower.y - this.tower.height / 2 - verticalOffset,
            `Wave ${waveNumber} Clear!`,
            {
                fontSize: `${fontSize}px`,
                color: '#ffff00',
                fontFamily: 'pixelFont',
                stroke: '#000000',
                strokeThickness: Math.max(2, Math.round(5 * gameScale)),
                // Улучшаем качество отображения
                resolution: 2, // Увеличиваем разрешение текста
                align: 'center',
                padding: { x: 1, y: 1 } // Небольшой паддинг для четкости
            }
        ).setOrigin(0.5);
        
        // Добавляем тень для эффекта
        text.setShadow(shadowSize, shadowSize, '#111111', shadowSize, true, true);
        
        // Calculate animation distances based on screen size
        const moveUpDistance = this.screenManager.getResponsivePadding(30);
        
        // Анимация появления
        this.scene.tweens.add({
            targets: text,
            y: text.y - moveUpDistance, // Движение вверх
            alpha: { from: 0, to: 1 },
            scale: { from: 0.8, to: 1.2 * gameScale },
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Анимация мерцания
                this.scene.tweens.add({
                    targets: text,
                    scale: 1.0 * gameScale,
                    alpha: 0.8,
                    duration: 1000,
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => {
                        // Анимация исчезновения
                        this.scene.tweens.add({
                            targets: text,
                            y: text.y - moveUpDistance * 0.67,
                            alpha: 0,
                            scale: 1.5 * gameScale,
                            duration: 500,
                            ease: 'Back.easeIn',
                            onComplete: () => {
                                text.destroy();
                            }
                        });
                    }
                });
            }
        });
        
        // Calculate particle properties based on screen size
        const particleSize = gameScale * 0.5;
        const particleSpeed = {
            min: 100 * gameScale,
            max: 300 * gameScale
        };
        const particleLifespan = 2000;
        
        // Добавляем эффект частиц (конфетти)
        const particles = this.scene.add.particles(0, 0, 'particle', {
            x: this.tower.x,
            y: this.tower.y - this.tower.height / 2,
            speed: particleSpeed,
            angle: { min: 0, max: 360 },
            scale: { start: particleSize, end: 0 },
            lifespan: particleLifespan,
            quantity: 2,
            frequency: 100,
            gravityY: 300 * gameScale,
            tint: [ 0xffff00, 0xff0000, 0x00ff00, 0x0000ff, 0xff00ff ]
        });
        
        // Остановить эмиттер через 2 секунды
        this.scene.time.delayedCall(particleLifespan, () => {
            particles.stop();
            // Удалить эмиттер через 1 секунду после остановки
            this.scene.time.delayedCall(1000, () => {
                particles.destroy();
            });
        });
    }
} 
import Phaser from 'phaser';

export class WaveClearEffect {
    private scene: Phaser.Scene;
    private tower: Phaser.GameObjects.Sprite;
    
    constructor(scene: Phaser.Scene, tower: Phaser.GameObjects.Sprite) {
        this.scene = scene;
        this.tower = tower;
    }
    
    // Показать эффект "Wave Clear"
    public show(waveNumber: number): void {
        // Создаем текст
        const text = this.scene.add.text(
            this.tower.x,
            this.tower.y - this.tower.height / 2 - 50,
            `Wave ${waveNumber} Clear!`,
            {
                fontSize: '56px',
                color: '#ffff00',
                fontFamily: 'pixelFont',
                stroke: '#000000',
                strokeThickness: 5
            }
        ).setOrigin(0.5);
        
        // Добавляем тень для эффекта
        text.setShadow(3, 3, '#111111', 5, true, true);
        
        // Анимация появления
        this.scene.tweens.add({
            targets: text,
            y: text.y - 30, // Движение вверх
            alpha: { from: 0, to: 1 },
            scale: { from: 0.8, to: 1.2 },
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Анимация мерцания
                this.scene.tweens.add({
                    targets: text,
                    scale: 1.0,
                    alpha: 0.8,
                    duration: 1000,
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => {
                        // Анимация исчезновения
                        this.scene.tweens.add({
                            targets: text,
                            y: text.y - 20,
                            alpha: 0,
                            scale: 1.5,
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
        
        // Добавляем эффект частиц (конфетти)
        const particles = this.scene.add.particles(0, 0, 'particle', {
            x: this.tower.x,
            y: this.tower.y - this.tower.height / 2,
            speed: { min: 100, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 2000,
            quantity: 2,
            frequency: 100,
            gravityY: 300,
            tint: [ 0xffff00, 0xff0000, 0x00ff00, 0x0000ff, 0xff00ff ]
        });
        
        // Остановить эмиттер через 2 секунды
        this.scene.time.delayedCall(2000, () => {
            particles.stop();
            // Удалить эмиттер через 1 секунду после остановки
            this.scene.time.delayedCall(1000, () => {
                particles.destroy();
            });
        });
    }
} 
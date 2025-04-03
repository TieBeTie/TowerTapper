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
        
         
        // Calculate animation distances based on screen size
        const moveUpDistance = this.screenManager.getResponsivePadding(30);
        

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
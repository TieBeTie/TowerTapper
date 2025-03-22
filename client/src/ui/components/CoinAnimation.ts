import Phaser from 'phaser';

interface CoinAnimationConfig {
    scene: Phaser.Scene;
    startPosition: Phaser.Math.Vector2;
    endPosition: Phaser.Math.Vector2;
    duration?: number;
    onComplete?: () => void;
}

export class CoinAnimation extends Phaser.GameObjects.Container {
    private sprite!: Phaser.GameObjects.Sprite;
    private startPosition: Phaser.Math.Vector2;
    private endPosition: Phaser.Math.Vector2;
    private duration: number;
    private onComplete?: () => void;

    constructor(config: CoinAnimationConfig) {
        super(config.scene, config.startPosition.x, config.startPosition.y);
        this.startPosition = config.startPosition;
        this.endPosition = config.endPosition;
        this.duration = config.duration || 1000;
        this.onComplete = config.onComplete;
        this.init();
    }

    private init(): void {
        // Create coin sprite
        this.sprite = this.scene.add.sprite(0, 0, 'coin');
        this.sprite.setScale(0.6);
        this.add(this.sprite);

        // Play spin animation if it exists
        if (this.scene.anims.exists('coin_spin')) {
            this.sprite.play('coin_spin');
        }

        // Create movement animation
        this.scene.tweens.add({
            targets: this,
            x: this.endPosition.x,
            y: this.endPosition.y,
            duration: 800,
            ease: 'Power1',
            onComplete: () => {
                if (this.onComplete) {
                    this.onComplete();
                }
                this.destroy();
            }
        });

        // Add scale animation
        this.scene.tweens.add({
            targets: this.sprite,
            scale: 0.3,
            duration: 800,
            ease: 'Power1'
        });
    }

    destroy(fromScene?: boolean): void {
        if (this.sprite) {
            this.sprite.destroy();
        }
        super.destroy(fromScene);
    }

    // Static factory methods for common animations
    static createCollectAnimation(
        scene: Phaser.Scene,
        startPosition: Phaser.Math.Vector2,
        endPosition: Phaser.Math.Vector2,
        onComplete?: () => void
    ): CoinAnimation {
        return new CoinAnimation({
            scene,
            startPosition,
            endPosition,
            duration: 1000,
            onComplete
        });
    }

    static createSpawnAnimation(
        scene: Phaser.Scene,
        position: Phaser.Math.Vector2,
        onComplete?: () => void
    ): CoinAnimation {
        return new CoinAnimation({
            scene,
            startPosition: position.clone().add(new Phaser.Math.Vector2(0, 50)),
            endPosition: position,
            duration: 500,
            onComplete
        });
    }
} 
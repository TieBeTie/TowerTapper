import Phaser from 'phaser';

interface CoinOptions {
    scene: Phaser.Scene;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
}

class Coin extends Phaser.GameObjects.Sprite {
    private targetX: number;
    private targetY: number;
    scene: Phaser.Scene;

    constructor(options: CoinOptions) {
        const { scene, x, y, targetX, targetY } = options;
        super(scene, x, y, 'coin');
        this.scene = scene;
        this.targetX = targetX;
        this.targetY = targetY;
        scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
        scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);

        this.play('coin_spin');
        this.startMovement();
    }

    private startMovement() {
        const duration = 1000;

        this.scene.tweens.add({
            targets: this,
            x: this.targetX,
            y: this.targetY,
            duration: duration,
            ease: 'Power1',
            onComplete: () => {
                this.emit('reached');
                this.destroy();
            }
        });
    }
}

export default Coin;

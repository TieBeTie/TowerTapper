import Phaser from 'phaser';

export abstract class Projectile extends Phaser.GameObjects.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
    }

    abstract fire(targetX: number, targetY: number): void;
    abstract update(time: number, delta: number): void;
}

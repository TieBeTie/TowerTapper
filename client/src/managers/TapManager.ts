import Phaser from 'phaser';

class TapManager {
    scene: Phaser.Scene;
    tapCoefficient: number;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.tapCoefficient = 1.0;

        this.scene.input.on('pointerdown', this.handleTap, this);
    }

    handleTap(pointer: Phaser.Input.Pointer): void {
        // Implement tap logic, e.g., increment coins based on tapCoefficient
        (this.scene as any).coins += 10 * this.tapCoefficient;
        (this.scene as any).uiManager.updateCoins((this.scene as any).coins);
    }

    upgradeTapCoefficient(amount: number): void {
        this.tapCoefficient += amount;
        (this.scene as any).uiManager.updateTapCoefficient(this.tapCoefficient);
    }

    destroy(): void {
        this.scene.input.off('pointerdown', this.handleTap, this);
    }
}

export default TapManager;
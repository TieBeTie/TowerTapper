import Phaser from 'phaser';
import ProjectileManager from './ProjectileManager';
import CoinManager from './CoinManager';
import UIManager from './UIManager';

class TapManager {
    scene: Phaser.Scene;
    projectileManager: ProjectileManager;
    coinManager: CoinManager;
    tapCoefficient: number;
    private firstTapTime: number | null = null;

    constructor(scene: Phaser.Scene, projectileManager: ProjectileManager, uiManager: UIManager, coinManager: CoinManager) {
        this.scene = scene;
        this.projectileManager = projectileManager;
        this.coinManager = coinManager;
        this.tapCoefficient = 1.0;
        this.firstTapTime = null;

        this.scene.input.on('pointerdown', this.handleTap, this);
    }

    handleTap(pointer: Phaser.Input.Pointer): void {
        this.projectileManager.fireProjectile();
        this.updateTapCoefficient();
    }

    private updateTapCoefficient(): void {
        const currentTime = Date.now();
        const timeDiff = currentTime - this.coinManager.getLastTapTime();

        if (timeDiff > 500) {
            this.tapCoefficient = 1.0;
            this.firstTapTime = currentTime;
        } else {
            if (!this.firstTapTime) {
                this.firstTapTime = this.coinManager.getLastTapTime(); 
            }
            const elapsedTime = currentTime - this.firstTapTime;
            this.tapCoefficient = Math.sqrt(elapsedTime / 1000);
            this.tapCoefficient = Math.max(Math.round(this.tapCoefficient * 10) / 10, 1.0);
        }

        this.coinManager.setLastTapTime(currentTime);
        this.coinManager.getUIManager().updateTapCoefficient(this.tapCoefficient);
        this.coinManager.setTapCoefficient(this.tapCoefficient);
    }

    destroy(): void {
        this.scene.input.off('pointerdown', this.handleTap, this);
    }
}

export default TapManager;
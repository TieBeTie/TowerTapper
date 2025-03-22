import Phaser from 'phaser';
import ProjectileManager from './ProjectileManager';
import CoinManager from './CoinCollectionEffectFromEnemyManager';
import UIManager from './UIManager';

class TapManager {
    scene: Phaser.Scene;
    projectileManager: ProjectileManager;
    coinManager: CoinManager;
    tapCoefficient: number;
    private firstTapTime: number | null = null;
    private isHolding: boolean = false;
    private holdStartTime: number = 0;
    private readonly MAX_SPEED_MULTIPLIER = 2.5;
    private readonly MIN_HOLD_TIME = 100; // ms

    constructor(scene: Phaser.Scene, projectileManager: ProjectileManager, uiManager: UIManager, coinManager: CoinManager) {
        this.scene = scene;
        this.projectileManager = projectileManager;
        this.coinManager = coinManager;
        this.tapCoefficient = 1.0;
        this.firstTapTime = null;

        this.scene.input.on('pointerdown', this.handlePointerDown, this);
        this.scene.input.on('pointerup', this.handlePointerUp, this);
    }

    private handlePointerDown(pointer: Phaser.Input.Pointer): void {
        this.isHolding = true;
        this.holdStartTime = Date.now();
    }

    private handlePointerUp(pointer: Phaser.Input.Pointer): void {
        if (!this.isHolding) return;

        const holdDuration = Date.now() - this.holdStartTime;
        const speedMultiplier = this.calculateSpeedMultiplier(holdDuration);

        this.projectileManager.fireProjectile(speedMultiplier);
        this.updateTapCoefficient();

        this.isHolding = false;
    }

    private calculateSpeedMultiplier(holdDuration: number): number {
        if (holdDuration < this.MIN_HOLD_TIME) return 1;

        const multiplier = 1 + (holdDuration / 1000); // Increase multiplier based on hold duration
        return Math.min(multiplier, this.MAX_SPEED_MULTIPLIER);
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
        this.scene.input.off('pointerdown', this.handlePointerDown, this);
        this.scene.input.off('pointerup', this.handlePointerUp, this);
    }
}

export default TapManager;
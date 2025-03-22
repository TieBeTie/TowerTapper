import Phaser from 'phaser';
import { UIManager } from './UIManager';
import { CoinAnimation } from '../ui/components/CoinAnimation';

class CoinManager {
    private coins: CoinAnimation[] = [];
    private tapCoefficient: number = 1.0;
    private lastTapTime: number = Date.now();
    private uiManager: UIManager;
    private scene: Phaser.Scene;
    private coins_count: number = 0;

    constructor(scene: Phaser.Scene, uiManager: UIManager) {
        this.uiManager = uiManager;
        this.scene = scene;
    }

    spawnCoin(position: Phaser.Math.Vector2, target: Phaser.GameObjects.Sprite) {
        const coin = CoinAnimation.createCollectAnimation(
            this.scene,
            position,
            new Phaser.Math.Vector2(target.x, target.y),
            () => {
                this.coins_count += this.tapCoefficient;
                this.updateCoins(Math.floor(this.coins_count));
                this.removeCoin(coin);
            }
        );
        this.coins.push(coin);
    }

    getLastTapTime(): number {
        return this.lastTapTime;
    }

    setLastTapTime(time: number): void {
        this.lastTapTime = time;
    }

    getUIManager(): UIManager {
        return this.uiManager;
    }

    private removeCoin(coin: CoinAnimation) {
        const index = this.coins.indexOf(coin);
        if (index > -1) {
            this.coins.splice(index, 1);
            coin.destroy();
        }
    }

    setTapCoefficient(coef: number): void {
        this.tapCoefficient = coef;
    }

    getCoinsCount(): number {
        return this.coins_count;
    }

    private updateCoins(coins: number): void {
        this.uiManager.updateCoinCount(coins);
    }
}

export default CoinManager; 
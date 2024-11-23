import Phaser from 'phaser';
import Coin from '../objects/Coin';
import UIManager from './UIManager';

class CoinManager {
    private coins: Coin[] = [];
    private tapCoefficient: number = 1.0;
    private lastTapTime: number = Date.now();
    private uiManager: UIManager;
    private scene: Phaser.Scene;
    private coins_count: number = 0;

    constructor(scene: Phaser.Scene, uiManager: UIManager) {
        this.uiManager = uiManager;
        this.scene = scene;
    }

    spawnCoin(position: Phaser.Math.Vector2, target: Phaser.GameObjects.GameObject) {
        const coin = new Coin({
            scene: this.scene,
            x: position.x,
            y: position.y,
            targetX: (target as Phaser.GameObjects.Sprite).x,
            targetY: (target as Phaser.GameObjects.Sprite).y
        });
        this.coins.push(coin);

        coin.on('reached', () => {
            this.coins_count += this.tapCoefficient;
            this.uiManager.updateCoins(Math.floor(this.coins_count));
            this.removeCoin(coin);
        });
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

    private removeCoin(coin: Coin) {
        const index = this.coins.indexOf(coin);
        if (index > -1) {
            this.coins.splice(index, 1);
            coin.destroy();
        }
    }

    setTapCoefficient(coef: number): void {
        this.tapCoefficient = coef;
    }
}

export default CoinManager; 
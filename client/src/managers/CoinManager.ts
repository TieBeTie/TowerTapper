import Phaser from 'phaser';
import { UIManager } from './UIManager';
import { CoinAnimation } from '../ui/components/CoinAnimation';

class CoinManager {
    private coins: CoinAnimation[] = [];
    private uiManager: UIManager;
    private scene: Phaser.Scene;
    private coins_count: number = 0;

    constructor(scene: Phaser.Scene, uiManager: UIManager) {
        this.uiManager = uiManager;
        this.scene = scene;
    }

    spawnCoin(position: Phaser.Math.Vector2, target: Phaser.GameObjects.Sprite) {
        const gameScene = this.scene.scene.get('GameScene');
        const coinRewardMultiplier = (gameScene as any).getCoinRewardMultiplier?.() || 1;
        const baseReward = 1;
        const bonusCoins = coinRewardMultiplier - 1; // Get the bonus coins from the multiplier
        const finalReward = baseReward + bonusCoins;

        const coin = CoinAnimation.createCollectAnimation(
            this.scene,
            position,
            new Phaser.Math.Vector2(target.x, target.y),
            () => {
                this.coins_count += finalReward;
                this.updateCoins(Math.floor(this.coins_count));
                this.removeCoin(coin);
            }
        );
        this.coins.push(coin);
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

    getCoinsCount(): number {
        return this.coins_count;
    }

    private updateCoins(coins: number): void {
        this.uiManager.updateCoinCount(coins);
        this.scene.events.emit('updateCoins', coins);
    }

    // Add a new method to update coins directly without animation
    updateCoinsDirectly(coins: number): void {
        this.coins_count = coins;
        this.updateCoins(Math.floor(this.coins_count));
    }
}

export default CoinManager; 
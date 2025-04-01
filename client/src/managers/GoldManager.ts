import Phaser from 'phaser';
import { UIManager } from './UIManager';
import { GoldAnimation } from '../ui/components/GoldAnimation';

class GoldManager {
    private gold: GoldAnimation[] = [];
    private uiManager: UIManager;
    private scene: Phaser.Scene;
    private gold_count: number = 0;

    constructor(scene: Phaser.Scene, uiManager: UIManager) {
        this.uiManager = uiManager;
        this.scene = scene;
    }

    spawnGold(position: Phaser.Math.Vector2, target: Phaser.GameObjects.Sprite) {
        const gameScene = this.scene.scene.get('GameScene');
        const goldRewardMultiplier = (gameScene as any).getGoldRewardMultiplier?.() || 1;
        const baseReward = 1;
        const bonusGold = goldRewardMultiplier - 1; // Get the bonus gold from the multiplier
        const finalReward = baseReward + bonusGold;

        const gold = GoldAnimation.createCollectAnimation(
            this.scene,
            position,
            new Phaser.Math.Vector2(target.x, target.y),
            () => {
                this.gold_count += finalReward;
                this.updateGold(Math.floor(this.gold_count));
                this.removeGold(gold);
            }
        );
        this.gold.push(gold);
    }

    getUIManager(): UIManager {
        return this.uiManager;
    }

    private removeGold(gold: GoldAnimation) {
        const index = this.gold.indexOf(gold);
        if (index > -1) {
            this.gold.splice(index, 1);
            gold.destroy();
        }
    }

    getGoldCount(): number {
        return this.gold_count;
    }

    private updateGold(gold: number): void {
        this.uiManager.updateGold(gold);
        this.scene.events.emit('updateGold', gold);
    }

    // Add a new method to update gold directly without animation
    updateGoldDirectly(gold: number): void {
        this.gold_count = gold;
        this.updateGold(Math.floor(this.gold_count));
    }
}

export default GoldManager; 
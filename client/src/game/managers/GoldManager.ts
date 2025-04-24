import Phaser from 'phaser';
import { UIManager } from './UIManager';
import { GoldAnimation } from '../ui/components/GoldAnimation';
import { useGameStore } from '../../stores/game';

class GoldManager {
    private gold: GoldAnimation[] = [];
    private uiManager: UIManager;
    private scene: Phaser.Scene;
    
    // Для совместимости с существующим кодом, который может обращаться к gold_count напрямую
    get gold_count(): number {
        // Получаем значение из Pinia store
        try {
            const gameStore = useGameStore();
            return gameStore.stats.gold;
        } catch (error) {
            console.warn('Failed to get gold from store:', error);
            return 0;
        }
    }
    
    set gold_count(value: number) {
        // Обновляем значение в Pinia store
        try {
            const gameStore = useGameStore();
            gameStore.updateGold(value);
        } catch (error) {
            console.warn('Failed to update gold in store:', error);
        }
        // Обновляем UI и отправляем событие
        this.updateGold(Math.floor(value));
    }

    constructor(scene: Phaser.Scene, uiManager: UIManager) {
        this.uiManager = uiManager;
        this.scene = scene;
        
        // Инициализация золота в store при создании менеджера
        try {
            const gameStore = useGameStore();
            gameStore.updateGold(0);
        } catch (error) {
            console.warn('Failed to initialize gold in store:', error);
        }
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
                // Получаем текущее значение из store
                const currentGold = this.gold_count + finalReward;
                // Используем setter, который обновит значение в store
                this.gold_count = currentGold;
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
        // Используем setter, который обновит значение в store
        this.gold_count = gold;
    }
}

export default GoldManager; 
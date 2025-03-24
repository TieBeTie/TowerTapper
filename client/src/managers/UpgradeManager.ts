import { UpgradeType, Upgrade } from '../types/UpgradeType';
import { UpgradeStateService } from '../services/UpgradeStateService';

export class UpgradeManager {
    private scene: Phaser.Scene;
    private upgrades: Map<UpgradeType, Upgrade>;
    private stateService: UpgradeStateService;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.stateService = UpgradeStateService.getInstance();
        this.stateService.initialize();

        this.upgrades = new Map([
            [UpgradeType.HEALTH, {
                type: UpgradeType.HEALTH,
                name: 'Прочность замка',
                description: 'Увеличивает максимальное здоровье замка',
                cost: 4,
                level: 1,
                maxLevel: 20,
                baseEffect: 200,
                effectMultiplier: 1.35
            }],
            [UpgradeType.DEFENSE, {
                type: UpgradeType.DEFENSE,
                name: 'Защита замка',
                description: 'Уменьшает получаемый урон',
                cost: 6,
                level: 1,
                maxLevel: 10,
                baseEffect: 20,
                effectMultiplier: 1.25
            }],
            [UpgradeType.REGENERATION, {
                type: UpgradeType.REGENERATION,
                name: 'Регенерация',
                description: 'Восстанавливает здоровье замка со временем',
                cost: 10,
                level: 1,
                maxLevel: 8,
                baseEffect: 3,
                effectMultiplier: 1.5
            }],
            [UpgradeType.DAMAGE, {
                type: UpgradeType.DAMAGE,
                name: 'Урон',
                description: 'Увеличивает урон от стрел',
                cost: 6,
                level: 1,
                maxLevel: 15,
                baseEffect: 20,
                effectMultiplier: 1.35
            }],
            [UpgradeType.COIN_REWARD, {
                type: UpgradeType.COIN_REWARD,
                name: 'Gold Reward Bonus',
                description: 'Увеличивает количество монет с убитых врагов на +1 за уровень',
                cost: 12,
                level: 1,
                maxLevel: 20,
                baseEffect: 3,
                effectMultiplier: 1.25
            }]
        ]);
    }

    getAvailableUpgrades(): Upgrade[] {
        return Array.from(this.upgrades.values());
    }

    getUpgradeCost(type: UpgradeType): number {
        const upgrade = this.upgrades.get(type);
        if (!upgrade) return 0;
        const currentLevel = this.stateService.getState(type);
        return Math.floor(upgrade.cost * Math.pow(upgrade.effectMultiplier, currentLevel - 1));
    }

    getUpgradeEffect(type: UpgradeType): number {
        const upgrade = this.upgrades.get(type);
        if (!upgrade) return 0;
        return upgrade.baseEffect * Math.pow(upgrade.effectMultiplier, this.stateService.getState(type) - 1);
    }

    purchaseUpgrade(type: UpgradeType): boolean {
        const upgrade = this.upgrades.get(type);
        if (!upgrade) return false;

        const cost = this.getUpgradeCost(type);
        const gameScene = this.scene.scene.get('GameScene');
        const coins = (gameScene as any).coinManager?.coins_count || 0;

        if (coins >= cost) {
            // Списываем монеты
            (gameScene as any).coinManager.coins_count -= cost;

            // Получаем текущий уровень и увеличиваем его
            const currentLevel = this.stateService.getState(type);
            this.stateService.saveState(type, currentLevel + 1);

            // Применяем эффекты улучшения
            this.applyUpgradeEffects(type);

            // Обновляем UI
            gameScene.events.emit('updateCoins', (gameScene as any).coinManager.coins_count);

            return true;
        }

        return false;
    }

    private applyUpgradeEffects(type: UpgradeType): void {
        const upgrade = this.upgrades.get(type);
        if (!upgrade) return;

        const gameScene = this.scene.scene.get('GameScene');
        const tower = (gameScene as any).tower;
        const currentLevel = this.stateService.getState(type);

        switch (type) {
            case UpgradeType.HEALTH:
                tower.maxHealth = upgrade.baseEffect * Math.pow(upgrade.effectMultiplier, currentLevel - 1);
                tower.health = tower.maxHealth;
                break;
            case UpgradeType.DEFENSE:
                tower.defense = upgrade.baseEffect * Math.pow(upgrade.effectMultiplier, currentLevel - 1);
                break;
            case UpgradeType.REGENERATION:
                tower.regeneration = upgrade.baseEffect * Math.pow(upgrade.effectMultiplier, currentLevel - 1);
                break;
            case UpgradeType.DAMAGE:
                tower.damage = upgrade.baseEffect * Math.pow(upgrade.effectMultiplier, currentLevel - 1);
                if (gameScene.projectileManager) {
                    gameScene.projectileManager.updateDamage();
                }
                break;
            case UpgradeType.COIN_REWARD:
                if (gameScene) {
                    (gameScene as any).coinRewardMultiplier = upgrade.baseEffect * Math.pow(upgrade.effectMultiplier, currentLevel - 1);
                }
                break;
        }

        tower.updateHealthBar();
    }

    getState(type: UpgradeType): number {
        return this.stateService.getState(type);
    }
}

export default UpgradeManager; 
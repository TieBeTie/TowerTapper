import { UpgradeType, Upgrade, UpgradeState } from '../types/UpgradeType';

export class UpgradeManager {
    private scene: Phaser.Scene;
    private upgrades: Map<UpgradeType, Upgrade>;
    private state: UpgradeState;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.state = {
            [UpgradeType.HEALTH]: 1,
            [UpgradeType.DEFENSE]: 1,
            [UpgradeType.REGENERATION]: 1,
            [UpgradeType.DAMAGE]: 1,
            [UpgradeType.COIN_REWARD]: 1
        };

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
        return Math.floor(upgrade.cost * Math.pow(upgrade.effectMultiplier, this.state[type] - 1));
    }

    getUpgradeEffect(type: UpgradeType): number {
        const upgrade = this.upgrades.get(type);
        if (!upgrade) return 0;
        return upgrade.baseEffect * Math.pow(upgrade.effectMultiplier, this.state[type] - 1);
    }

    purchaseUpgrade(type: UpgradeType): boolean {
        const upgrade = this.upgrades.get(type);
        if (!upgrade) return false;

        const cost = this.getUpgradeCost(type);
        const gameScene = this.scene.scene.get('GameScene');
        const coins = (gameScene as any).coinManager?.coins_count || 0;

        if (coins >= cost && this.state[type] < upgrade.maxLevel) {
            // Deduct coins
            (gameScene as any).coinManager.coins_count -= cost;

            // Update level
            this.state[type]++;

            // Apply upgrade effects
            this.applyUpgradeEffects(type);

            // Emit event for UI update
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

        switch (type) {
            case UpgradeType.HEALTH:
                tower.maxHealth = upgrade.baseEffect * Math.pow(upgrade.effectMultiplier, this.state[type] - 1);
                tower.health = tower.maxHealth;
                break;
            case UpgradeType.DEFENSE:
                tower.defense = upgrade.baseEffect * Math.pow(upgrade.effectMultiplier, this.state[type] - 1);
                break;
            case UpgradeType.REGENERATION:
                tower.regeneration = upgrade.baseEffect * Math.pow(upgrade.effectMultiplier, this.state[type] - 1);
                break;
            case UpgradeType.DAMAGE:
                tower.damage = upgrade.baseEffect * Math.pow(upgrade.effectMultiplier, this.state[type] - 1);
                if (gameScene.projectileManager) {
                    gameScene.projectileManager.updateDamage();
                }
                break;
            case UpgradeType.COIN_REWARD:
                // Update coin reward multiplier in the game scene
                if (gameScene) {
                    (gameScene as any).coinRewardMultiplier = upgrade.baseEffect * Math.pow(upgrade.effectMultiplier, this.state[type] - 1);
                }
                break;
        }

        tower.updateHealthBar();
    }

    getState(type: UpgradeType): number {
        return this.state[type];
    }
}

export default UpgradeManager; 
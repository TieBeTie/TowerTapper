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
            [UpgradeType.DAMAGE]: 1
        };

        this.upgrades = new Map([
            [UpgradeType.HEALTH, {
                type: UpgradeType.HEALTH,
                name: 'Прочность замка',
                description: 'Увеличивает максимальное здоровье замка',
                cost: 25,
                level: 1,
                maxLevel: 10,
                baseEffect: 100,
                effectMultiplier: 1.5
            }],
            [UpgradeType.DEFENSE, {
                type: UpgradeType.DEFENSE,
                name: 'Защита замка',
                description: 'Уменьшает получаемый урон',
                cost: 35,
                level: 1,
                maxLevel: 5,
                baseEffect: 10,
                effectMultiplier: 1.3
            }],
            [UpgradeType.REGENERATION, {
                type: UpgradeType.REGENERATION,
                name: 'Регенерация',
                description: 'Восстанавливает здоровье замка со временем',
                cost: 50,
                level: 1,
                maxLevel: 3,
                baseEffect: 1,
                effectMultiplier: 2
            }],
            [UpgradeType.DAMAGE, {
                type: UpgradeType.DAMAGE,
                name: 'Урон',
                description: 'Увеличивает урон от стрел',
                cost: 60,
                level: 1,
                maxLevel: 8,
                baseEffect: 10,
                effectMultiplier: 1.4
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
        const gameScene = this.scene.scene.get('GameScene');
        const tower = (gameScene as any).tower;
        if (!tower) return;

        const effect = this.getUpgradeEffect(type);

        switch (type) {
            case UpgradeType.HEALTH:
                tower.maxHealth += effect;
                tower.health += effect;
                break;
            case UpgradeType.DEFENSE:
                tower.defense = effect;
                break;
            case UpgradeType.REGENERATION:
                tower.regeneration = effect;
                break;
            case UpgradeType.DAMAGE:
                (gameScene as any).projectileManager.setDamage(effect);
                break;
        }

        tower.updateHealthBar();
    }

    getState(type: UpgradeType): number {
        return this.state[type];
    }
}

export default UpgradeManager; 
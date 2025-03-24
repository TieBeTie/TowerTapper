import { SkillType, Upgrade } from '../types/SkillType';
import { SkillStateManager } from './SkillStateManager';

export class UpgradeManager {
    private scene: Phaser.Scene;
    private upgrades: Map<SkillType, Upgrade>;
    private stateService: SkillStateManager;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.stateService = SkillStateManager.getInstance();
        this.stateService.initialize();

        this.upgrades = new Map([
            [SkillType.HEALTH, {
                type: SkillType.HEALTH,
                name: 'Прочность замка',
                description: 'Увеличивает максимальное здоровье замка',
                cost: 4,
                currentValue: 200,
                maxValue: 10000,
                calculateNextValue: (current) => Math.floor(current * 1.35),
                calculateCost: (current) => Math.floor(4 * Math.pow(1.35, Math.log(current/200) / Math.log(1.35)))
            }],
            [SkillType.DEFENSE, {
                type: SkillType.DEFENSE,
                name: 'Защита замка',
                description: 'Уменьшает получаемый урон',
                cost: 6,
                currentValue: 20,
                maxValue: 200,
                calculateNextValue: (current) => Math.floor(current * 1.25),
                calculateCost: (current) => Math.floor(6 * Math.pow(1.25, Math.log(current/20) / Math.log(1.25)))
            }],
            [SkillType.REGENERATION, {
                type: SkillType.REGENERATION,
                name: 'Регенерация',
                description: 'Восстанавливает здоровье замка со временем',
                cost: 10,
                currentValue: 3,
                maxValue: 50,
                calculateNextValue: (current) => Math.floor(current * 1.5),
                calculateCost: (current) => Math.floor(10 * Math.pow(1.5, Math.log(current/3) / Math.log(1.5)))
            }],
            [SkillType.DAMAGE, {
                type: SkillType.DAMAGE,
                name: 'Урон',
                description: 'Увеличивает урон от стрел',
                cost: 6,
                currentValue: 20,
                maxValue: 300,
                calculateNextValue: (current) => Math.floor(current * 1.35),
                calculateCost: (current) => Math.floor(6 * Math.pow(1.35, Math.log(current/20) / Math.log(1.35)))
            }],
            [SkillType.COIN_REWARD, {
                type: SkillType.COIN_REWARD,
                name: 'Gold Reward Bonus',
                description: 'Увеличивает количество монет с убитых врагов',
                cost: 12,
                currentValue: 3,
                maxValue: 50,
                calculateNextValue: (current) => Math.floor(current * 1.25),
                calculateCost: (current) => Math.floor(12 * Math.pow(1.25, Math.log(current/3) / Math.log(1.25)))
            }]
        ]);
    }

    getAvailableUpgrades(): Upgrade[] {
        return Array.from(this.upgrades.values());
    }

    getUpgradeCost(type: SkillType): number {
        const upgrade = this.upgrades.get(type);
        if (!upgrade) return 0;
        return upgrade.calculateCost(upgrade.currentValue);
    }

    getUpgradeEffect(type: SkillType): number {
        const upgrade = this.upgrades.get(type);
        if (!upgrade) return 0;
        return upgrade.currentValue;
    }

    purchaseUpgrade(type: SkillType): boolean {
        const upgrade = this.upgrades.get(type);
        if (!upgrade) return false;

        const cost = this.getUpgradeCost(type);
        const gameScene = this.scene.scene.get('GameScene');
        const coins = (gameScene as any).coinManager?.coins_count || 0;

        if (coins >= cost && upgrade.currentValue < upgrade.maxValue) {
            // Списываем монеты
            (gameScene as any).coinManager.coins_count -= cost;

            // Увеличиваем значение
            upgrade.currentValue = upgrade.calculateNextValue(upgrade.currentValue);
            this.stateService.saveState(type, upgrade.currentValue);

            // Применяем эффекты улучшения
            this.applyUpgradeEffects(type);

            // Обновляем UI
            gameScene.events.emit('updateCoins', (gameScene as any).coinManager.coins_count);

            return true;
        }

        return false;
    }

    private applyUpgradeEffects(type: SkillType): void {
        const upgrade = this.upgrades.get(type);
        if (!upgrade) return;

        const gameScene = this.scene.scene.get('GameScene');
        const tower = (gameScene as any).tower;

        switch (type) {
            case SkillType.HEALTH:
                tower.maxHealth = upgrade.currentValue;
                tower.health = tower.maxHealth;
                break;
            case SkillType.DEFENSE:
                tower.defense = upgrade.currentValue;
                break;
            case SkillType.REGENERATION:
                tower.regeneration = upgrade.currentValue;
                break;
            case SkillType.DAMAGE:
                tower.damage = upgrade.currentValue;
                if (gameScene.projectileManager) {
                    gameScene.projectileManager.updateDamage();
                }
                break;
            case SkillType.COIN_REWARD:
                if (gameScene) {
                    (gameScene as any).coinRewardMultiplier = upgrade.currentValue;
                }
                break;
        }

        tower.updateHealthBar();
    }

    getState(type: SkillType): number {
        const upgrade = this.upgrades.get(type);
        if (!upgrade) return 0;
        return upgrade.currentValue;
    }
}

export default UpgradeManager; 
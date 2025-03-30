import { SkillType, Upgrade } from '../types/SkillType';
import { SkillStateManager } from './SkillStateManager';
import { SkillSetStorage } from '../storage/SkillSetStorage';
import { IScene } from '../types/IScene';
import { IGameScene } from '../types/IGameScene';

export class UpgradeManager {
    private scene: IScene;
    private upgrades: Map<SkillType, Upgrade>;
    private stateService: SkillStateManager;
    private skillStorage: SkillSetStorage;

    constructor(scene: IScene) {
        this.scene = scene;
        this.stateService = SkillStateManager.getInstance();
        this.skillStorage = SkillSetStorage.getInstance();
        this.stateService.initialize();

        const skills = this.skillStorage.load();

        this.upgrades = new Map([
            [SkillType.MAX_HEALTH, {
                type: SkillType.MAX_HEALTH,
                name: 'Прочность замка',
                description: 'Увеличивает максимальное здоровье замка',
                cost: 4,
                currentValue: skills.get(SkillType.MAX_HEALTH)?.value || 200,
                maxValue: 10000,
                calculateNextValue: (current: number) => Math.floor(current * 1.35),
                calculateCost: (current: number) => Math.floor(4 * Math.pow(1.35, Math.log(current/200) / Math.log(1.35)))
            }],
            [SkillType.DEFENSE, {
                type: SkillType.DEFENSE,
                name: 'Защита замка',
                description: 'Уменьшает получаемый урон',
                cost: 6,
                currentValue: skills.get(SkillType.DEFENSE)?.value || 20,
                maxValue: 200,
                calculateNextValue: (current: number) => Math.floor(current * 1.25),
                calculateCost: (current: number) => Math.floor(6 * Math.pow(1.25, Math.log(current/20) / Math.log(1.25)))
            }],
            [SkillType.HEALTH_REGEN, {
                type: SkillType.HEALTH_REGEN,
                name: 'Регенерация здоровья',
                description: 'Восстанавливает здоровье замка со временем',
                cost: 10,
                currentValue: skills.get(SkillType.HEALTH_REGEN)?.value || 3,
                maxValue: 50,
                calculateNextValue: (current: number) => Math.floor(current * 1.5),
                calculateCost: (current: number) => Math.floor(10 * Math.pow(1.5, Math.log(current/3) / Math.log(1.5)))
            }],
            [SkillType.DAMAGE, {
                type: SkillType.DAMAGE,
                name: 'Урон',
                description: 'Увеличивает урон от стрел',
                cost: 6,
                currentValue: skills.get(SkillType.DAMAGE)?.value || 20,
                maxValue: 300,
                calculateNextValue: (current: number) => Math.floor(current * 1.35),
                calculateCost: (current: number) => Math.floor(6 * Math.pow(1.35, Math.log(current/20) / Math.log(1.35)))
            }],
            [SkillType.COIN_REWARD, {
                type: SkillType.COIN_REWARD,
                name: 'Gold Reward Bonus',
                description: 'Увеличивает количество монет с убитых врагов',
                cost: 12,
                currentValue: skills.get(SkillType.COIN_REWARD)?.value || 3,
                maxValue: 50,
                calculateNextValue: (current: number) => Math.floor(current * 1.25),
                calculateCost: (current: number) => Math.floor(12 * Math.pow(1.25, Math.log(current/3) / Math.log(1.25)))
            }],
            [SkillType.ATTACK_SPEED, {
                type: SkillType.ATTACK_SPEED,
                name: 'Скорость атаки',
                description: 'Увеличивает частоту выстрелов башни',
                cost: 10,
                currentValue: skills.get(SkillType.ATTACK_SPEED)?.value || 1,
                maxValue: 3,
                calculateNextValue: (current: number) => Math.floor((current + 0.2) * 100) / 100,
                calculateCost: (current: number) => Math.floor(10 * Math.pow(1.3, Math.log(current/1) / Math.log(1.3)))
            }],
            [SkillType.ATTACK_RANGE, {
                type: SkillType.ATTACK_RANGE,
                name: 'Радиус атаки',
                description: 'Увеличивает дальность атаки башни',
                cost: 8,
                currentValue: skills.get(SkillType.ATTACK_RANGE)?.value || 1,
                maxValue: 3,
                calculateNextValue: (current: number) => Math.floor((current + 0.25) * 100) / 100,
                calculateCost: (current: number) => Math.floor(8 * Math.pow(1.3, Math.log(current/1) / Math.log(1.3)))
            }],
            [SkillType.KNOCKBACK, {
                type: SkillType.KNOCKBACK,
                name: 'Отбрасывание',
                description: 'Увеличивает силу отбрасывания врагов при попадании',
                cost: 7,
                currentValue: skills.get(SkillType.KNOCKBACK)?.value || 50,
                maxValue: 500,
                calculateNextValue: (current: number) => Math.floor(current * 1.3),
                calculateCost: (current: number) => Math.floor(7 * Math.pow(1.3, Math.log(current/50) / Math.log(1.3)))
            }],
            [SkillType.MULTISHOT, {
                type: SkillType.MULTISHOT,
                name: 'Мультивыстрел',
                description: 'Шанс выпустить 3 стрелы одновременно',
                cost: 15,
                currentValue: skills.get(SkillType.MULTISHOT)?.value || 5, // 5% chance initially
                maxValue: 50, // Max 50% chance
                calculateNextValue: (current: number) => Math.floor(current + 3), // +3% per upgrade
                calculateCost: (current: number) => Math.floor(15 * Math.pow(1.4, (current - 5) / 3))
            }],
            [SkillType.CRIT_CHANCE, {
                type: SkillType.CRIT_CHANCE,
                name: 'Шанс крита',
                description: 'Шанс нанести критический урон',
                cost: 15,
                currentValue: skills.get(SkillType.CRIT_CHANCE)?.value || 25, // 25% chance initially (0.25)
                maxValue: 75, // Max 75% chance
                calculateNextValue: (current: number) => Math.floor(current + 25), // +25% per upgrade
                calculateCost: (current: number) => Math.floor(15 * Math.pow(1.4, (current - 25) / 25))
            }],
            [SkillType.CRIT_MULTIPLIER, {
                type: SkillType.CRIT_MULTIPLIER,
                name: 'Множитель крита',
                description: 'Увеличивает урон критического удара',
                cost: 20,
                currentValue: skills.get(SkillType.CRIT_MULTIPLIER)?.value || 25, // 25% damage increase initially (0.25)
                maxValue: 200, // Max 200% damage increase
                calculateNextValue: (current: number) => Math.floor(current + 25), // +25% per upgrade
                calculateCost: (current: number) => Math.floor(20 * Math.pow(1.4, (current - 25) / 25))
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

    getPlayerCoins(): number {
        const gameScene = this.scene.scene.get('GameScene');
        return (gameScene as any).coinManager?.coins_count || 0;
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

        const gameScene = this.scene.scene.get('GameScene') as IGameScene;
        if (!gameScene || !gameScene.tower) return;

        const tower = gameScene.tower;

        switch (type) {
            case SkillType.MAX_HEALTH:
                tower.maxHealth = upgrade.currentValue;
                tower.health = tower.maxHealth;
                break;
            case SkillType.DEFENSE:
                tower.defense = upgrade.currentValue;
                break;
            case SkillType.HEALTH_REGEN:
                tower.regeneration = upgrade.currentValue;
                break;
            case SkillType.DAMAGE:
                // Урон теперь берется из SkillSetStorage, поэтому здесь ничего не делаем
                break;
            case SkillType.COIN_REWARD:
                if (gameScene) {
                    (gameScene as any).coinRewardMultiplier = upgrade.currentValue;
                }
                break;
            case SkillType.ATTACK_SPEED:
                if (gameScene) {
                    (gameScene as any).attackSpeedMultiplier = upgrade.currentValue;
                }
                break;
            case SkillType.ATTACK_RANGE:
                // Радиус атаки обновляется через SkillSetStorage при обновлении башни
                tower.upgrade(); // Вызываем метод upgrade для обновления радиуса атаки
                break;
            case SkillType.KNOCKBACK:
                // Сохраняем новое значение knockback в SkillSetStorage
                this.stateService.saveState(SkillType.KNOCKBACK, upgrade.currentValue);
                break;
            case SkillType.MULTISHOT:
                // Просто сохраняем новое значение в SkillSetStorage
                this.stateService.saveState(SkillType.MULTISHOT, upgrade.currentValue);
                break;
            case SkillType.CRIT_CHANCE:
                // Сохраняем шанс критического удара в SkillSetStorage
                this.stateService.saveState(SkillType.CRIT_CHANCE, upgrade.currentValue);
                break;
            case SkillType.CRIT_MULTIPLIER:
                // Сохраняем множитель критического урона в SkillSetStorage
                this.stateService.saveState(SkillType.CRIT_MULTIPLIER, upgrade.currentValue);
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
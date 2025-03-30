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
            }],
            [SkillType.LIFESTEAL_CHANCE, {
                type: SkillType.LIFESTEAL_CHANCE,
                name: 'Шанс вампиризма',
                description: 'Шанс восстановить здоровье при атаке',
                cost: 15,
                currentValue: skills.get(SkillType.LIFESTEAL_CHANCE)?.value || 25, // 25% chance initially
                maxValue: 100, // Max 100% chance
                calculateNextValue: (current: number) => Math.floor(current + 25), // +25% per upgrade
                calculateCost: (current: number) => Math.floor(15 * Math.pow(1.4, (current - 25) / 25))
            }],
            [SkillType.LIFESTEAL_AMOUNT, {
                type: SkillType.LIFESTEAL_AMOUNT,
                name: 'Сила вампиризма',
                description: 'Количество восстанавливаемого здоровья',
                cost: 20,
                currentValue: skills.get(SkillType.LIFESTEAL_AMOUNT)?.value || 0, // 0 health initially
                maxValue: 20, // Max 20 health
                calculateNextValue: (current: number) => Math.floor(current + 1), // +1 per upgrade
                calculateCost: (current: number) => Math.floor(20 * Math.pow(1.4, current))
            }],
            [SkillType.DAILY_GOLD, {
                type: SkillType.DAILY_GOLD,
                name: 'Ежедневное золото',
                description: 'Дает золото в начале каждой волны',
                cost: 25,
                currentValue: skills.get(SkillType.DAILY_GOLD)?.value || 0, // 0 initially
                maxValue: 10, // Max level 10
                calculateNextValue: (current: number) => current + 1, // +1 level per upgrade
                calculateCost: (current: number) => Math.floor(25 * Math.pow(1.5, current))
            }],
            [SkillType.EMBLEM_BONUS, {
                type: SkillType.EMBLEM_BONUS,
                name: 'Бонус эмблем',
                description: 'Увеличивает бонус эмблем в начале каждой волны',
                cost: 30,
                currentValue: skills.get(SkillType.EMBLEM_BONUS)?.value || 1, // 1 initially
                maxValue: 10, // Max level 10
                calculateNextValue: (current: number) => current + 1, // +1 level per upgrade
                calculateCost: (current: number) => Math.floor(30 * Math.pow(1.6, current - 1))
            }],
            [SkillType.FREE_UPGRADE, {
                type: SkillType.FREE_UPGRADE,
                name: 'Шанс бесплатного улучшения',
                description: 'Шанс получить бесплатное улучшение',
                cost: 30,
                currentValue: skills.get(SkillType.FREE_UPGRADE)?.value || 0, // 0% chance initially
                maxValue: 50, // Max 50% chance
                calculateNextValue: (current: number) => current + 5, // +5% per upgrade (0.05)
                calculateCost: (current: number) => Math.floor(30 * Math.pow(1.3, current / 5))
            }],
            [SkillType.SUPPLY_DROP, {
                type: SkillType.SUPPLY_DROP,
                name: 'Шанс золотого сундука',
                description: 'Шанс появления золотого сундука при улучшении',
                cost: 35,
                currentValue: skills.get(SkillType.SUPPLY_DROP)?.value || 0, // 0% chance initially
                maxValue: 50, // Max 50% chance
                calculateNextValue: (current: number) => current + 5, // +5% per upgrade (0.05)
                calculateCost: (current: number) => Math.floor(35 * Math.pow(1.4, current / 5))
            }],
            [SkillType.GAME_SPEED, {
                type: SkillType.GAME_SPEED,
                name: 'Скорость игры',
                description: 'Увеличивает скорость всех игровых действий',
                cost: 20,
                currentValue: skills.get(SkillType.GAME_SPEED)?.value || 1, // базовый множитель скорости - 1
                maxValue: 3, // максимальный множитель скорости - 3
                calculateNextValue: (current: number) => Math.floor((current + 0.25) * 100) / 100, // +0.25 per upgrade
                calculateCost: (current: number) => Math.floor(20 * Math.pow(1.4, (current - 1) / 0.25))
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

        // Check for free upgrade chance
        const freeUpgradeChance = this.stateService.getState(SkillType.FREE_UPGRADE) / 100; // Convert from percentage to decimal
        const isFreeUpgrade = type !== SkillType.FREE_UPGRADE && Math.random() < freeUpgradeChance;

        if ((coins >= cost || isFreeUpgrade) && upgrade.currentValue < upgrade.maxValue) {
            // Списываем монеты только если не бесплатное улучшение
            if (!isFreeUpgrade) {
                (gameScene as any).coinManager.coins_count -= cost;
            } else {
                // Display free upgrade message
                console.log('Free upgrade!');
                // If game has a notification system, you could add a notification here
                if ((gameScene as any).uiManager && (gameScene as any).uiManager.showNotification) {
                    (gameScene as any).uiManager.showNotification('Free Upgrade!', 0x4CAF50);
                }
            }

            // Увеличиваем значение
            upgrade.currentValue = upgrade.calculateNextValue(upgrade.currentValue);
            this.stateService.saveState(type, upgrade.currentValue);

            // Применяем эффекты улучшения
            this.applyUpgradeEffects(type);

            // Обновляем UI
            gameScene.events.emit('updateCoins', (gameScene as any).coinManager.coins_count);
            
            // Check for supply drop chance
            const supplyDropChance = this.stateService.getState(SkillType.SUPPLY_DROP) / 100; // Convert from percentage to decimal
            if (supplyDropChance > 0 && Math.random() < supplyDropChance) {
                // Trigger supply drop
                gameScene.events.emit('triggerSupplyDrop');
                
                // Show notification if available
                if ((gameScene as any).uiManager && (gameScene as any).uiManager.showNotification) {
                    (gameScene as any).uiManager.showNotification('Supply Drop!', 0xFFD700);
                }
            }

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
            case SkillType.LIFESTEAL_CHANCE:
                // Сохраняем шанс вампиризма в SkillSetStorage
                this.stateService.saveState(SkillType.LIFESTEAL_CHANCE, upgrade.currentValue);
                break;
            case SkillType.LIFESTEAL_AMOUNT:
                // Сохраняем силу вампиризма в SkillSetStorage
                this.stateService.saveState(SkillType.LIFESTEAL_AMOUNT, upgrade.currentValue);
                break;
            case SkillType.DAILY_GOLD:
                // Сохраняем уровень ежедневного золота в SkillSetStorage
                this.stateService.saveState(SkillType.DAILY_GOLD, upgrade.currentValue);
                break;
            case SkillType.EMBLEM_BONUS:
                // Сохраняем уровень бонуса эмблем в SkillSetStorage
                this.stateService.saveState(SkillType.EMBLEM_BONUS, upgrade.currentValue);
                break;
            case SkillType.FREE_UPGRADE:
                // Сохраняем шанс бесплатного улучшения в SkillSetStorage
                this.stateService.saveState(SkillType.FREE_UPGRADE, upgrade.currentValue);
                break;
            case SkillType.SUPPLY_DROP:
                // Сохраняем шанс появления золотого сундука в SkillSetStorage
                this.stateService.saveState(SkillType.SUPPLY_DROP, upgrade.currentValue);
                break;
            case SkillType.GAME_SPEED:
                // Сохраняем множитель скорости игры в SkillSetStorage и оповещаем о изменении
                this.stateService.saveState(SkillType.GAME_SPEED, upgrade.currentValue);
                // Оповещаем через событие о изменении скорости игры
                gameScene.events.emit('gameSpeedChanged', upgrade.currentValue);
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
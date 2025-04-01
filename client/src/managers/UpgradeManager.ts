import { SkillType, SkillInfo, CurrencyType, SkillPrice } from '../types/SkillType';
import { SkillStateManager } from './SkillStateManager';
import { SkillSetStorage } from '../storage/SkillSetStorage';
import { IScene } from '../types/IScene';
import { IGameScene } from '../types/IGameScene';

export class UpgradeManager {
    private scene: IScene;
    private skills: Map<SkillType, SkillInfo> = new Map();
    private prices: Map<SkillType, SkillPrice> = new Map();
    private stateManager: SkillStateManager;
    private skillStorage: SkillSetStorage;

    constructor(scene: IScene) {
        this.scene = scene;
        this.stateManager = SkillStateManager.getInstance();
        this.skillStorage = SkillSetStorage.getInstance();
        this.stateManager.initialize();

        // Initialize skill definitions and prices
        this.initializeSkills();
        this.initializePrices();
    }

    // Initialize skill information
    private initializeSkills(): void {
        const skills = this.skillStorage.load();

        // Define all skills with their properties (excluding pricing)
        this.skills = new Map([
            [SkillType.MAX_HEALTH, {
                type: SkillType.MAX_HEALTH,
                name: 'Прочность замка',
                description: 'Увеличивает максимальное здоровье замка',
                currentLevel: skills.get(SkillType.MAX_HEALTH)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 100 + (100 * currentLevel) // Изменено с 200*Math.pow(1.35, currentLevel)
            }],
            [SkillType.DEFENSE, {
                type: SkillType.DEFENSE,
                name: 'Защита замка',
                description: 'Уменьшает получаемый урон',
                currentLevel: skills.get(SkillType.DEFENSE)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => Math.floor(20 * Math.pow(1.25, currentLevel))
            }],
            [SkillType.HEALTH_REGEN, {
                type: SkillType.HEALTH_REGEN,
                name: 'Регенерация здоровья',
                description: 'Восстанавливает здоровье замка со временем',
                currentLevel: skills.get(SkillType.HEALTH_REGEN)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => Math.floor(3 * Math.pow(1.5, currentLevel))
            }],
            [SkillType.DAMAGE, {
                type: SkillType.DAMAGE,
                name: 'Урон',
                description: 'Увеличивает урон от стрел',
                currentLevel: skills.get(SkillType.DAMAGE)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => Math.floor(20 * Math.pow(1.35, currentLevel))
            }],
            [SkillType.COIN_REWARD, {
                type: SkillType.COIN_REWARD,
                name: 'Gold Reward Bonus',
                description: 'Увеличивает количество монет с убитых врагов',
                currentLevel: skills.get(SkillType.COIN_REWARD)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => Math.floor(3 * Math.pow(1.25, currentLevel))
            }],
            [SkillType.ATTACK_SPEED, {
                type: SkillType.ATTACK_SPEED,
                name: 'Скорость атаки',
                description: 'Увеличивает частоту выстрелов башни',
                currentLevel: skills.get(SkillType.ATTACK_SPEED)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 1 + (0.2 * currentLevel)
            }],
            [SkillType.ATTACK_RANGE, {
                type: SkillType.ATTACK_RANGE,
                name: 'Радиус атаки',
                description: 'Увеличивает дальность атаки башни',
                currentLevel: skills.get(SkillType.ATTACK_RANGE)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 1 + (0.25 * currentLevel)
            }],
            [SkillType.KNOCKBACK, {
                type: SkillType.KNOCKBACK,
                name: 'Отбрасывание',
                description: 'Увеличивает силу отбрасывания врагов при попадании',
                currentLevel: skills.get(SkillType.KNOCKBACK)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => Math.floor(50 * Math.pow(1.3, currentLevel))
            }],
            [SkillType.MULTISHOT, {
                type: SkillType.MULTISHOT,
                name: 'Мультивыстрел',
                description: 'Шанс выпустить 3 стрелы одновременно',
                currentLevel: skills.get(SkillType.MULTISHOT)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 5 + (3 * currentLevel) // +3% per upgrade
            }],
            [SkillType.CRIT_CHANCE, {
                type: SkillType.CRIT_CHANCE,
                name: 'Шанс крита',
                description: 'Шанс нанести критический урон',
                currentLevel: skills.get(SkillType.CRIT_CHANCE)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 25 + (25 * currentLevel) // +25% per upgrade
            }],
            [SkillType.CRIT_MULTIPLIER, {
                type: SkillType.CRIT_MULTIPLIER,
                name: 'Множитель крита',
                description: 'Увеличивает урон критического удара',
                currentLevel: skills.get(SkillType.CRIT_MULTIPLIER)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 25 + (25 * currentLevel) // +25% per upgrade
            }],
            [SkillType.LIFESTEAL_CHANCE, {
                type: SkillType.LIFESTEAL_CHANCE,
                name: 'Шанс вампиризма',
                description: 'Шанс восстановить здоровье при атаке',
                currentLevel: skills.get(SkillType.LIFESTEAL_CHANCE)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 25 + (25 * currentLevel) // +25% per upgrade
            }],
            [SkillType.LIFESTEAL_AMOUNT, {
                type: SkillType.LIFESTEAL_AMOUNT,
                name: 'Сила вампиризма',
                description: 'Количество восстанавливаемого здоровья',
                currentLevel: skills.get(SkillType.LIFESTEAL_AMOUNT)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => currentLevel // +1 per upgrade
            }],
            [SkillType.DAILY_GOLD, {
                type: SkillType.DAILY_GOLD,
                name: 'Ежедневное золото',
                description: 'Дает золото в начале каждой волны',
                currentLevel: skills.get(SkillType.DAILY_GOLD)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => currentLevel + 1 // +1 level per upgrade
            }],
            [SkillType.EMBLEM_BONUS, {
                type: SkillType.EMBLEM_BONUS,
                name: 'Бонус эмблем',
                description: 'Увеличивает количество получаемых эмблем за волну',
                currentLevel: skills.get(SkillType.EMBLEM_BONUS)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => currentLevel + 1 // +1 level per upgrade
            }],
            [SkillType.FREE_UPGRADE, {
                type: SkillType.FREE_UPGRADE,
                name: 'Шанс бесплатного улучшения',
                description: 'Шанс получить бесплатное улучшение',
                currentLevel: skills.get(SkillType.FREE_UPGRADE)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => currentLevel * 5 // +5% per upgrade (0.05)
            }],
            [SkillType.SUPPLY_DROP, {
                type: SkillType.SUPPLY_DROP,
                name: 'Шанс золотого сундука',
                description: 'Шанс появления золотого сундука при улучшении',
                currentLevel: skills.get(SkillType.SUPPLY_DROP)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => currentLevel * 5 // +5% per upgrade (0.05)
            }],
            [SkillType.GAME_SPEED, {
                type: SkillType.GAME_SPEED,
                name: 'Скорость игры',
                description: 'Увеличивает скорость всех игровых действий',
                currentLevel: skills.get(SkillType.GAME_SPEED)?.currentLevel || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 1 + (0.25 * currentLevel) // +0.25 per upgrade
            }]
        ]);

        // Тестовый расчет для проверки
        console.log('Тест Фибоначчи:');
        for (let i = 0; i <= 10; i++) {
            console.log(`Фибоначчи(${i}) = ${this.fibonacci(i)}`);
        }
    }

    // Добавим функцию Фибоначчи для расчета цены
    private fibonacci(n: number): number {
        // Явно определяем последовательность для первых элементов
        const fibValues = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
        
        // Возвращаем заранее вычисленное значение для n <= 10
        if (n >= 0 && n < fibValues.length) {
            return fibValues[n];
        }
        
        // Для n > 10, рассчитываем динамически
        let a = fibValues[fibValues.length - 2];
        let b = fibValues[fibValues.length - 1];
        let result = 0;
        
        for (let i = fibValues.length; i <= n; i++) {
            result = a + b;
            a = b;
            b = result;
        }
        
        return result;
    }

    // Initialize pricing information separately
    private initializePrices(): void {
        console.log('Инициализация цен с последовательностью Фибоначчи');
        
        // Для тестирования расчета стоимости навыков на разных уровнях
        console.log('Тестовый расчет стоимости (золото):');
        for (let level = 0; level <= 5; level++) {
            console.log(`Уровень ${level} -> ${level+1}: ${this.fibonacci(level+1)} золота`);
        }
        
        // Define prices for all skills with both currency options using Fibonacci sequence
        this.prices = new Map([
            [SkillType.MAX_HEALTH, {
                skillType: SkillType.MAX_HEALTH,
                goldCost: {
                    calculateCost: (currentLevel: number) => {
                        const cost = this.fibonacci(currentLevel + 1);
                        console.log(`MAX_HEALTH: уровень ${currentLevel}, стоимость ${cost}`);
                        return cost;
                    }
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.DEFENSE, {
                skillType: SkillType.DEFENSE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.HEALTH_REGEN, {
                skillType: SkillType.HEALTH_REGEN,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.DAMAGE, {
                skillType: SkillType.DAMAGE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.COIN_REWARD, {
                skillType: SkillType.COIN_REWARD,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.ATTACK_SPEED, {
                skillType: SkillType.ATTACK_SPEED,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.ATTACK_RANGE, {
                skillType: SkillType.ATTACK_RANGE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.KNOCKBACK, {
                skillType: SkillType.KNOCKBACK,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.MULTISHOT, {
                skillType: SkillType.MULTISHOT,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.CRIT_CHANCE, {
                skillType: SkillType.CRIT_CHANCE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.CRIT_MULTIPLIER, {
                skillType: SkillType.CRIT_MULTIPLIER,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.LIFESTEAL_CHANCE, {
                skillType: SkillType.LIFESTEAL_CHANCE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.LIFESTEAL_AMOUNT, {
                skillType: SkillType.LIFESTEAL_AMOUNT,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.DAILY_GOLD, {
                skillType: SkillType.DAILY_GOLD,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.EMBLEM_BONUS, {
                skillType: SkillType.EMBLEM_BONUS,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.FREE_UPGRADE, {
                skillType: SkillType.FREE_UPGRADE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.SUPPLY_DROP, {
                skillType: SkillType.SUPPLY_DROP,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.GAME_SPEED, {
                skillType: SkillType.GAME_SPEED,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.fibonacci(currentLevel + 1) / 2)
                }
            }]
        ]);
    }

    // Getters for skill information

    getAvailableSkills(): SkillInfo[] {
        return Array.from(this.skills.values());
    }

    // Метод для обратной совместимости
    getUpgradeCost(type: SkillType, currencyType: CurrencyType = CurrencyType.GOLD): number {
        console.log(`getUpgradeCost вызван для ${type}. Используйте getSkillCost вместо этого метода`);
        return this.getSkillCost(type, currencyType);
    }

    getSkillsForCurrency(currencyType: CurrencyType): SkillInfo[] {
        return Array.from(this.prices.entries())
            .filter(([_, price]) => price.goldCost.calculateCost(0) || price.emblemsCost.calculateCost(0))
            .map(([type, _]) => this.skills.get(type)!)
            .filter(skill => skill !== undefined);
    }

    getSkillCost(type: SkillType, currencyType: CurrencyType = CurrencyType.GOLD): number {
        const price = this.prices.get(type);
        const skill = this.skills.get(type);
        if (!price || !skill) return 0;
        
        // Вычисляем цену по последовательности Фибоначчи
        const cost = currencyType === CurrencyType.GOLD 
            ? price.goldCost.calculateCost(skill.currentLevel)
            : price.emblemsCost.calculateCost(skill.currentLevel);
        
        console.log(`[UpgradeManager] Расчет стоимости для ${type}:
            - Уровень: ${skill.currentLevel}
            - Валюта: ${currencyType}
            - Стоимость (Фибоначчи): ${cost}`);
        
        return cost;
    }

    getSkillValue(type: SkillType): number {
        const skill = this.skills.get(type);
        if (!skill) return 0;
        return skill.calculateValue(skill.currentLevel);
    }

    getSkillLevel(type: SkillType): number {
        const skill = this.skills.get(type);
        if (!skill) return 0;
        return skill.currentLevel;
    }

    // Currency management methods

    private getPlayerGold(): number {
        const gameScene = this.scene.scene.get('GameScene');
        return (gameScene as any).goldManager?.gold_count || 0;
    }

    private getPlayerEmblems(): number {
        const gameScene = this.scene.scene.get('GameScene');
        return (gameScene as any).emblemManager?.getEmblemCount() || 0;
    }

    private getCurrencyAmount(currencyType: CurrencyType): number {
        switch (currencyType) {
            case CurrencyType.GOLD:
                return this.getPlayerGold();
            case CurrencyType.EMBLEMS:
                return this.getPlayerEmblems();
            default:
                return 0;
        }
    }

    private deductCurrency(currencyType: CurrencyType, amount: number): void {
        const gameScene = this.scene.scene.get('GameScene');
        if (!gameScene) return;

        switch (currencyType) {
            case CurrencyType.GOLD:
                if ((gameScene as any).goldManager) {
                    (gameScene as any).goldManager.gold_count -= amount;
                    gameScene.events.emit('updateGold', (gameScene as any).goldManager.gold_count);
                    console.log(`Вычтено ${amount} золота, осталось: ${(gameScene as any).goldManager.gold_count}`);
                }
                break;
            case CurrencyType.EMBLEMS:
                if ((gameScene as any).emblemManager) {
                    (gameScene as any).emblemManager.deductEmblems(amount);
                    gameScene.events.emit('updateEmblems', (gameScene as any).emblemManager.getEmblemCount());
                }
                break;
        }
    }

    // Purchase logic

    canAffordUpgrade(type: SkillType, currencyType: CurrencyType): boolean {
        const skill = this.skills.get(type);
        if (!skill) return false;

        if (skill.currentLevel >= skill.maxLevel) {
            return false;
        }

        const cost = this.getSkillCost(type, currencyType);
        const currency = this.getCurrencyAmount(currencyType);
        return currency >= cost;
    }

    canAffordWithEitherCurrency(type: SkillType): { 
        gold: boolean, 
        emblems: boolean 
    } {
        return {
            gold: this.canAffordUpgrade(type, CurrencyType.GOLD),
            emblems: this.canAffordUpgrade(type, CurrencyType.EMBLEMS)
        };
    }

    purchaseUpgrade(type: SkillType, currencyType: CurrencyType): boolean {
        console.log(`Попытка купить навык ${type} за валюту ${currencyType}`);
        
        const skill = this.skills.get(type);
        if (!skill) {
            console.log(`Навык ${type} не найден`);
            return false;
        }

        // Check if already at max level
        if (skill.currentLevel >= skill.maxLevel) {
            console.log(`Навык ${type} уже на максимальном уровне ${skill.maxLevel}`);
            return false;
        }

        const cost = this.getSkillCost(type, currencyType);
        const availableCurrency = this.getCurrencyAmount(currencyType);
        
        console.log(`Стоимость: ${cost}, Доступно: ${availableCurrency}`);

        // Check for free upgrade chance
        const freeUpgradeChance = this.stateManager.getState(SkillType.FREE_UPGRADE) / 100;
        const isFreeUpgrade = type !== SkillType.FREE_UPGRADE && Math.random() < freeUpgradeChance;
        
        if (isFreeUpgrade) {
            console.log(`Бесплатное улучшение! Шанс: ${freeUpgradeChance * 100}%`);
        }

        if (availableCurrency >= cost || isFreeUpgrade) {
            // Deduct currency only if not a free upgrade
            if (!isFreeUpgrade) {
                console.log(`Списание ${cost} ${currencyType}`);
                this.deductCurrency(currencyType, cost);
            } else {
                // Show free upgrade notification
                this.showNotification('Free Upgrade!', 0x4CAF50);
            }

            // Increment level
            skill.currentLevel += 1;
            console.log(`Уровень навыка ${type} повышен до ${skill.currentLevel}`);
            
            // Calculate new value based on the level
            const newValue = skill.calculateValue(skill.currentLevel);
            console.log(`Новое значение навыка: ${newValue}`);
            
            // Save state to SkillStateManager with the current level
            this.stateManager.saveState(type, newValue, skill.currentLevel);

            // Apply the effects of the upgrade
            this.applyUpgradeEffects(type);

            // Check for supply drop chance
            this.checkForSupplyDrop();

            return true;
        }
        
        console.log(`Недостаточно ${currencyType} для покупки навыка ${type}`);
        return false;
    }

    private showNotification(message: string, color: number): void {
        const gameScene = this.scene.scene.get('GameScene');
        if ((gameScene as any).uiManager && (gameScene as any).uiManager.showNotification) {
            (gameScene as any).uiManager.showNotification(message, color);
        }
    }

    private checkForSupplyDrop(): void {
        const supplyDropChance = this.stateManager.getState(SkillType.SUPPLY_DROP) / 100;
        if (supplyDropChance > 0 && Math.random() < supplyDropChance) {
            const gameScene = this.scene.scene.get('GameScene');
            gameScene.events.emit('triggerSupplyDrop');
            this.showNotification('Supply Drop!', 0xFFD700);
        }
    }

    // Apply upgrade effects

    private applyUpgradeEffects(type: SkillType): void {
        const skill = this.skills.get(type);
        if (!skill) return;

        const gameScene = this.scene.scene.get('GameScene') as IGameScene;
        if (!gameScene || !gameScene.tower) return;

        const tower = gameScene.tower;
        const newValue = this.getSkillValue(type);

        switch (type) {
            case SkillType.MAX_HEALTH:
                tower.maxHealth = newValue;
                tower.health = tower.maxHealth;
                break;
            case SkillType.DEFENSE:
                tower.defense = newValue;
                break;
            case SkillType.HEALTH_REGEN:
                tower.regeneration = newValue;
                break;
            case SkillType.DAMAGE:
                // Using SkillStateManager, nothing to do here
                break;
            case SkillType.COIN_REWARD:
                if (gameScene) {
                    (gameScene as any).goldRewardMultiplier = newValue;
                }
                break;
            case SkillType.ATTACK_SPEED:
                if (gameScene) {
                    (gameScene as any).attackSpeedMultiplier = newValue;
                }
                break;
            case SkillType.ATTACK_RANGE:
                tower.upgrade();
                break;
            case SkillType.KNOCKBACK:
                // Value already saved to SkillStateManager
                break;
            case SkillType.MULTISHOT:
                // Value already saved to SkillStateManager
                break;
            case SkillType.CRIT_CHANCE:
                // Value already saved to SkillStateManager
                break;
            case SkillType.CRIT_MULTIPLIER:
                // Value already saved to SkillStateManager
                break;
            case SkillType.LIFESTEAL_CHANCE:
                // Value already saved to SkillStateManager
                break;
            case SkillType.LIFESTEAL_AMOUNT:
                // Value already saved to SkillStateManager
                break;
            case SkillType.DAILY_GOLD:
                // Value already saved to SkillStateManager
                break;
            case SkillType.EMBLEM_BONUS:
                // Value already saved to SkillStateManager
                break;
            case SkillType.FREE_UPGRADE:
                // Value already saved to SkillStateManager
                break;
            case SkillType.SUPPLY_DROP:
                // Value already saved to SkillStateManager
                break;
            case SkillType.GAME_SPEED:
                // Update game speed and emit event for other components
                gameScene.events.emit('gameSpeedChanged', newValue);
                break;
        }

        tower.updateHealthBar();
    }

    // Helper method to get current skill value
    getState(type: SkillType): number {
        return this.stateManager.getState(type);
    }
}

export default UpgradeManager; 
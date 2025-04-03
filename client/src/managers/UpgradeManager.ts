import { SkillType, SkillInfo, CurrencyType, SkillPrice } from '../types/SkillType';
import { SkillStateManager } from './SkillStateManager';
import { IScene } from '../types/IScene';
import { IGameScene } from '../types/IGameScene';
import { SkillDefinitions } from '../definitions/SkillDefinitions';

export class UpgradeManager {
    private scene: IScene;
    private stateManager: SkillStateManager;

    constructor(scene: IScene) {
        this.scene = scene;
        this.stateManager = SkillStateManager.getInstance();
        this.stateManager.initialize();

        // Initialize skill definitions and prices
        this.initializeSkills();
        this.initializePrices();
    }

    // Initialize skill information
    private initializeSkills(): void {
        const skillsState = this.stateManager.getAllStates();
        
        // Создаем Map с ключами SkillType и значениями number для текущих уровней
        const currentLevels = new Map<SkillType, number>();
        
        // Заполняем Map текущими уровнями из загруженного состояния
        Array.from(skillsState.entries()).forEach(([type, state]) => {
            currentLevels.set(type, state.currentLevel);
        });
        
        // Получаем определения навыков из статического класса и обновляем состояние в stateManager
        SkillDefinitions.getSkillDefinitions(currentLevels);
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
        // Получаем определения цен из статического класса
        SkillDefinitions.getPriceDefinitions();
    }

    // Getters for skill information

    getAvailableSkills(): SkillInfo[] {
        const skillsState = this.stateManager.getAllStates();
        const currentLevels = new Map<SkillType, number>();
        
        Array.from(skillsState.entries()).forEach(([type, state]) => {
            currentLevels.set(type, state.currentLevel);
        });
        
        return Array.from(SkillDefinitions.getSkillDefinitions(currentLevels).values());
    }

    // Метод для обратной совместимости
    getUpgradeCost(type: SkillType, currencyType: CurrencyType = CurrencyType.GOLD): number {
        return this.getSkillCost(type, currencyType);
    }

    getSkillsForCurrency(currencyType: CurrencyType): SkillInfo[] {
        const prices = SkillDefinitions.getPriceDefinitions();
        const skillsState = this.stateManager.getAllStates();
        const currentLevels = new Map<SkillType, number>();
        
        Array.from(skillsState.entries()).forEach(([type, state]) => {
            currentLevels.set(type, state.currentLevel);
        });
        
        const skills = SkillDefinitions.getSkillDefinitions(currentLevels);
        
        return Array.from(prices.entries())
            .filter(([_, price]) => price.goldCost.calculateCost(0) || price.emblemsCost.calculateCost(0))
            .map(([type, _]) => skills.get(type)!)
            .filter(skill => skill !== undefined);
    }

    getSkillCost(type: SkillType, currencyType: CurrencyType = CurrencyType.GOLD): number {
        const prices = SkillDefinitions.getPriceDefinitions();
        const price = prices.get(type);
        if (!price) return 0;

        const skillsState = this.stateManager.getAllStates();
        const skillState = skillsState.get(type);
        if (!skillState) return 0;

        const currentLevel = skillState.currentLevel;
        const currentLevels = new Map<SkillType, number>();
        
        Array.from(skillsState.entries()).forEach(([t, state]) => {
            currentLevels.set(t, state.currentLevel);
        });
        
        const skills = SkillDefinitions.getSkillDefinitions(currentLevels);
        const skill = skills.get(type);
        if (!skill) return 0;
        
        const maxLevel = skill.maxLevel;

        if (currentLevel >= maxLevel) return 0;

        const cost = currencyType === CurrencyType.GOLD 
            ? price.goldCost.calculateCost(currentLevel)
            : price.emblemsCost.calculateCost(currentLevel);

        return cost;
    }

    getSkillValue(type: SkillType): number {
        const skillsState = this.stateManager.getAllStates();
        const skillState = skillsState.get(type);
        if (!skillState) return 0;
        
        const currentLevels = new Map<SkillType, number>();
        
        Array.from(skillsState.entries()).forEach(([t, state]) => {
            currentLevels.set(t, state.currentLevel);
        });
        
        const skills = SkillDefinitions.getSkillDefinitions(currentLevels);
        const skill = skills.get(type);
        
        if (!skill) return 0;
        return skill.calculateValue(skillState.currentLevel);
    }

    getSkillLevel(type: SkillType): number {
        const skillsState = this.stateManager.getAllStates();
        const skillState = skillsState.get(type);
        if (!skillState) return 0;
        return skillState.currentLevel;
    }

    // Currency management methods

    private getPlayerGold(): number {
        const gameScene = this.scene.scene.get('GameScene');
        return (gameScene as any).goldManager?.gold_count || 0;
    }

    private getPlayerEmblems(): number {
        try {
            const emblemManager = require('./EmblemManager').EmblemManager.getInstance();
            if (emblemManager) {
                return emblemManager.getEmblemCount();
            }
        } catch (error) {
            console.warn('Failed to get emblems from EmblemManager:', error);
        }
        
        return 0;
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
                }
                break;
            case CurrencyType.EMBLEMS:
                try {
                    const emblemManager = require('./EmblemManager').EmblemManager.getInstance();
                    if (emblemManager) {
                        emblemManager.deductEmblems(amount);
                        gameScene.events.emit('updateEmblems', emblemManager.getEmblemCount());
                    }
                } catch (error) {
                    console.warn('Failed to deduct emblems:', error);
                }
                break;
        }
    }

    // Purchase logic

    canAffordUpgrade(type: SkillType, currencyType: CurrencyType): boolean {
        const skillsState = this.stateManager.getAllStates();
        const skillState = skillsState.get(type);
        if (!skillState) return false;
        
        const currentLevels = new Map<SkillType, number>();
        
        Array.from(skillsState.entries()).forEach(([t, state]) => {
            currentLevels.set(t, state.currentLevel);
        });
        
        const skills = SkillDefinitions.getSkillDefinitions(currentLevels);
        const skill = skills.get(type);
        
        if (!skill) return false;

        if (skillState.currentLevel >= skill.maxLevel) {
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
        
        const skillsState = this.stateManager.getAllStates();
        const skillState = skillsState.get(type);
        if (!skillState) {
            console.log(`Навык ${type} не найден`);
            return false;
        }
        
        const currentLevels = new Map<SkillType, number>();
        
        Array.from(skillsState.entries()).forEach(([t, state]) => {
            currentLevels.set(t, state.currentLevel);
        });
        
        const skills = SkillDefinitions.getSkillDefinitions(currentLevels);
        const skill = skills.get(type);
        
        if (!skill) {
            console.log(`Навык ${type} не найден в определениях`);
            return false;
        }

        // Check if already at max level
        if (skillState.currentLevel >= skill.maxLevel) {
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
            skillState.currentLevel += 1;
            console.log(`Уровень навыка ${type} повышен до ${skillState.currentLevel}`);
            
            // Calculate new value based on the level
            const newValue = skill.calculateValue(skillState.currentLevel);
            console.log(`Новое значение навыка: ${newValue}`);
            
            // Save state to SkillStateManager with the current level
            this.stateManager.saveState(type, newValue, skillState.currentLevel);

            // Sync with server if purchased with emblems
            if (currencyType === CurrencyType.EMBLEMS) {
                console.log(`Отправка навыка ${type} на сервер после покупки`);
                this.stateManager.syncSkillWithServer(type);
            }

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
        const skillsState = this.stateManager.getAllStates();
        const currentLevels = new Map<SkillType, number>();
        
        Array.from(skillsState.entries()).forEach(([t, state]) => {
            currentLevels.set(t, state.currentLevel);
        });
        
        const skills = SkillDefinitions.getSkillDefinitions(currentLevels);
        const skill = skills.get(type);
        
        if (!skill) return;

        const gameScene = this.scene.scene.get('GameScene') as IGameScene;
        if (!gameScene || !gameScene.tower) return;

        const tower = gameScene.tower;
        const newValue = this.getSkillValue(type);

        switch (type) {
            case SkillType.MAX_HEALTH:
                // Instead of setting tower.maxHealth directly, we'll save to SkillStateManager
                // When tower needs maxHealth, it will get it from SkillStateManager
                this.stateManager.saveState(SkillType.MAX_HEALTH, newValue, skill.currentLevel);
                break;
            case SkillType.DEFENSE:
                // Instead of setting tower.defense directly, we'll save to SkillStateManager  
                this.stateManager.saveState(SkillType.DEFENSE, newValue, skill.currentLevel);
                break;
            case SkillType.HEALTH_REGEN:
                // Instead of setting tower.regeneration directly, we'll save to SkillStateManager
                this.stateManager.saveState(SkillType.HEALTH_REGEN, newValue, skill.currentLevel);
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
                // Update the skill value in storage
                const currentSkills = this.stateManager.getAllStates();
                const attackRangeSkill = currentSkills.get(SkillType.ATTACK_RANGE);
                if (attackRangeSkill) {
                    // Update both value and level
                    attackRangeSkill.value = newValue;
                    attackRangeSkill.currentLevel = skill.currentLevel;
                    attackRangeSkill.lastUpdated = new Date();
                    this.stateManager.saveState(SkillType.ATTACK_RANGE, newValue, skill.currentLevel);
                    console.log(`Updated attack range skill: value=${newValue}, level=${skill.currentLevel}`);
                } else {
                    // If skill doesn't exist in storage, create it
                    this.stateManager.saveState(SkillType.ATTACK_RANGE, newValue, skill.currentLevel);
                }
                // Force the tower to update its attack range circle
                if (gameScene) {
                    console.log('Emitting tower-force-attack-circle event');
                    gameScene.events.emit('tower-force-attack-circle');
                }
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

    // Метод для полного сброса и переинициализации менеджера при начале новой игры
    public reset(): void {
        // Пересоздаем все внутренние данные
        this.initializeSkills();
        this.initializePrices();
        
        console.log('[UpgradeManager] Reset complete');
    }

    // Метод для очистки ресурсов
    public destroy(): void {
        // Сбрасываем ссылки на объекты
        // @ts-ignore - Обнуляем ссылки для предотвращения утечек памяти
        this.scene = null;
        
        console.log('[UpgradeManager] Resources cleaned up');
    }
}

export default UpgradeManager; 
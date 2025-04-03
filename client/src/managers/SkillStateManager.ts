import { SkillType } from '../types/SkillType';
import { ISkillState } from '../types/ISkillState';
import { SkillSetStorage } from '../storage/SkillSetStorage';
import { InitialSkillService } from '../services/InitialSkillService';
import { SkillDefinitions } from '../definitions/SkillDefinitions';

export class SkillStateManager {
    private static instance: SkillStateManager;
    private state: Map<SkillType, ISkillState>;
    private storage: SkillSetStorage;
    private InitialSkillService: InitialSkillService | null = null;
    private currentTowerHealth: number = 0;
    private lastRegenerationTime: number = 0;
    private InitialSkillTypes: Set<SkillType> = new Set([
        SkillType.EMBLEM_BONUS,
        SkillType.DAMAGE,
        SkillType.ATTACK_SPEED,
        SkillType.ATTACK_RANGE,
        SkillType.MULTISHOT,
        SkillType.CRIT_CHANCE,
        SkillType.CRIT_MULTIPLIER,
        SkillType.MAX_HEALTH,
        SkillType.DEFENSE,
        SkillType.HEALTH_REGEN,
        SkillType.KNOCKBACK,
        SkillType.LIFESTEAL_AMOUNT,
        SkillType.LIFESTEAL_CHANCE,
        SkillType.COIN_REWARD,
        SkillType.DAILY_GOLD,
        SkillType.FREE_UPGRADE,
        SkillType.SUPPLY_DROP,
        SkillType.GAME_SPEED
    ]);
    
    private constructor() {
        this.storage = SkillSetStorage.getInstance();
        this.state = new Map();

    }
    
    // Lazy accessor for InitialSkillService to avoid circular dependency
    private getInitialSkillService(): InitialSkillService {
        if (!this.InitialSkillService) {
            this.InitialSkillService = InitialSkillService.getInstance();
        }
        return this.InitialSkillService;
    }
    
    public static getInstance(): SkillStateManager {
        if (!SkillStateManager.instance) {
            SkillStateManager.instance = new SkillStateManager();
        }
        return SkillStateManager.instance;
    }
    
    // Инициализация при старте игры
    public initialize(): void {
        // Пересоздаем хранилище в начале игры
        this.storage = SkillSetStorage.recreate();
        
        // Инициализируем пустое состояние
        this.state = new Map();
        
        // Пытаемся получить данные с сервера
        const success = this.initializeFromServer();
        
        // Если не удалось получить данные с сервера, устанавливаем базовые уровни
        if (!success) {
            this.initializeDefaultLevels();
        }
        
        // Сохраняем начальное состояние
        this.storage.save(this.state);
    }
    
    // Инициализация перманентных скиллов с сервера
    public initializeFromServer(): boolean {
        const InitialService = this.getInitialSkillService();
        if (InitialService.isConnected()) {
            let hasAnySkills = false;
            
            this.InitialSkillTypes.forEach(skillType => {
                const level = InitialService.getSkillLevel(skillType);
                if (level > 0) {
                    hasAnySkills = true;
                }
                this.state.set(skillType, {
                    type: skillType,
                    value: SkillDefinitions.getSkillDefinitions().get(skillType)?.calculateValue(level) || 0,
                    currentLevel: level,
                    lastUpdated: new Date()
                });
            });
            
            return hasAnySkills;
        }
        
        return false;
    }
    
    // Инициализация базовых уровней навыков
    private initializeDefaultLevels(): void {
        // Устанавливаем базовый уровень = 1 для всех перманентных навыков
        this.InitialSkillTypes.forEach(skillType => {
            const defaultLevel = 0;
            // Получаем определения скиллов из SkillDefinitions
            const skillInfo = SkillDefinitions.getSkillDefinitions().get(skillType);
            const defaultValue = skillInfo ? skillInfo.calculateValue(defaultLevel) : defaultLevel;
            
            this.state.set(skillType, {
                type: skillType,
                value: defaultValue,
                currentLevel: defaultLevel,
                lastUpdated: new Date()
            });
        });
    }
    
    // Сброс всех навыков кроме перманентных (вызывать при проигрыше)
    public tryResetToTheServer(): void {
        // Пересоздаем хранилище для следующей игры
        this.storage = SkillSetStorage.recreate();
        
        // Временное хранилище для перманентных навыков
        const InitialSkills = new Map<SkillType, ISkillState>();
        
        // Сохраняем только перманентные навыки
        this.InitialSkillTypes.forEach(skillType => {
            const InitialService = this.getInitialSkillService();
            
            if (InitialService.isConnected()) {
                // Если подключены к серверу, берем уровень оттуда
                const serverLevel = InitialService.getSkillLevel(skillType);
                InitialSkills.set(skillType, {
                    type: skillType,
                    value: SkillDefinitions.getSkillDefinitions().get(skillType)?.calculateValue(serverLevel) || 0,
                    currentLevel: serverLevel,
                    lastUpdated: new Date()
                });
            } else {
                InitialSkills.set(skillType, {
                    type: skillType,
                    value: SkillDefinitions.getSkillDefinitions().get(skillType)?.calculateValue(0) || 0,
                    currentLevel: 0,
                    lastUpdated: new Date()
                });
            }
        });
        
        // Очищаем все навыки
        this.state.clear();
        
        // Восстанавливаем перманентные навыки
        InitialSkills.forEach((skill, type) => {
            this.state.set(type, skill);
        });
        
        // Сохраняем состояние в новом хранилище
        this.storage.save(this.state);
        
        console.log('Skill states reset on game over. Initial skills preserved.');
    }
    
    // Сохранение состояния
    public saveState(type: SkillType, value: number, level: number = 0): void {
        // Get the existing state or create a new one
        const existingState = this.state.get(type);
        const currentLevel = level > 0 ? level : (existingState?.currentLevel || 0) + 1;
        
        this.state.set(type, {
            type,
            value: SkillDefinitions.getSkillDefinitions().get(type)?.calculateValue(currentLevel) || 0,
            currentLevel,
            lastUpdated: new Date()
        });
        
        // Save to storage
        this.storage.save(this.state);
    }
    
    // Получение состояния
    public getState(type: SkillType): number {
        return this.state.get(type)?.value || 0;
    }
    
    // Получение уровня навыка
    public getSkillLevel(type: SkillType): number {
        return this.state.get(type)?.currentLevel || 0;
    }
    
    // Получение всех состояний
    public getAllStates(): Map<SkillType, ISkillState> {
        return new Map(this.state);
    }
    
    // Получение текущего множителя скорости игры
    public getGameSpeed(): number {
        return this.getState(SkillType.GAME_SPEED) || 1; // По умолчанию 1, если не установлено
    }
    
    // Helper to check if skill is Initial
    private isInitialSkill(type: SkillType): boolean {
        return this.InitialSkillTypes.has(type);
    }
    
    // Синхронизация навыка с сервером
    public syncSkillWithServer(type: SkillType): void {
        // Проверяем, является ли навык перманентным
        if (!this.isInitialSkill(type)) {
            return;
        }
        
        // Получаем текущий уровень навыка
        const skillState = this.state.get(type);
        if (!skillState) {
            return;
        }
        
        // Отправляем на сервер
        const InitialService = this.getInitialSkillService();
        if (InitialService.isConnected()) {
            console.log(`Синхронизация навыка ${type} уровня ${skillState.currentLevel} с сервером`);
            InitialService.updateSkill(type, skillState.currentLevel);
        }
    }
    
    // Centralized Health Management Methods
    
    // Initialize tower health at the start of the game
    public initializeHealth(): number {
        const maxHealth = this.getState(SkillType.MAX_HEALTH) || 200;
        this.currentTowerHealth = maxHealth;
        return maxHealth;
    }
    
    // Get current tower health
    public getCurrentHealth(): number {
        return this.currentTowerHealth;
    }
    
    // Get max tower health
    public getMaxHealth(): number {
        return this.getState(SkillType.MAX_HEALTH) || 200;
    }
    
    // Apply damage to tower, accounting for defense
    public applyDamage(amount: number): number {
        const defense = this.getState(SkillType.DEFENSE) || 0;
        const reducedAmount = amount * (1 - (defense / 100));
        this.currentTowerHealth = Math.max(0, this.currentTowerHealth - reducedAmount);
        return this.currentTowerHealth;
    }
    
    // Heal tower by amount (used for regeneration and lifesteal)
    public healTower(amount: number): number {
        const maxHealth = this.getMaxHealth();
        this.currentTowerHealth = Math.min(this.currentTowerHealth + amount, maxHealth);
        return this.currentTowerHealth;
    }
    
    // Process health regeneration based on delta time and game speed
    public processRegeneration(deltaTime: number): number {
        const regenerationValue = this.getState(SkillType.HEALTH_REGEN) || 0;
        if (regenerationValue <= 0) return this.currentTowerHealth;
        
        const gameSpeed = this.getGameSpeed();
        // Apply regeneration based on time passed and game speed
        // regenerationValue is per second, so we multiply by deltaTime in seconds and gameSpeed
        const healAmount = regenerationValue * (deltaTime / 1000) * gameSpeed;
        
        return this.healTower(healAmount);
    }
    
    // Reset health to max (for new game or respawn)
    public resetHealthToMax(): number {
        this.currentTowerHealth = this.getMaxHealth();
        return this.currentTowerHealth;
    }
} 
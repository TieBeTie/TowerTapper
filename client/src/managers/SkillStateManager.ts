import { SkillType } from '../types/SkillType';
import { ISkillState } from '../types/ISkillState';
import { SkillSetStorage } from '../storage/SkillSetStorage';
import { PermanentSkillService } from '../services/PermanentSkillService';

export class SkillStateManager {
    private static instance: SkillStateManager;
    private state: Map<SkillType, ISkillState>;
    private storage: SkillSetStorage;
    private permanentSkillService: PermanentSkillService | null = null;
    private permanentSkillTypes: Set<SkillType> = new Set([
        SkillType.EMBLEM_BONUS,
        // Add other permanent skills here as they are implemented
    ]);
    
    private constructor() {
        this.storage = SkillSetStorage.getInstance();
        this.state = new Map();
    }
    
    // Lazy accessor for permanentSkillService to avoid circular dependency
    private getPermanentSkillService(): PermanentSkillService {
        if (!this.permanentSkillService) {
            this.permanentSkillService = PermanentSkillService.getInstance();
        }
        return this.permanentSkillService;
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
        const permanentService = this.getPermanentSkillService();
        if (permanentService.isConnected()) {
            let hasAnySkills = false;
            
            this.permanentSkillTypes.forEach(skillType => {
                const level = permanentService.getSkillLevel(skillType);
                if (level > 0) {
                    hasAnySkills = true;
                    const value = level; // Простая формула для значения, можно настроить по необходимости
                    this.state.set(skillType, {
                        type: skillType,
                        value,
                        currentLevel: level,
                        lastUpdated: new Date()
                    });
                }
            });
            
            return hasAnySkills;
        }
        
        return false;
    }
    
    // Инициализация базовых уровней навыков
    private initializeDefaultLevels(): void {
        // Устанавливаем базовый уровень = 1 для всех перманентных навыков
        this.permanentSkillTypes.forEach(skillType => {
            const defaultLevel = 1;
            const defaultValue = 1; // Можно настроить базовое значение по необходимости
            
            this.state.set(skillType, {
                type: skillType,
                value: defaultValue,
                currentLevel: defaultLevel,
                lastUpdated: new Date()
            });
        });
    }
    
    // Сброс всех навыков кроме перманентных (вызывать при проигрыше)
    public resetOnGameOver(): void {
        // Пересоздаем хранилище для следующей игры
        this.storage = SkillSetStorage.recreate();
        
        // Временное хранилище для перманентных навыков
        const permanentSkills = new Map<SkillType, ISkillState>();
        
        // Сохраняем только перманентные навыки
        this.permanentSkillTypes.forEach(skillType => {
            const permanentService = this.getPermanentSkillService();
            
            if (permanentService.isConnected()) {
                // Если подключены к серверу, берем уровень оттуда
                const serverLevel = permanentService.getSkillLevel(skillType);
                if (serverLevel > 0) {
                    const value = serverLevel; // Простая формула для значения, можно настроить по необходимости
                    permanentSkills.set(skillType, {
                        type: skillType,
                        value,
                        currentLevel: serverLevel,
                        lastUpdated: new Date()
                    });
                }
            } else {
                // Если нет соединения с сервером, устанавливаем базовый уровень 1
                permanentSkills.set(skillType, {
                    type: skillType,
                    value: 1,
                    currentLevel: 1,
                    lastUpdated: new Date()
                });
            }
        });
        
        // Очищаем все навыки
        this.state.clear();
        
        // Восстанавливаем перманентные навыки
        permanentSkills.forEach((skill, type) => {
            this.state.set(type, skill);
        });
        
        // Сохраняем состояние в новом хранилище
        this.storage.save(this.state);
        
        console.log('Skill states reset on game over. Permanent skills preserved.');
    }
    
    // Сохранение состояния
    public saveState(type: SkillType, value: number, level: number = 0): void {
        // Get the existing state or create a new one
        const existingState = this.state.get(type);
        const currentLevel = level > 0 ? level : (existingState?.currentLevel || 0) + 1;
        
        this.state.set(type, {
            type,
            value,
            currentLevel,
            lastUpdated: new Date()
        });
        
        // Save to storage
        this.storage.save(this.state);
        
        // If this is a permanent skill and we're connected to the server,
        // update it there as well
        const permanentService = this.getPermanentSkillService();
        if (this.isPermanentSkill(type) && permanentService.isConnected()) {
            permanentService.updateSkill(type, currentLevel);
        }
    }
    
    // Получение состояния
    public getState(type: SkillType): number {
        const permanentService = this.getPermanentSkillService();
        // For permanent skills, prefer server value if connected, but only if it's greater than 0
        if (this.isPermanentSkill(type) && permanentService.isConnected()) {
            const serverValue = permanentService.getSkillLevel(type);
            if (serverValue > 0) {
                return serverValue;
            }
        }
        
        // Otherwise fall back to local state
        return this.state.get(type)?.value || 0;
    }
    
    // Получение уровня навыка
    public getSkillLevel(type: SkillType): number {
        const permanentService = this.getPermanentSkillService();
        // For permanent skills, prefer server value if connected
        if (this.isPermanentSkill(type) && permanentService.isConnected()) {
            return permanentService.getSkillLevel(type);
        }
        
        return this.state.get(type)?.currentLevel || 0;
    }
    
    // Получение всех состояний
    public getAllStates(): Map<SkillType, ISkillState> {
        const result = new Map(this.state);
        
        const permanentService = this.getPermanentSkillService();
        // If connected to server, update permanent skill values from there
        if (permanentService.isConnected()) {
            this.permanentSkillTypes.forEach(skillType => {
                const level = permanentService.getSkillLevel(skillType);
                const existingState = result.get(skillType);
                
                if (existingState) {
                    existingState.currentLevel = level;
                    // We might need additional logic to set the value based on level
                } else if (level > 0) {
                    // Create a new state if it doesn't exist but the server has it
                    result.set(skillType, {
                        type: skillType,
                        value: level, // Simple mapping for now, might need custom logic per skill
                        currentLevel: level,
                        lastUpdated: new Date()
                    });
                }
            });
        }
        
        return result;
    }
    
    // Получение текущего множителя скорости игры
    public getGameSpeed(): number {
        return this.getState(SkillType.GAME_SPEED) || 1; // По умолчанию 1, если не установлено
    }
    
    // Helper to check if skill is permanent
    private isPermanentSkill(type: SkillType): boolean {
        return this.permanentSkillTypes.has(type);
    }
} 
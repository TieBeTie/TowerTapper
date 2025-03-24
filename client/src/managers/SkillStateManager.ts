import { SkillType } from '../types/SkillType';
import { ISkillState } from '../types/ISkillState';
import { SkillSetStorage } from '../storage/SkillSetStorage';

export class SkillStateManager {
    private static instance: SkillStateManager;
    private state: Map<SkillType, ISkillState>;
    private storage: SkillSetStorage;
    
    private constructor() {
        this.storage = SkillSetStorage.getInstance();
        this.state = new Map();
    }
    
    public static getInstance(): SkillStateManager {
        if (!SkillStateManager.instance) {
            SkillStateManager.instance = new SkillStateManager();
        }
        return SkillStateManager.instance;
    }
    
    // Инициализация при старте игры
    public initialize(): void {
        this.state = this.storage.load();
    }
    
    // Сохранение состояния
    public saveState(type: SkillType, value: number): void {
        this.state.set(type, {
            type,
            value,
            lastUpdated: new Date()
        });
        
        // Сохраняем в хранилище
        this.storage.save(this.state);
    }
    
    // Получение состояния
    public getState(type: SkillType): number {
        return this.state.get(type)?.value || 0;
    }
    
    // Получение всех состояний
    public getAllStates(): Map<SkillType, ISkillState> {
        return new Map(this.state);
    }
} 
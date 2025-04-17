import { SkillType } from '../types/SkillType';
import { ISkillState } from '../types/ISkillState';

export class SkillSetStorage {
    private static instance: SkillSetStorage;
    private states: Map<SkillType, ISkillState> = new Map();
    
    private constructor() {}
    
    public static getInstance(): SkillSetStorage {
        if (!SkillSetStorage.instance) {
            SkillSetStorage.instance = new SkillSetStorage();
        }
        return SkillSetStorage.instance;
    }
    
    // Метод для пересоздания инстанса хранилища
    public static recreate(): SkillSetStorage {
        SkillSetStorage.instance = new SkillSetStorage();
        return SkillSetStorage.instance;
    }
    
    save(states: Map<SkillType, ISkillState>): void {
        this.states = new Map(states);
        // Не сохраняем в localStorage, чтобы данные не сохранялись между сессиями
    }
    
    load(): Map<SkillType, ISkillState> {
        return this.states;
    }

    clear(): void {
        this.states.clear();
    }
} 
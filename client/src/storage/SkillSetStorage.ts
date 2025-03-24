import { SkillType } from '../types/SkillType';
import { ISkillState } from '../types/ISkillState';

export class SkillSetStorage {
    private readonly STORAGE_KEY = 'upgrade_states';
    
    save(states: Map<SkillType, ISkillState>): void {
        const data = Array.from(states.entries());
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
    
    load(): Map<SkillType, ISkillState> {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return new Map();
        
        const entries = JSON.parse(data);
        return new Map(entries);
    }
} 
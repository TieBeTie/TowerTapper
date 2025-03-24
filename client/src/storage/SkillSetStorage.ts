import { SkillType } from '../types/SkillType';
import { ISkillState } from '../types/ISkillState';

export class SkillSetStorage {
    private states: Map<SkillType, ISkillState> = new Map();
    
    save(states: Map<SkillType, ISkillState>): void {
        this.states = new Map(states);
    }
    
    load(): Map<SkillType, ISkillState> {
        return this.states;
    }

    clear(): void {
        this.states.clear();
    }
} 
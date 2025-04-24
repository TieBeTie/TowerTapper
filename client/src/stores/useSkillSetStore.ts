import { defineStore } from 'pinia';
import { SkillType } from '../game/types/SkillType';
import { ISkillState } from '../game/types/ISkillState';

interface SkillSetState {
  skills: Map<SkillType, ISkillState>;
}

export const useSkillSetStore = defineStore('skillSet', {
  state: (): SkillSetState => ({
    skills: new Map<SkillType, ISkillState>(),
  }),
  
  actions: {
    /**
     * Save skill states to the store
     * @param states Map of skill states to save
     */
    save(states: Map<SkillType, ISkillState>): void {
      this.skills = new Map(states);
    },
    
    /**
     * Load skill states from the store
     * @returns Map of skill states
     */
    load(): Map<SkillType, ISkillState> {
      return this.skills;
    },
    
    /**
     * Clear all skill states from the store
     */
    clear(): void {
      this.skills.clear();
    },
    
    /**
     * Recreate the store (equivalent to the singleton's recreate method)
     */
    recreate(): void {
      this.skills = new Map<SkillType, ISkillState>();
    }
  }
}); 
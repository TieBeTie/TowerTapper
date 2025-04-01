import { SkillType } from './SkillType';

export interface ISkillState {
    type: SkillType;
    lastUpdated: Date;
    currentLevel: number;
    value: number;
} 
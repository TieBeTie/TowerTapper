import { SkillType } from './SkillType';

export interface ISkillState {
    type: SkillType;
    lastUpdated: Date;
    currentLevel: number;
    initialLevel?: number;
    value: number;
} 
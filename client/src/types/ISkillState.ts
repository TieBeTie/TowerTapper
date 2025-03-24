import { SkillType } from './SkillType';

export interface ISkillState {
    type: SkillType;
    value: number;
    lastUpdated: Date;
} 
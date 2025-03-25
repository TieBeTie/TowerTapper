export enum SkillType {
    MAX_HEALTH = 'MAX_HEALTH',
    DEFENSE = 'DEFENSE',
    HEALTH_REGEN = 'HEALTH_REGEN',
    DAMAGE = 'DAMAGE',
    COIN_REWARD = 'COIN_REWARD',
    ATTACK_SPEED = 'ATTACK_SPEED'
}

export interface Upgrade {
    type: SkillType;
    name: string;
    description: string;
    cost: number;
    currentValue: number;
    maxValue: number;
    calculateNextValue: (currentValue: number) => number;
    calculateCost: (currentValue: number) => number;
}

export interface UpgradeState {
    [SkillType.MAX_HEALTH]: number;
    [SkillType.DEFENSE]: number;
    [SkillType.HEALTH_REGEN]: number;
    [SkillType.DAMAGE]: number;
    [SkillType.COIN_REWARD]: number;
    [SkillType.ATTACK_SPEED]: number;
} 
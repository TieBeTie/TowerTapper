export enum SkillType {
    MAX_HEALTH = 'MAX_HEALTH',
    DEFENSE = 'DEFENSE',
    HEALTH_REGEN = 'HEALTH_REGEN',
    DAMAGE = 'DAMAGE',
    COIN_REWARD = 'COIN_REWARD',
    ATTACK_SPEED = 'ATTACK_SPEED',
    ATTACK_RANGE = 'ATTACK_RANGE',
    MULTISHOT = 'MULTISHOT',
    CRIT_CHANCE = 'CRIT_CHANCE',
    CRIT_MULTIPLIER = 'CRIT_MULTIPLIER',
    KNOCKBACK = 'KNOCKBACK',
    LIFESTEAL_CHANCE = 'LIFESTEAL_CHANCE',
    LIFESTEAL_AMOUNT = 'LIFESTEAL_AMOUNT',
    DAILY_GOLD = 'DAILY_GOLD',
    EMBLEM_BONUS = 'EMBLEM_BONUS',
    FREE_UPGRADE = 'FREE_UPGRADE',
    SUPPLY_DROP = 'SUPPLY_DROP',
    GAME_SPEED = 'GAME_SPEED'
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
    [SkillType.ATTACK_RANGE]: number;
    [SkillType.MULTISHOT]: number;
    [SkillType.CRIT_CHANCE]: number;
    [SkillType.CRIT_MULTIPLIER]: number;
    [SkillType.KNOCKBACK]: number;
    [SkillType.LIFESTEAL_CHANCE]: number;
    [SkillType.LIFESTEAL_AMOUNT]: number;
    [SkillType.DAILY_GOLD]: number;
    [SkillType.EMBLEM_BONUS]: number;
    [SkillType.FREE_UPGRADE]: number;
    [SkillType.SUPPLY_DROP]: number;
    [SkillType.GAME_SPEED]: number;
} 
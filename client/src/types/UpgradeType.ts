export enum UpgradeType {
    HEALTH = 'health',
    DEFENSE = 'defense',
    REGENERATION = 'regeneration'
}

export interface Upgrade {
    type: UpgradeType;
    name: string;
    description: string;
    cost: number;
    level: number;
    maxLevel: number;
    baseEffect: number;
    effectMultiplier: number;
}

export interface UpgradeState {
    [UpgradeType.HEALTH]: number;
    [UpgradeType.DEFENSE]: number;
    [UpgradeType.REGENERATION]: number;
} 
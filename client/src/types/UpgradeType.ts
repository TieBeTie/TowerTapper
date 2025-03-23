export enum UpgradeType {
    HEALTH = 'HEALTH',
    DEFENSE = 'DEFENSE',
    REGENERATION = 'REGENERATION',
    DAMAGE = 'DAMAGE',
    COIN_REWARD = 'COIN_REWARD'
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
    [UpgradeType.DAMAGE]: number;
    [UpgradeType.COIN_REWARD]: number;
} 
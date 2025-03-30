export interface Emblem {
    id: string;
    name: string;
    description: string;
    rarity: EmblemRarity;
    bonusValue: number; // The value added to the emblem bonus
    imageKey?: string; // Optional image key for the emblem texture
    acquired: Date;
}

export enum EmblemRarity {
    COMMON = 'COMMON',
    UNCOMMON = 'UNCOMMON',
    RARE = 'RARE',
    EPIC = 'EPIC',
    LEGENDARY = 'LEGENDARY'
} 
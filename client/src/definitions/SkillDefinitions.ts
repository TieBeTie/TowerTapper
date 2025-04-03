import { SkillType, SkillInfo, SkillPrice, CurrencyType } from '../types/SkillType';

/**
 * Static class with skill definitions and prices
 * Centrally stores all information about skills
 */
export class SkillDefinitions {
    // Lookup tables for skill values at each level
    private static DAMAGE_VALUES = [3, 4.25, 6, 6.75, 8, 9.5, 11, 12.5, 14, 16, 18, 20];
    private static DAMAGE_COSTS = [5, 8, 12, 15, 19, 24, 30, 37, 45, 55, 66, 78];
    
    private static ATTACK_SPEED_VALUES = [2.50, 2.60, 2.70, 2.80, 2.90, 3.00, 3.10, 3.20, 3.30, 3.40, 3.50, 3.60];
    private static ATTACK_SPEED_COSTS = [5, 14, 25, 38, 52, 67, 83, 100, 118, 137, 157, 178];
    
    private static readonly BASE_ATTACK_RANGE_PERCENT = 0.25;
    private static ATTACK_RANGE_VALUES = [130, 134, 138, 142, 146, 150, 154, 158, 162, 166, 170, 174];
    private static ATTACK_RANGE_COSTS = [20, 27, 35, 44, 54, 65, 77, 90, 104, 119, 135, 152];
    
    private static CRIT_CHANCE_VALUES = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5];
    private static CRIT_CHANCE_COSTS = [5, 11, 17, 23, 29, 35, 41, 47, 53, 59, 65, 71];
    
    private static CRIT_MULTIPLIER_VALUES = [2, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0, 4.25, 4.5, 4.75];
    private static CRIT_MULTIPLIER_COSTS = [5, 26, 50, 77, 104, 133, 164, 197, 232, 269, 308, 349];
    
    private static MULTISHOT_VALUES = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5];
    private static MULTISHOT_COSTS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65];
    
    private static MAX_HEALTH_VALUES = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110];
    private static MAX_HEALTH_COSTS = [5, 12, 17, 23, 30, 35, 42, 49, 56, 63, 70, 77, 84];
    
    private static HEALTH_REGEN_VALUES = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6];
    private static HEALTH_REGEN_COSTS = [5, 14, 24, 31, 39, 48, 57, 66, 75, 84, 93, 102];
    
    private static DEFENSE_VALUES = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5];
    private static DEFENSE_COSTS = [5, 14, 23, 32, 41, 50, 59, 68, 77, 86, 95, 104];
    
    private static KNOCKBACK_VALUES = [1, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5];
    private static KNOCKBACK_COSTS = [15, 25, 37, 49, 61, 73, 85, 97, 109, 121, 133, 145];
    
    private static LIFESTEAL_CHANCE_VALUES = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5];
    private static LIFESTEAL_CHANCE_COSTS = [5, 14, 23, 32, 41, 50, 59, 68, 77, 86, 95, 104];
    
    private static LIFESTEAL_AMOUNT_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    private static LIFESTEAL_AMOUNT_COSTS = [10, 26, 42, 58, 74, 90, 106, 122, 138, 154, 170, 186];
    
    private static DAILY_GOLD_VALUES = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33];
    private static DAILY_GOLD_COSTS = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
    
    private static EMBLEM_BONUS_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    private static EMBLEM_BONUS_COSTS = [25, 71, 119, 169, 221, 273, 327, 383, 441, 501, 563, 627];
    
    private static SUPPLY_DROP_VALUES = [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75];
    private static SUPPLY_DROP_COSTS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65];
    
    private static COIN_REWARD_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    private static COIN_REWARD_COSTS = [25, 71, 119, 171, 225, 281, 339, 399, 461, 525, 591, 659];
    
    private static FREE_UPGRADE_VALUES = [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75];
    private static FREE_UPGRADE_COSTS = [5, 16, 27, 38, 49, 60, 71, 82, 93, 104, 115, 126];
    
    private static GAME_SPEED_VALUES = [1, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75];
    private static GAME_SPEED_COSTS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
    
    // Helper function to get value from lookup table
    private static getValueFromTable(table: number[], level: number): number {
        if (level > table.length) return table[table.length - 1];
        return table[level];
    }
    
    // Helper function to get cost from lookup table
    private static getCostFromTable(table: number[], level: number): number {
        if (level > table.length) return table[table.length - 1];
        return table[level];
    }

    /**
     * Get base definitions for all skills
     * @param currentLevels Map with current skill levels
     * @returns Map with skill information
     */
    public static getSkillDefinitions(currentLevels: Map<SkillType, number> = new Map()): Map<SkillType, SkillInfo> {
        // Define all skills with their properties (excluding pricing)
        return new Map([
            [SkillType.MAX_HEALTH, {
                type: SkillType.MAX_HEALTH,
                name: 'Castle Strength',
                description: 'Increases the maximum health of the castle',
                currentLevel: currentLevels.get(SkillType.MAX_HEALTH) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.MAX_HEALTH_VALUES, currentLevel)
            }],
            [SkillType.DEFENSE, {
                type: SkillType.DEFENSE,
                name: 'Castle Defense',
                description: 'Reduces incoming damage',
                currentLevel: currentLevels.get(SkillType.DEFENSE) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.DEFENSE_VALUES, currentLevel)
            }],
            [SkillType.HEALTH_REGEN, {
                type: SkillType.HEALTH_REGEN,
                name: 'Health Regeneration',
                description: 'Restores castle health over time',
                currentLevel: currentLevels.get(SkillType.HEALTH_REGEN) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.HEALTH_REGEN_VALUES, currentLevel)
            }],
            [SkillType.DAMAGE, {
                type: SkillType.DAMAGE,
                name: 'Damage',
                description: 'Increases damage from arrows',
                currentLevel: currentLevels.get(SkillType.DAMAGE) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.DAMAGE_VALUES, currentLevel)
            }],
            [SkillType.COIN_REWARD, {
                type: SkillType.COIN_REWARD,
                name: 'Gold Reward Bonus',
                description: 'Increases the amount of coins from killed enemies',
                currentLevel: currentLevels.get(SkillType.COIN_REWARD) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.COIN_REWARD_VALUES, currentLevel)
            }],
            [SkillType.ATTACK_SPEED, {
                type: SkillType.ATTACK_SPEED,
                name: 'Attack Speed',
                description: 'Increases the frequency of tower shots',
                currentLevel: currentLevels.get(SkillType.ATTACK_SPEED) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.ATTACK_SPEED_VALUES, currentLevel)
            }],
            [SkillType.ATTACK_RANGE, {
                type: SkillType.ATTACK_RANGE,
                name: 'Attack Range',
                description: 'Increases the attack range of the tower',
                currentLevel: currentLevels.get(SkillType.ATTACK_RANGE) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.ATTACK_RANGE_VALUES, currentLevel)
            }],
            [SkillType.KNOCKBACK, {
                type: SkillType.KNOCKBACK,
                name: 'Knockback',
                description: 'Increases the knockback force against enemies when hit',
                currentLevel: currentLevels.get(SkillType.KNOCKBACK) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.KNOCKBACK_VALUES, currentLevel)
            }],
            [SkillType.MULTISHOT, {
                type: SkillType.MULTISHOT,
                name: 'Multishot',
                description: 'Chance to fire 3 arrows simultaneously',
                currentLevel: currentLevels.get(SkillType.MULTISHOT) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.MULTISHOT_VALUES, currentLevel)
            }],
            [SkillType.CRIT_CHANCE, {
                type: SkillType.CRIT_CHANCE,
                name: 'Critical Chance',
                description: 'Chance to deal critical damage',
                currentLevel: currentLevels.get(SkillType.CRIT_CHANCE) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.CRIT_CHANCE_VALUES, currentLevel)
            }],
            [SkillType.CRIT_MULTIPLIER, {
                type: SkillType.CRIT_MULTIPLIER,
                name: 'Critical Multiplier',
                description: 'Increases critical hit damage',
                currentLevel: currentLevels.get(SkillType.CRIT_MULTIPLIER) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.CRIT_MULTIPLIER_VALUES, currentLevel)
            }],
            [SkillType.LIFESTEAL_CHANCE, {
                type: SkillType.LIFESTEAL_CHANCE,
                name: 'Lifesteal Chance',
                description: 'Chance to restore health on attack',
                currentLevel: currentLevels.get(SkillType.LIFESTEAL_CHANCE) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.LIFESTEAL_CHANCE_VALUES, currentLevel)
            }],
            [SkillType.LIFESTEAL_AMOUNT, {
                type: SkillType.LIFESTEAL_AMOUNT,
                name: 'Lifesteal Amount',
                description: 'Amount of health restored',
                currentLevel: currentLevels.get(SkillType.LIFESTEAL_AMOUNT) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.LIFESTEAL_AMOUNT_VALUES, currentLevel)
            }],
            [SkillType.DAILY_GOLD, {
                type: SkillType.DAILY_GOLD,
                name: 'Daily Gold',
                description: 'Provides gold at the start of each wave',
                currentLevel: currentLevels.get(SkillType.DAILY_GOLD) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.DAILY_GOLD_VALUES, currentLevel)
            }],
            [SkillType.EMBLEM_BONUS, {
                type: SkillType.EMBLEM_BONUS,
                name: 'Emblem Bonus',
                description: 'Increases the number of emblems received per wave',
                currentLevel: currentLevels.get(SkillType.EMBLEM_BONUS) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.EMBLEM_BONUS_VALUES, currentLevel)
            }],
            [SkillType.FREE_UPGRADE, {
                type: SkillType.FREE_UPGRADE,
                name: 'Free Upgrade Chance',
                description: 'Chance to get a free upgrade',
                currentLevel: currentLevels.get(SkillType.FREE_UPGRADE) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.FREE_UPGRADE_VALUES, currentLevel)
            }],
            [SkillType.SUPPLY_DROP, {
                type: SkillType.SUPPLY_DROP,
                name: 'Golden Chest Chance',
                description: 'Chance of a golden chest appearing during upgrade',
                currentLevel: currentLevels.get(SkillType.SUPPLY_DROP) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.SUPPLY_DROP_VALUES, currentLevel)
            }],
            [SkillType.GAME_SPEED, {
                type: SkillType.GAME_SPEED,
                name: 'Game Speed',
                description: 'Increases the speed of all game actions',
                currentLevel: currentLevels.get(SkillType.GAME_SPEED) || 0,
                maxLevel: 12,
                calculateValue: (currentLevel: number) => this.getValueFromTable(this.GAME_SPEED_VALUES, currentLevel)
            }]
        ]);
    }

    /**
     * Get price definitions for skills
     * @returns Map with price information
     */
    public static getPriceDefinitions(): Map<SkillType, SkillPrice> {
        // Create Map with prices for all skills
        return new Map([
            [SkillType.MAX_HEALTH, {
                skillType: SkillType.MAX_HEALTH,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.MAX_HEALTH_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.MAX_HEALTH_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.DEFENSE, {
                skillType: SkillType.DEFENSE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.DEFENSE_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.DEFENSE_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.HEALTH_REGEN, {
                skillType: SkillType.HEALTH_REGEN,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.HEALTH_REGEN_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.HEALTH_REGEN_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.DAMAGE, {
                skillType: SkillType.DAMAGE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.DAMAGE_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.DAMAGE_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.COIN_REWARD, {
                skillType: SkillType.COIN_REWARD,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.COIN_REWARD_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.COIN_REWARD_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.ATTACK_SPEED, {
                skillType: SkillType.ATTACK_SPEED,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.ATTACK_SPEED_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.ATTACK_SPEED_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.ATTACK_RANGE, {
                skillType: SkillType.ATTACK_RANGE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.ATTACK_RANGE_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.ATTACK_RANGE_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.KNOCKBACK, {
                skillType: SkillType.KNOCKBACK,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.KNOCKBACK_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.KNOCKBACK_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.MULTISHOT, {
                skillType: SkillType.MULTISHOT,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.MULTISHOT_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.MULTISHOT_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.CRIT_CHANCE, {
                skillType: SkillType.CRIT_CHANCE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.CRIT_CHANCE_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.CRIT_CHANCE_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.CRIT_MULTIPLIER, {
                skillType: SkillType.CRIT_MULTIPLIER,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.CRIT_MULTIPLIER_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.CRIT_MULTIPLIER_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.LIFESTEAL_CHANCE, {
                skillType: SkillType.LIFESTEAL_CHANCE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.LIFESTEAL_CHANCE_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.LIFESTEAL_CHANCE_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.LIFESTEAL_AMOUNT, {
                skillType: SkillType.LIFESTEAL_AMOUNT,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.LIFESTEAL_AMOUNT_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.LIFESTEAL_AMOUNT_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.DAILY_GOLD, {
                skillType: SkillType.DAILY_GOLD,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.DAILY_GOLD_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.DAILY_GOLD_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.EMBLEM_BONUS, {
                skillType: SkillType.EMBLEM_BONUS,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.EMBLEM_BONUS_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.EMBLEM_BONUS_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.FREE_UPGRADE, {
                skillType: SkillType.FREE_UPGRADE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.FREE_UPGRADE_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.FREE_UPGRADE_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.SUPPLY_DROP, {
                skillType: SkillType.SUPPLY_DROP,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.SUPPLY_DROP_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.SUPPLY_DROP_COSTS, currentLevel) / 2)
                }
            }],
            [SkillType.GAME_SPEED, {
                skillType: SkillType.GAME_SPEED,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostFromTable(this.GAME_SPEED_COSTS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostFromTable(this.GAME_SPEED_COSTS, currentLevel) / 2)
                }
            }]
        ]);
    }
} 
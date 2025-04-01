import { SkillType, SkillInfo, SkillPrice, CurrencyType } from '../types/SkillType';

/**
 * Static class with skill definitions and prices
 * Centrally stores all information about skills
 */
export class SkillDefinitions {
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
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 100 + (100 * currentLevel) // Changed from 200*Math.pow(1.35, currentLevel)
            }],
            [SkillType.DEFENSE, {
                type: SkillType.DEFENSE,
                name: 'Castle Defense',
                description: 'Reduces incoming damage',
                currentLevel: currentLevels.get(SkillType.DEFENSE) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => Math.floor(20 * Math.pow(1.25, currentLevel))
            }],
            [SkillType.HEALTH_REGEN, {
                type: SkillType.HEALTH_REGEN,
                name: 'Health Regeneration',
                description: 'Restores castle health over time',
                currentLevel: currentLevels.get(SkillType.HEALTH_REGEN) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => Math.floor(3 * Math.pow(1.5, currentLevel))
            }],
            [SkillType.DAMAGE, {
                type: SkillType.DAMAGE,
                name: 'Damage',
                description: 'Increases damage from arrows',
                currentLevel: currentLevels.get(SkillType.DAMAGE) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => Math.floor(20 * Math.pow(1.35, currentLevel))
            }],
            [SkillType.COIN_REWARD, {
                type: SkillType.COIN_REWARD,
                name: 'Gold Reward Bonus',
                description: 'Increases the amount of coins from killed enemies',
                currentLevel: currentLevels.get(SkillType.COIN_REWARD) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => Math.floor(3 * Math.pow(1.25, currentLevel))
            }],
            [SkillType.ATTACK_SPEED, {
                type: SkillType.ATTACK_SPEED,
                name: 'Attack Speed',
                description: 'Increases the frequency of tower shots',
                currentLevel: currentLevels.get(SkillType.ATTACK_SPEED) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 1 + (0.2 * currentLevel)
            }],
            [SkillType.ATTACK_RANGE, {
                type: SkillType.ATTACK_RANGE,
                name: 'Attack Range',
                description: 'Increases the attack range of the tower',
                currentLevel: currentLevels.get(SkillType.ATTACK_RANGE) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 1 + (0.25 * currentLevel)
            }],
            [SkillType.KNOCKBACK, {
                type: SkillType.KNOCKBACK,
                name: 'Knockback',
                description: 'Increases the knockback force against enemies when hit',
                currentLevel: currentLevels.get(SkillType.KNOCKBACK) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => Math.floor(50 * Math.pow(1.3, currentLevel))
            }],
            [SkillType.MULTISHOT, {
                type: SkillType.MULTISHOT,
                name: 'Multishot',
                description: 'Chance to fire 3 arrows simultaneously',
                currentLevel: currentLevels.get(SkillType.MULTISHOT) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 5 + (3 * currentLevel) // +3% per upgrade
            }],
            [SkillType.CRIT_CHANCE, {
                type: SkillType.CRIT_CHANCE,
                name: 'Critical Chance',
                description: 'Chance to deal critical damage',
                currentLevel: currentLevels.get(SkillType.CRIT_CHANCE) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 25 + (25 * currentLevel) // +25% per upgrade
            }],
            [SkillType.CRIT_MULTIPLIER, {
                type: SkillType.CRIT_MULTIPLIER,
                name: 'Critical Multiplier',
                description: 'Increases critical hit damage',
                currentLevel: currentLevels.get(SkillType.CRIT_MULTIPLIER) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 25 + (25 * currentLevel) // +25% per upgrade
            }],
            [SkillType.LIFESTEAL_CHANCE, {
                type: SkillType.LIFESTEAL_CHANCE,
                name: 'Lifesteal Chance',
                description: 'Chance to restore health on attack',
                currentLevel: currentLevels.get(SkillType.LIFESTEAL_CHANCE) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 25 + (25 * currentLevel) // +25% per upgrade
            }],
            [SkillType.LIFESTEAL_AMOUNT, {
                type: SkillType.LIFESTEAL_AMOUNT,
                name: 'Lifesteal Amount',
                description: 'Amount of health restored',
                currentLevel: currentLevels.get(SkillType.LIFESTEAL_AMOUNT) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => currentLevel // +1 per upgrade
            }],
            [SkillType.DAILY_GOLD, {
                type: SkillType.DAILY_GOLD,
                name: 'Daily Gold',
                description: 'Provides gold at the start of each wave',
                currentLevel: currentLevels.get(SkillType.DAILY_GOLD) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => currentLevel + 1 // +1 level per upgrade
            }],
            [SkillType.EMBLEM_BONUS, {
                type: SkillType.EMBLEM_BONUS,
                name: 'Emblem Bonus',
                description: 'Increases the number of emblems received per wave',
                currentLevel: currentLevels.get(SkillType.EMBLEM_BONUS) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => currentLevel + 1 // +1 level per upgrade
            }],
            [SkillType.FREE_UPGRADE, {
                type: SkillType.FREE_UPGRADE,
                name: 'Free Upgrade Chance',
                description: 'Chance to get a free upgrade',
                currentLevel: currentLevels.get(SkillType.FREE_UPGRADE) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => currentLevel * 5 // +5% per upgrade (0.05)
            }],
            [SkillType.SUPPLY_DROP, {
                type: SkillType.SUPPLY_DROP,
                name: 'Golden Chest Chance',
                description: 'Chance of a golden chest appearing during upgrade',
                currentLevel: currentLevels.get(SkillType.SUPPLY_DROP) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => currentLevel * 5 // +5% per upgrade (0.05)
            }],
            [SkillType.GAME_SPEED, {
                type: SkillType.GAME_SPEED,
                name: 'Game Speed',
                description: 'Increases the speed of all game actions',
                currentLevel: currentLevels.get(SkillType.GAME_SPEED) || 0,
                maxLevel: 10,
                calculateValue: (currentLevel: number) => 1 + (0.25 * currentLevel) // +0.25 per upgrade
            }]
        ]);
    }

    /**
     * Calculates Fibonacci number for price calculation
     * @param n Index of the number in the sequence
     * @returns Fibonacci number
     */
    private static fibonacci(n: number): number {
        if (n <= 0) return 0;
        if (n === 1) return 1;
        
        let a = 0;
        let b = 1;
        let result = 0;
        
        for (let i = 2; i <= n; i++) {
            result = a + b;
            a = b;
            b = result;
        }
        
        return result;
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
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.DEFENSE, {
                skillType: SkillType.DEFENSE,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.HEALTH_REGEN, {
                skillType: SkillType.HEALTH_REGEN,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.DAMAGE, {
                skillType: SkillType.DAMAGE,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.COIN_REWARD, {
                skillType: SkillType.COIN_REWARD,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.ATTACK_SPEED, {
                skillType: SkillType.ATTACK_SPEED,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.ATTACK_RANGE, {
                skillType: SkillType.ATTACK_RANGE,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.KNOCKBACK, {
                skillType: SkillType.KNOCKBACK,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.MULTISHOT, {
                skillType: SkillType.MULTISHOT,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.CRIT_CHANCE, {
                skillType: SkillType.CRIT_CHANCE,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.CRIT_MULTIPLIER, {
                skillType: SkillType.CRIT_MULTIPLIER,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.LIFESTEAL_CHANCE, {
                skillType: SkillType.LIFESTEAL_CHANCE,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.LIFESTEAL_AMOUNT, {
                skillType: SkillType.LIFESTEAL_AMOUNT,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.DAILY_GOLD, {
                skillType: SkillType.DAILY_GOLD,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.EMBLEM_BONUS, {
                skillType: SkillType.EMBLEM_BONUS,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.FREE_UPGRADE, {
                skillType: SkillType.FREE_UPGRADE,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.SUPPLY_DROP, {
                skillType: SkillType.SUPPLY_DROP,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }],
            [SkillType.GAME_SPEED, {
                skillType: SkillType.GAME_SPEED,
                goldCost: {
                    calculateCost: (currentLevel: number) => SkillDefinitions.fibonacci(currentLevel + 1)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(SkillDefinitions.fibonacci(currentLevel + 1) / 2)
                }
            }]
        ]);
    }
} 
import { SkillType, SkillInfo, SkillPrice, CurrencyType } from '../types/SkillType';

/**
 * Static class with skill definitions and prices
 * Centrally stores all information about skills
 */
export class SkillDefinitions {
    // Calculation functions for skill values
    private static calculateDamageValue(level: number): number {
        if (level === 0) return 3;
        if (level === 1) return 4.25;
        if (level === 2) return 6;
        if (level === 3) return 6.75;
        if (level === 4) return 8;
        if (level === 5) return 9.5;
        if (level === 6) return 11;
        if (level === 7) return 12.5;
        if (level === 8) return 14;
        if (level === 9) return 16;
        if (level === 10) return 18;
        return 20 + (level - 11) * 2;
    }
    
    private static calculateMaxHealthValue(level: number): number {
        return 50 + (level * 5);
    }
    
    private static calculateMultishotValue(level: number): number {
        return +(level * 0.5).toFixed(2);
    }
    
    private static calculateSupplyDropValue(level: number): number {
        return +(level * 0.25).toFixed(2);
    }
    
    private static calculateDailyGoldValue(level: number): number {
        return Math.round(level * 3);
    }
    
    private static calculateCoinRewardValue(level: number): number {
        return Math.round(level + 1);
    }
    
    // Calculation functions for skill costs
    private static calculateMultishotCost(level: number): number {
        return Math.ceil(10 + (level * 5));
    }

    private static calculateSupplyDropCost(level: number): number {
        return Math.ceil(10 + (level * 5));
    }

    private static calculateDailyGoldCost(level: number): number {
        return Math.ceil(level * 2);
    }

    private static calculateGameSpeedCost(level: number): number {
        return Math.ceil(10 + (level * 10));
    }

    private static calculateFreeUpgradeCost(level: number): number {
        return Math.ceil(5 + (level * 11));
    }

    private static calculateDefenseCost(level: number): number {
        return Math.ceil(5 + (level * 9));
    }

    private static calculateCritChanceCost(level: number): number {
        return Math.ceil(5 + (level * 6));
    }
    
    private static calculateCritChanceValue(level: number): number {
        return +(level * 0.5).toFixed(2);
    }
    
    // Calculation functions for other skill values
    private static calculateHealthRegenValue(level: number): number {
        return +(level * 0.1).toFixed(2);
    }
    
    private static calculateHealthRegenCost(level: number): number {
        return Math.ceil(5 + (level * 9));
    }
    
    private static calculateAttackSpeedValue(level: number): number {
        return +(2.5 + (level * 0.1)).toFixed(2);
    }
    
    private static calculateAttackSpeedCost(level: number): number {
        return Math.ceil(5 + Math.pow(level, 1.5) * 2);
    }
    
    private static calculateAttackRangeValue(level: number): number {
        return Math.round(130 + (level * 4));
    }
    
    private static calculateAttackRangeCost(level: number): number {
        return Math.ceil(20 + Math.pow(level, 1.3) * 7);
    }
    
    private static calculateCritMultiplierValue(level: number): number {
        return +(2 + (level * 0.25)).toFixed(2);
    }
    
    private static calculateCritMultiplierCost(level: number): number {
        return Math.ceil(5 + Math.pow(level, 1.6) * 3);
    }
    
    private static calculateKnockbackValue(level: number): number {
        return +(1 + (level * 0.5)).toFixed(2);
    }
    
    private static calculateKnockbackCost(level: number): number {
        return Math.ceil(15 + (level * 12));
    }
    
    private static calculateLifestealChanceValue(level: number): number {
        return +(level * 0.5).toFixed(2);
    }
    
    private static calculateLifestealChanceCost(level: number): number {
        return Math.ceil(5 + (level * 9));
    }
    
    private static calculateLifestealAmountValue(level: number): number {
        return Math.round(1 + level);
    }
    
    private static calculateLifestealAmountCost(level: number): number {
        return Math.ceil(10 + (level * 16));
    }
    
    private static calculateEmblemBonusValue(level: number): number {
        return Math.round(level);
    }
    
    private static calculateEmblemBonusCost(level: number): number {
        return Math.ceil(25 + Math.pow(level, 1.8) * 2);
    }
    
    private static calculateGameSpeedValue(level: number): number {
        return +(1 + (level * 0.25)).toFixed(2);
    }
    
    // Calculation functions for remaining costs
    private static calculateDamageCost(level: number): number {
        if (level === 0) return 5;
        if (level === 1) return 8;
        if (level === 2) return 12;
        if (level === 3) return 15;
        if (level === 4) return 19;
        if (level === 5) return 24;
        if (level === 6) return 30;
        if (level === 7) return 37;
        if (level === 8) return 45;
        if (level === 9) return 55;
        if (level === 10) return 66;
        if (level === 11) return 78;
        // For levels beyond the original array
        return Math.ceil(5 + Math.pow(level, 1.6) * 2);
    }
    
    private static calculateMaxHealthCost(level: number): number {
        if (level === 0) return 5;
        if (level === 1) return 12;
        if (level === 2) return 17;
        if (level === 3) return 23;
        if (level === 4) return 30;
        if (level === 5) return 35;
        if (level === 6) return 42;
        if (level === 7) return 49;
        if (level === 8) return 56;
        if (level === 9) return 63;
        if (level === 10) return 70;
        if (level === 11) return 77;
        if (level === 12) return 84;
        // For levels beyond the original array
        return Math.ceil(5 + (level * 7));
    }
    
    private static calculateCoinRewardCost(level: number): number {
        // For levels beyond the original array
        return Math.ceil(25 + 50 * level);
    }
    
    /**
     * Get maximum level for a skill type
     * @param skillType Skill type to get max level for
     * @returns Maximum level for the skill
     */
    public static getMaxLevel(skillType: SkillType): number {
        switch (skillType) {
            case SkillType.DAMAGE:
                return 100;
            case SkillType.MAX_HEALTH:
                return 100;
            case SkillType.HEALTH_REGEN:
                return 100;
            case SkillType.DEFENSE:
                return 100;
            case SkillType.ATTACK_SPEED:
                return 100;
            case SkillType.ATTACK_RANGE:
                return 100;
            case SkillType.CRIT_CHANCE:
                return 100;
            case SkillType.CRIT_MULTIPLIER:
                return 100;
            case SkillType.MULTISHOT:
                return 100;
            case SkillType.KNOCKBACK:
                return 100;
            case SkillType.LIFESTEAL_CHANCE:
                return 100;
            case SkillType.LIFESTEAL_AMOUNT:
                return 100;
            case SkillType.DAILY_GOLD:
                return 1000;
            case SkillType.EMBLEM_BONUS:
                return 100; 
            case SkillType.FREE_UPGRADE:
                return 100;
            case SkillType.SUPPLY_DROP:
                return 100;
            case SkillType.COIN_REWARD:
                return 100;
            case SkillType.GAME_SPEED:
                return 10; // DO NOT CHANGE
            default:
                return 100;
        }
    }
    
    // Helper function to get value from skill table
    private static getValueForSkill(skillType: SkillType, level: number): number {
        switch (skillType) {
            case SkillType.DAMAGE:
                return this.calculateDamageValue(level);
            case SkillType.MAX_HEALTH:
                return this.calculateMaxHealthValue(level);
            case SkillType.MULTISHOT:
                return this.calculateMultishotValue(level);
            case SkillType.SUPPLY_DROP:
                return this.calculateSupplyDropValue(level);
            case SkillType.DAILY_GOLD:
                return this.calculateDailyGoldValue(level);
            case SkillType.COIN_REWARD:
                return this.calculateCoinRewardValue(level);
            case SkillType.HEALTH_REGEN:
                return this.calculateHealthRegenValue(level);
            case SkillType.DEFENSE:
                return +(level * 0.5).toFixed(2);
            case SkillType.ATTACK_SPEED:
                return this.calculateAttackSpeedValue(level);
            case SkillType.ATTACK_RANGE:
                return this.calculateAttackRangeValue(level) / 2;
            case SkillType.CRIT_CHANCE:
                return this.calculateCritChanceValue(level);
            case SkillType.CRIT_MULTIPLIER:
                return this.calculateCritMultiplierValue(level);
            case SkillType.KNOCKBACK:
                return this.calculateKnockbackValue(level);
            case SkillType.LIFESTEAL_CHANCE:
                return this.calculateLifestealChanceValue(level);
            case SkillType.LIFESTEAL_AMOUNT:
                return this.calculateLifestealAmountValue(level);
            case SkillType.EMBLEM_BONUS:
                return this.calculateEmblemBonusValue(level);
            case SkillType.FREE_UPGRADE:
                return +(level * 0.25).toFixed(2);
            case SkillType.GAME_SPEED:
                return this.calculateGameSpeedValue(level);
            default:
                return 0;
        }
    }
    
    // Helper function to get cost from lookup table
    private static getCostForSkill(skillType: SkillType, level: number): number {
        switch (skillType) {
            case SkillType.MULTISHOT:
                return this.calculateMultishotCost(level);
            case SkillType.SUPPLY_DROP:
                return this.calculateSupplyDropCost(level);
            case SkillType.DAILY_GOLD:
                return this.calculateDailyGoldCost(level);
            case SkillType.GAME_SPEED:
                return this.calculateGameSpeedCost(level);
            case SkillType.FREE_UPGRADE:
                return this.calculateFreeUpgradeCost(level);
            case SkillType.DEFENSE:
                return this.calculateDefenseCost(level);
            case SkillType.CRIT_CHANCE:
                return this.calculateCritChanceCost(level);
            case SkillType.DAMAGE:
                return this.calculateDamageCost(level);
            case SkillType.MAX_HEALTH:
                return this.calculateMaxHealthCost(level);
            case SkillType.COIN_REWARD:
                return this.calculateCoinRewardCost(level);
            case SkillType.ATTACK_SPEED:
                return this.calculateAttackSpeedCost(level);
            case SkillType.ATTACK_RANGE:
                return this.calculateAttackRangeCost(level);
            case SkillType.CRIT_MULTIPLIER:
                return this.calculateCritMultiplierCost(level);
            case SkillType.HEALTH_REGEN:
                return this.calculateHealthRegenCost(level);
            case SkillType.KNOCKBACK:
                return this.calculateKnockbackCost(level);
            case SkillType.LIFESTEAL_CHANCE:
                return this.calculateLifestealChanceCost(level);
            case SkillType.LIFESTEAL_AMOUNT:
                return this.calculateLifestealAmountCost(level);
            case SkillType.EMBLEM_BONUS:
                return this.calculateEmblemBonusCost(level);
            default:
                return 0;
        }
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
                maxLevel: this.getMaxLevel(SkillType.MAX_HEALTH),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.MAX_HEALTH, currentLevel)
            }],
            [SkillType.DEFENSE, {
                type: SkillType.DEFENSE,
                name: 'Castle Defense',
                description: 'Reduces incoming damage',
                currentLevel: currentLevels.get(SkillType.DEFENSE) || 0,
                maxLevel: this.getMaxLevel(SkillType.DEFENSE),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.DEFENSE, currentLevel)
            }],
            [SkillType.HEALTH_REGEN, {
                type: SkillType.HEALTH_REGEN,
                name: 'Health Regeneration',
                description: 'Restores castle health over time',
                currentLevel: currentLevels.get(SkillType.HEALTH_REGEN) || 0,
                maxLevel: this.getMaxLevel(SkillType.HEALTH_REGEN),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.HEALTH_REGEN, currentLevel)
            }],
            [SkillType.DAMAGE, {
                type: SkillType.DAMAGE,
                name: 'Damage',
                description: 'Increases damage from arrows',
                currentLevel: currentLevels.get(SkillType.DAMAGE) || 0,
                maxLevel: this.getMaxLevel(SkillType.DAMAGE),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.DAMAGE, currentLevel)
            }],
            [SkillType.COIN_REWARD, {
                type: SkillType.COIN_REWARD,
                name: 'Gold Reward Bonus',
                description: 'Increases the amount of coins from killed enemies',
                currentLevel: currentLevels.get(SkillType.COIN_REWARD) || 0,
                maxLevel: this.getMaxLevel(SkillType.COIN_REWARD),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.COIN_REWARD, currentLevel)
            }],
            [SkillType.ATTACK_SPEED, {
                type: SkillType.ATTACK_SPEED,
                name: 'Attack Speed',
                description: 'Increases the frequency of tower shots',
                currentLevel: currentLevels.get(SkillType.ATTACK_SPEED) || 0,
                maxLevel: this.getMaxLevel(SkillType.ATTACK_SPEED),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.ATTACK_SPEED, currentLevel)
            }],
            [SkillType.ATTACK_RANGE, {
                type: SkillType.ATTACK_RANGE,
                name: 'Attack Range',
                description: 'Increases the attack range of the tower',
                currentLevel: currentLevels.get(SkillType.ATTACK_RANGE) || 0,
                maxLevel: this.getMaxLevel(SkillType.ATTACK_RANGE),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.ATTACK_RANGE, currentLevel)
            }],
            [SkillType.KNOCKBACK, {
                type: SkillType.KNOCKBACK,
                name: 'Knockback',
                description: 'Increases the knockback force against enemies when hit',
                currentLevel: currentLevels.get(SkillType.KNOCKBACK) || 0,
                maxLevel: this.getMaxLevel(SkillType.KNOCKBACK),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.KNOCKBACK, currentLevel)
            }],
            [SkillType.MULTISHOT, {
                type: SkillType.MULTISHOT,
                name: 'Multishot',
                description: 'Chance to fire 3 arrows simultaneously',
                currentLevel: currentLevels.get(SkillType.MULTISHOT) || 0,
                maxLevel: this.getMaxLevel(SkillType.MULTISHOT),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.MULTISHOT, currentLevel)
            }],
            [SkillType.CRIT_CHANCE, {
                type: SkillType.CRIT_CHANCE,
                name: 'Critical Chance',
                description: 'Chance to deal critical damage',
                currentLevel: currentLevels.get(SkillType.CRIT_CHANCE) || 0,
                maxLevel: this.getMaxLevel(SkillType.CRIT_CHANCE),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.CRIT_CHANCE, currentLevel)
            }],
            [SkillType.CRIT_MULTIPLIER, {
                type: SkillType.CRIT_MULTIPLIER,
                name: 'Critical Multiplier',
                description: 'Increases critical hit damage',
                currentLevel: currentLevels.get(SkillType.CRIT_MULTIPLIER) || 0,
                maxLevel: this.getMaxLevel(SkillType.CRIT_MULTIPLIER),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.CRIT_MULTIPLIER, currentLevel)
            }],
            [SkillType.LIFESTEAL_CHANCE, {
                type: SkillType.LIFESTEAL_CHANCE,
                name: 'Lifesteal Chance',
                description: 'Chance to restore health on attack',
                currentLevel: currentLevels.get(SkillType.LIFESTEAL_CHANCE) || 0,
                maxLevel: this.getMaxLevel(SkillType.LIFESTEAL_CHANCE),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.LIFESTEAL_CHANCE, currentLevel)
            }],
            [SkillType.LIFESTEAL_AMOUNT, {
                type: SkillType.LIFESTEAL_AMOUNT,
                name: 'Lifesteal Amount',
                description: 'Amount of health restored',
                currentLevel: currentLevels.get(SkillType.LIFESTEAL_AMOUNT) || 0,
                maxLevel: this.getMaxLevel(SkillType.LIFESTEAL_AMOUNT),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.LIFESTEAL_AMOUNT, currentLevel)
            }],
            [SkillType.DAILY_GOLD, {
                type: SkillType.DAILY_GOLD,
                name: 'Daily Gold',
                description: 'Provides gold at the start of each wave',
                currentLevel: currentLevels.get(SkillType.DAILY_GOLD) || 0,
                maxLevel: this.getMaxLevel(SkillType.DAILY_GOLD),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.DAILY_GOLD, currentLevel)
            }],
            [SkillType.EMBLEM_BONUS, {
                type: SkillType.EMBLEM_BONUS,
                name: 'Emblem Bonus',
                description: 'Increases the number of emblems received per wave',
                currentLevel: currentLevels.get(SkillType.EMBLEM_BONUS) || 0,
                maxLevel: this.getMaxLevel(SkillType.EMBLEM_BONUS),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.EMBLEM_BONUS, currentLevel)
            }],
            [SkillType.FREE_UPGRADE, {
                type: SkillType.FREE_UPGRADE,
                name: 'Free Upgrade Chance',
                description: 'Chance to get a free upgrade',
                currentLevel: currentLevels.get(SkillType.FREE_UPGRADE) || 0,
                maxLevel: this.getMaxLevel(SkillType.FREE_UPGRADE),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.FREE_UPGRADE, currentLevel)
            }],
            [SkillType.SUPPLY_DROP, {
                type: SkillType.SUPPLY_DROP,
                name: 'Golden Chest Chance',
                description: 'Chance of a golden chest appearing during upgrade',
                currentLevel: currentLevels.get(SkillType.SUPPLY_DROP) || 0,
                maxLevel: this.getMaxLevel(SkillType.SUPPLY_DROP),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.SUPPLY_DROP, currentLevel)
            }],
            [SkillType.GAME_SPEED, {
                type: SkillType.GAME_SPEED,
                name: 'Game Speed',
                description: 'Increases the speed of all game actions',
                currentLevel: currentLevels.get(SkillType.GAME_SPEED) || 0,
                maxLevel: this.getMaxLevel(SkillType.GAME_SPEED),
                calculateValue: (currentLevel: number) => this.getValueForSkill(SkillType.GAME_SPEED, currentLevel)
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
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.MAX_HEALTH, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.MAX_HEALTH, currentLevel) / 2)
                }
            }],
            [SkillType.DEFENSE, {
                skillType: SkillType.DEFENSE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.DEFENSE, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.DEFENSE, currentLevel) / 2)
                }
            }],
            [SkillType.HEALTH_REGEN, {
                skillType: SkillType.HEALTH_REGEN,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.HEALTH_REGEN, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.HEALTH_REGEN, currentLevel) / 2)
                }
            }],
            [SkillType.DAMAGE, {
                skillType: SkillType.DAMAGE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.DAMAGE, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.DAMAGE, currentLevel) / 2)
                }
            }],
            [SkillType.COIN_REWARD, {
                skillType: SkillType.COIN_REWARD,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.COIN_REWARD, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.COIN_REWARD, currentLevel) / 2)
                }
            }],
            [SkillType.ATTACK_SPEED, {
                skillType: SkillType.ATTACK_SPEED,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.ATTACK_SPEED, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.ATTACK_SPEED, currentLevel) / 2)
                }
            }],
            [SkillType.ATTACK_RANGE, {
                skillType: SkillType.ATTACK_RANGE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.ATTACK_RANGE, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.ATTACK_RANGE, currentLevel) / 2)
                }
            }],
            [SkillType.KNOCKBACK, {
                skillType: SkillType.KNOCKBACK,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.KNOCKBACK, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.KNOCKBACK, currentLevel) / 2)
                }
            }],
            [SkillType.MULTISHOT, {
                skillType: SkillType.MULTISHOT,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.MULTISHOT, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.MULTISHOT, currentLevel) / 2)
                }
            }],
            [SkillType.CRIT_CHANCE, {
                skillType: SkillType.CRIT_CHANCE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.CRIT_CHANCE, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.CRIT_CHANCE, currentLevel) / 2)
                }
            }],
            [SkillType.CRIT_MULTIPLIER, {
                skillType: SkillType.CRIT_MULTIPLIER,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.CRIT_MULTIPLIER, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.CRIT_MULTIPLIER, currentLevel) / 2)
                }
            }],
            [SkillType.LIFESTEAL_CHANCE, {
                skillType: SkillType.LIFESTEAL_CHANCE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.LIFESTEAL_CHANCE, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.LIFESTEAL_CHANCE, currentLevel) / 2)
                }
            }],
            [SkillType.LIFESTEAL_AMOUNT, {
                skillType: SkillType.LIFESTEAL_AMOUNT,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.LIFESTEAL_AMOUNT, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.LIFESTEAL_AMOUNT, currentLevel) / 2)
                }
            }],
            [SkillType.DAILY_GOLD, {
                skillType: SkillType.DAILY_GOLD,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.DAILY_GOLD, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.DAILY_GOLD, currentLevel) / 2)
                }
            }],
            [SkillType.EMBLEM_BONUS, {
                skillType: SkillType.EMBLEM_BONUS,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.EMBLEM_BONUS, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.EMBLEM_BONUS, currentLevel) / 2)
                }
            }],
            [SkillType.FREE_UPGRADE, {
                skillType: SkillType.FREE_UPGRADE,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.FREE_UPGRADE, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.FREE_UPGRADE, currentLevel) / 2)
                }
            }],
            [SkillType.SUPPLY_DROP, {
                skillType: SkillType.SUPPLY_DROP,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.SUPPLY_DROP, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.SUPPLY_DROP, currentLevel) / 2)
                }
            }],
            [SkillType.GAME_SPEED, {
                skillType: SkillType.GAME_SPEED,
                goldCost: {
                    calculateCost: (currentLevel: number) => this.getCostForSkill(SkillType.GAME_SPEED, currentLevel)
                },
                emblemsCost: {
                    calculateCost: (currentLevel: number) => Math.ceil(this.getCostForSkill(SkillType.GAME_SPEED, currentLevel) / 2)
                }
            }]
        ]);
    }
} 
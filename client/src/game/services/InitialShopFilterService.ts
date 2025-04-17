import { SkillInfo, SkillType } from '../types/SkillType';

// Категории улучшений
export enum InitialUpgradeCategory {
    ALL = 'All Upgrades',
    ATTACK = 'Attack Upgrades',
    DEFENCE = 'Defence Upgrades',
    UTILITY = 'Utility Upgrades'
}

export class InitialShopFilterService {
    private currentCategory: InitialUpgradeCategory;
    private categories: InitialUpgradeCategory[];
    
    constructor() {
        this.categories = [
            InitialUpgradeCategory.ATTACK,
            InitialUpgradeCategory.DEFENCE,
            InitialUpgradeCategory.UTILITY
        ];
        this.currentCategory = InitialUpgradeCategory.ATTACK;
    }
    
    public getCurrentCategory(): InitialUpgradeCategory {
        return this.currentCategory;
    }
    
    public getCategories(): InitialUpgradeCategory[] {
        return this.categories;
    }
    
    public setCategory(category: InitialUpgradeCategory): void {
        this.currentCategory = category;
    }
    
    public nextCategory(): boolean {
        const currentIndex = this.categories.indexOf(this.currentCategory);
        if (currentIndex < this.categories.length - 1) {
            this.currentCategory = this.categories[currentIndex + 1];
            return true;
        }
        return false;
    }
    
    public previousCategory(): boolean {
        const currentIndex = this.categories.indexOf(this.currentCategory);
        if (currentIndex > 0) {
            this.currentCategory = this.categories[currentIndex - 1];
            return true;
        }
        return false;
    }
    
    public canGoNext(): boolean {
        const currentIndex = this.categories.indexOf(this.currentCategory);
        return currentIndex < this.categories.length - 1;
    }
    
    public canGoPrevious(): boolean {
        const currentIndex = this.categories.indexOf(this.currentCategory);
        return currentIndex > 0;
    }
    
    public filterSkillsByCategory(skills: SkillInfo[], category: InitialUpgradeCategory): SkillInfo[] {
        if (category === InitialUpgradeCategory.ALL) {
            return skills;
        }
        
        switch (category) {
            case InitialUpgradeCategory.ATTACK:
                return skills.filter(skill => 
                    skill.type === SkillType.DAMAGE ||
                    skill.type === SkillType.ATTACK_SPEED ||
                    skill.type === SkillType.ATTACK_RANGE ||
                    skill.type === SkillType.MULTISHOT ||
                    skill.type === SkillType.CRIT_CHANCE ||
                    skill.type === SkillType.CRIT_MULTIPLIER);
                
            case InitialUpgradeCategory.DEFENCE:
                return skills.filter(skill => 
                    skill.type === SkillType.MAX_HEALTH ||
                    skill.type === SkillType.DEFENSE ||
                    skill.type === SkillType.HEALTH_REGEN ||
                    skill.type === SkillType.KNOCKBACK ||
                    skill.type === SkillType.LIFESTEAL_AMOUNT ||
                    skill.type === SkillType.LIFESTEAL_CHANCE);
                
            case InitialUpgradeCategory.UTILITY:
                return skills.filter(skill => 
                    skill.type === SkillType.COIN_REWARD ||
                    skill.type === SkillType.DAILY_GOLD ||
                    skill.type === SkillType.EMBLEM_BONUS ||
                    skill.type === SkillType.FREE_UPGRADE ||
                    skill.type === SkillType.SUPPLY_DROP ||
                    skill.type === SkillType.GAME_SPEED);
                
            default:
                return skills;
        }
    }
} 
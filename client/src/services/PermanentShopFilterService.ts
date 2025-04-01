import { SkillInfo, SkillType } from '../types/SkillType';

// Категории улучшений
export enum PermanentUpgradeCategory {
    ALL = 'All Upgrades',
    ATTACK = 'Attack Upgrades',
    DEFENCE = 'Defence Upgrades',
    UTILITY = 'Utility Upgrades'
}

export class PermanentShopFilterService {
    private currentCategory: PermanentUpgradeCategory;
    private categories: PermanentUpgradeCategory[];
    
    constructor() {
        this.categories = [
            PermanentUpgradeCategory.ATTACK,
            PermanentUpgradeCategory.DEFENCE,
            PermanentUpgradeCategory.UTILITY
        ];
        this.currentCategory = PermanentUpgradeCategory.ATTACK;
    }
    
    public getCurrentCategory(): PermanentUpgradeCategory {
        return this.currentCategory;
    }
    
    public getCategories(): PermanentUpgradeCategory[] {
        return this.categories;
    }
    
    public setCategory(category: PermanentUpgradeCategory): void {
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
    
    public filterSkillsByCategory(skills: SkillInfo[], category: PermanentUpgradeCategory): SkillInfo[] {
        if (category === PermanentUpgradeCategory.ALL) {
            return skills;
        }
        
        switch (category) {
            case PermanentUpgradeCategory.ATTACK:
                return skills.filter(skill => 
                    skill.type === SkillType.DAMAGE ||
                    skill.type === SkillType.ATTACK_SPEED ||
                    skill.type === SkillType.ATTACK_RANGE ||
                    skill.type === SkillType.MULTISHOT ||
                    skill.type === SkillType.CRIT_CHANCE ||
                    skill.type === SkillType.CRIT_MULTIPLIER);
                
            case PermanentUpgradeCategory.DEFENCE:
                return skills.filter(skill => 
                    skill.type === SkillType.MAX_HEALTH ||
                    skill.type === SkillType.DEFENSE ||
                    skill.type === SkillType.HEALTH_REGEN ||
                    skill.type === SkillType.KNOCKBACK ||
                    skill.type === SkillType.LIFESTEAL_AMOUNT ||
                    skill.type === SkillType.LIFESTEAL_CHANCE);
                
            case PermanentUpgradeCategory.UTILITY:
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
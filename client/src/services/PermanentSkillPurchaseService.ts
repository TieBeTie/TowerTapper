import { UpgradeManager } from '../managers/UpgradeManager';
import { EmblemManager } from '../managers/EmblemManager';
import AudioManager from '../managers/AudioManager';
import { SkillType, CurrencyType, SkillInfo } from '../types/SkillType';

export class PermanentSkillPurchaseService {
    constructor(
        private upgradeManager: UpgradeManager,
        private emblemManager: EmblemManager,
        private audioManager: AudioManager,
        private scene: Phaser.Scene
    ) {}
    
    public canAffordSkill(skillType: SkillType): boolean {
        return this.upgradeManager.canAffordUpgrade(skillType, CurrencyType.EMBLEMS);
    }
    
    public getSkillCost(skillType: SkillType): number {
        return this.upgradeManager.getSkillCost(skillType, CurrencyType.EMBLEMS);
    }
    
    public getSkillValue(skillType: SkillType): number {
        return this.upgradeManager.getSkillValue(skillType);
    }
    
    public purchaseSkill(skillType: SkillType): boolean {
        // Проверка возможности покупки
        if (!this.canAffordSkill(skillType)) {
            return false;
        }
        
        // Получить стоимость до покупки
        const cost = this.getSkillCost(skillType);
        
        // Покупаем улучшение
        const purchaseResult = this.upgradeManager.purchaseUpgrade(skillType, CurrencyType.EMBLEMS);
        
        if (purchaseResult) {
            // Вручную обновляем UI для отображения текущего количества эмблем
            try {
                this.scene.events.emit('updateEmblems', this.emblemManager.getEmblemCount());
            } catch (err) {
                console.error('Error emitting emblem update event:', err);
            }
            
            // Воспроизводим звук покупки
            try {
                if (this.audioManager.hasSoundCached('purchase_sound')) {
                    this.audioManager.playSound('purchase_sound');
                } else if (this.audioManager.hasSoundCached('upgradeButton')) {
                    // Fallback to upgradeButton sound if purchase_sound is not available
                    this.audioManager.playSound('upgradeButton');
                }
            } catch (err) {
                console.error('Error playing purchase sound:', err);
            }
        }
        
        return purchaseResult;
    }
    
    public getEmblemCount(): number {
        return this.emblemManager.getEmblemCount();
    }
    
    public getUpdatedSkillList(): SkillInfo[] {
        return this.upgradeManager.getAvailableSkills();
    }
} 
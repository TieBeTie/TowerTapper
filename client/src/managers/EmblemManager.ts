import { SkillStateManager } from './SkillStateManager';
import { SkillType } from '../types/SkillType';
import Phaser from 'phaser';

export class EmblemManager {
    private static instance: EmblemManager;
    private skillStateManager: SkillStateManager;
    private emblemCount: number = 0;
    
    private constructor() {
        this.skillStateManager = SkillStateManager.getInstance();
    }
    
    public static getInstance(): EmblemManager {
        if (!EmblemManager.instance) {
            EmblemManager.instance = new EmblemManager();
        }
        return EmblemManager.instance;
    }
    
    // Initialize emblems at game start
    public initialize(): void {
        // Set initial emblem bonus level to 1 if not set
        const level = this.skillStateManager.getState(SkillType.EMBLEM_BONUS);
        if (level <= 0) {
            this.skillStateManager.saveState(SkillType.EMBLEM_BONUS, 1);
        }
    }
    
    // Get current emblem count
    public getEmblemCount(): number {
        return this.emblemCount;
    }
    
    // Add emblems to the counter
    public addEmblems(amount: number): void {
        this.emblemCount += amount;
        this.notifyUpdate();
    }
    
    // Remove emblems from the counter
    public removeEmblems(amount: number): void {
        this.emblemCount = Math.max(0, this.emblemCount - amount);
        this.notifyUpdate();
    }
    
    // Alias for removeEmblems to maintain compatibility with UpgradeManager
    public deductEmblems(amount: number): void {
        this.removeEmblems(amount);
    }
    
    // Reset emblem count
    public resetEmblems(): void {
        this.emblemCount = 0;
        this.notifyUpdate();
    }
    
    // Get emblem bonus based on upgrade level
    public getEmblemBonus(): number {
        const emblemBonusLevel = this.skillStateManager.getState(SkillType.EMBLEM_BONUS);
        
        // If emblem bonus is not upgraded yet, return 0
        if (emblemBonusLevel <= 0) {
            return 0;
        }
        
        return emblemBonusLevel;
    }
    
    // Notify UI to update emblem display
    private notifyUpdate(): void {
        try {
            const game = (window as any).game as Phaser.Game;
            if (game && game.scene) {
                const gameScene = game.scene.getScene('GameScene');
                if (gameScene) {
                    gameScene.events.emit('updateEmblems', this.emblemCount);
                }
            }
        } catch (error) {
            console.log('Could not emit emblem update event');
        }
    }
} 
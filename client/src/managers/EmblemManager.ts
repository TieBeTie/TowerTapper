import { SkillStateManager } from './SkillStateManager';
import { SkillType } from '../types/SkillType';
import Phaser from 'phaser';
import { EmblemStorage } from '../storage/EmblemStorage';

export class EmblemManager {
    private static instance: EmblemManager;
    private skillStateManager: SkillStateManager;
    private emblemStorage: EmblemStorage;
    
    private constructor() {
        this.skillStateManager = SkillStateManager.getInstance();
        this.emblemStorage = EmblemStorage.getInstance();
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
            this.skillStateManager.saveState(SkillType.EMBLEM_BONUS, 1, 1);
            console.log('EmblemManager: initialized emblem bonus to level 1');
        } else {
            console.log(`EmblemManager: using existing emblem bonus level ${level}`);
        }
        
        // No need to fetch emblems - EmblemStorage already syncs with server
        this.notifyUpdate();
        console.log('EmblemManager initialized');
    }
    
    // Get current emblem count
    public getEmblemCount(): number {
        return this.emblemStorage.getEmblems();
    }
    
    // Add emblems to the counter
    public addEmblems(amount: number): void {
        this.emblemStorage.addEmblems(amount);
        console.log('Added', amount, 'emblems. New total:', this.getEmblemCount());
        this.notifyUpdate();
    }
    
    // Remove emblems from the counter
    public removeEmblems(amount: number): void {
        this.emblemStorage.removeEmblems(amount);
        console.log('Removed', amount, 'emblems. New total:', this.getEmblemCount());
        this.notifyUpdate();
    }
    
    // Alias for removeEmblems to maintain compatibility with UpgradeManager
    public deductEmblems(amount: number): void {
        this.removeEmblems(amount);
    }
    
    // Reset emblem count
    public resetEmblems(): void {
        this.emblemStorage.setEmblems(0);
        console.log('Reset emblems to 0');
        this.notifyUpdate();
    }
    
    // Get emblem bonus based on upgrade level
    public getEmblemBonus(): number {
        const emblemBonusLevel = this.skillStateManager.getState(SkillType.EMBLEM_BONUS);
        
        // Log the emblem bonus level for debugging
        console.log(`EmblemManager.getEmblemBonus: current level = ${emblemBonusLevel}`);
        
        // If emblem bonus is not upgraded yet, force a minimum of 1
        if (emblemBonusLevel <= 0) {
            // Try to initialize with level 1 if not set
            this.skillStateManager.saveState(SkillType.EMBLEM_BONUS, 1, 1);
            return 1;
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
                    gameScene.events.emit('updateEmblems', this.getEmblemCount());
                }
            }
        } catch (error) {
            console.log('Could not emit emblem update event');
        }
    }
} 
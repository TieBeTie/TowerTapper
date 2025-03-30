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
        // Set initial emblem bonus level to 1
        this.skillStateManager.saveState(SkillType.EMBLEM_BONUS, 1);
    }
    
    // Get emblem bonus - based on skill level
    public getEmblemBonus(): number {
        const emblemBonusLevel = this.skillStateManager.getState(SkillType.EMBLEM_BONUS);
        return emblemBonusLevel;
    }
    
    // Get total emblem count
    public getEmblemCount(): number {
        return this.emblemStorage.loadEmblemCount();
    }
    
    // Add emblems
    public addEmblems(count: number): void {
        const currentCount = this.emblemStorage.loadEmblemCount();
        this.emblemStorage.saveEmblemCount(currentCount + count);
        this.notifyUpdate();
    }
    
    // Update UI
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
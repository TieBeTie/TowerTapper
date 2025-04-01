import { SkillType } from '../types/SkillType';
import { ISkillState } from '../types/ISkillState';
import { SkillSetStorage } from '../storage/SkillSetStorage';
import { PermanentSkillService } from '../services/PermanentSkillService';

export class SkillStateManager {
    private static instance: SkillStateManager;
    private state: Map<SkillType, ISkillState>;
    private storage: SkillSetStorage;
    private permanentSkillService: PermanentSkillService;
    private permanentSkillTypes: Set<SkillType> = new Set([
        SkillType.EMBLEM_BONUS,
        // Add other permanent skills here as they are implemented
    ]);
    
    private constructor() {
        this.storage = SkillSetStorage.getInstance();
        this.permanentSkillService = PermanentSkillService.getInstance();
        this.state = new Map();
    }
    
    public static getInstance(): SkillStateManager {
        if (!SkillStateManager.instance) {
            SkillStateManager.instance = new SkillStateManager();
        }
        return SkillStateManager.instance;
    }
    
    // Инициализация при старте игры
    public initialize(): void {
        this.state = this.storage.load();
    }
    
    // Сохранение состояния
    public saveState(type: SkillType, value: number, level: number = 0): void {
        // Get the existing state or create a new one
        const existingState = this.state.get(type);
        const currentLevel = level > 0 ? level : (existingState?.currentLevel || 0) + 1;
        
        this.state.set(type, {
            type,
            value,
            currentLevel,
            lastUpdated: new Date()
        });
        
        // Save to storage
        this.storage.save(this.state);
        
        // If this is a permanent skill and we're connected to the server,
        // update it there as well
        if (this.isPermanentSkill(type) && this.permanentSkillService.isConnected()) {
            this.permanentSkillService.updateSkill(type, currentLevel);
        }
    }
    
    // Получение состояния
    public getState(type: SkillType): number {
        // For permanent skills, prefer server value if connected
        if (this.isPermanentSkill(type) && this.permanentSkillService.isConnected()) {
            return this.permanentSkillService.getSkillLevel(type);
        }
        
        // Otherwise fall back to local state
        return this.state.get(type)?.value || 0;
    }
    
    // Получение уровня навыка
    public getSkillLevel(type: SkillType): number {
        // For permanent skills, prefer server value if connected
        if (this.isPermanentSkill(type) && this.permanentSkillService.isConnected()) {
            return this.permanentSkillService.getSkillLevel(type);
        }
        
        return this.state.get(type)?.currentLevel || 0;
    }
    
    // Получение всех состояний
    public getAllStates(): Map<SkillType, ISkillState> {
        const result = new Map(this.state);
        
        // If connected to server, update permanent skill values from there
        if (this.permanentSkillService.isConnected()) {
            this.permanentSkillTypes.forEach(skillType => {
                const level = this.permanentSkillService.getSkillLevel(skillType);
                const existingState = result.get(skillType);
                
                if (existingState) {
                    existingState.currentLevel = level;
                    // We might need additional logic to set the value based on level
                } else if (level > 0) {
                    // Create a new state if it doesn't exist but the server has it
                    result.set(skillType, {
                        type: skillType,
                        value: level, // Simple mapping for now, might need custom logic per skill
                        currentLevel: level,
                        lastUpdated: new Date()
                    });
                }
            });
        }
        
        return result;
    }
    
    // Получение текущего множителя скорости игры
    public getGameSpeed(): number {
        return this.getState(SkillType.GAME_SPEED) || 1; // По умолчанию 1, если не установлено
    }
    
    // Helper to check if skill is permanent
    private isPermanentSkill(type: SkillType): boolean {
        return this.permanentSkillTypes.has(type);
    }
    
    // Get emblems from the server
    public getEmblems(): number {
        if (this.permanentSkillService.isConnected()) {
            return this.permanentSkillService.getEmblems();
        }
        return 0;
    }
    
    // Add emblems
    public addEmblems(amount: number): void {
        if (this.permanentSkillService.isConnected()) {
            this.permanentSkillService.addEmblems(amount);
        }
    }
} 
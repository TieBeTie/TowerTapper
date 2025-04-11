import { SkillType } from '../types/SkillType';
import { GameServerGateway, PlayerSkill } from '../api/GameServerGateway';
import { SkillStateManager } from '../managers/SkillStateManager';
import { GameServerFactory } from '../api/GameServerFactory';

export class InitialSkillService {
    private static instance: InitialSkillService;
    private server: GameServerGateway;
    private skillStateManager: SkillStateManager | null = null;
    private serverSkills: Map<SkillType, number> = new Map(); // На самом деле это initial_level
    private telegramId: string = '';
    private connected: boolean = false;

    private constructor() {
        this.server = GameServerFactory.createGameServer();
        
        // Listen for game state updates from the server
        this.server.onGameStateUpdate((state) => {
            // Update the Initial skills
            this.serverSkills.clear();
            console.log('Game state update received:', state);
            console.log('Player skills received:', state.player_skills);
            
            state.player_skills.forEach((skill: any) => {
                // Check for both skillType and skill_type properties
                const skillTypeValue = skill.skillType || skill.skill_type;
                const normalizedSkillType = this.normalizeSkillType(skillTypeValue);
                const level = skill.level || 0;
                
                console.log(`Setting initial level for skill: ${skillTypeValue} (normalized: ${normalizedSkillType}) to ${level}`);
                this.serverSkills.set(normalizedSkillType as SkillType, level);
            });
        });
    }

    /**
     * Normalize skill type to ensure it matches the SkillType enum
     */
    private normalizeSkillType(skillType: string): string {
        // Check if skillType is null or undefined
        if (!skillType) {
            console.warn('Received undefined or null skill type from server');
            return '';
        }
        
        // Convert to uppercase to match enum values
        const upperSkillType = skillType.toUpperCase();
        
        // Check if the skill type exists in the enum
        const enumValues = Object.values(SkillType);
        for (const value of enumValues) {
            if (value.toUpperCase() === upperSkillType) {
                return value;
            }
        }
        
        console.warn(`Unknown skill type received from server: ${skillType}`);
        return skillType;
    }

    public static getInstance(): InitialSkillService {
        if (!InitialSkillService.instance) {
            InitialSkillService.instance = new InitialSkillService();
        }
        return InitialSkillService.instance;
    }

    /**
     * Connect to the game server with a Telegram ID
     */
    public async connect(telegramId: string): Promise<void> {
        if (this.connected) {
            return;
        }
        
        this.telegramId = telegramId;
        
        try {
            await this.server.connect(telegramId);
            this.connected = true;
        } catch (error) {
            console.error('Failed to connect to game server:', error);
            throw error;
        }
    }

    /**
     * Disconnect from the game server
     */
    public disconnect(): void {
        if (!this.connected) {
            return;
        }
        
        this.server.disconnect();
        this.connected = false;
    }

    /**
     * Update a Initial skill level on the server
     */
    public updateSkill(skillType: SkillType, level: number): void {
        if (!this.connected) {
            console.warn('Not connected to server, unable to update skill');
            return;
        }
        
        this.server.updateSkill(skillType, level);
    }

    /**
     * Get the initial level of a skill
     */
    public getInitialLevel(skillType: SkillType): number {
        return this.serverSkills.get(skillType) || 0;
    }

    /**
     * Get the skill level (для обратной совместимости)
     * На самом деле возвращает initial_level
     */
    public getSkillLevel(skillType: SkillType): number {
        return this.getInitialLevel(skillType);
    }

    /**
     * Check if the service is connected to a server
     */
    public isConnected(): boolean {
        return this.connected;
    }
} 
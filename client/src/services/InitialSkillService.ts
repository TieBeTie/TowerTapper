import { SkillType } from '../types/SkillType';
import { GameServerGateway, PlayerSkill } from '../api/GameServerGateway';
import { SkillStateManager } from '../managers/SkillStateManager';
import { GameServerFactory } from '../api/GameServerFactory';

export class InitialSkillService {
    private static instance: InitialSkillService;
    private server: GameServerGateway;
    private skillStateManager: SkillStateManager | null = null;
    private serverSkills: Map<SkillType, number> = new Map();
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
            console.log('First skill raw data:', state.player_skills[0]);
            
            state.player_skills.forEach((skill: any) => {
                // Check for both skillType and skill_type properties
                const skillTypeValue = skill.skillType || skill.skill_type;
                const normalizedSkillType = this.normalizeSkillType(skillTypeValue);
                console.log(`Setting skill: ${skillTypeValue} (normalized: ${normalizedSkillType}) to level ${skill.level}`);
                this.serverSkills.set(normalizedSkillType as SkillType, skill.level);
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
     * Get the Initial level of a skill
     */
    public getSkillLevel(skillType: SkillType): number {
        return this.serverSkills.get(skillType) || 0;
    }

    /**
     * Check if the service is connected to a server
     */
    public isConnected(): boolean {
        return this.connected;
    }
} 
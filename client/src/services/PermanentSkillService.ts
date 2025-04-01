import { SkillType } from '../types/SkillType';
import { GameServerGateway, PlayerSkill } from '../api/GameServerGateway';
import { SkillStateManager } from '../managers/SkillStateManager';
import { GameServerFactory } from '../api/GameServerFactory';

export class PermanentSkillService {
    private static instance: PermanentSkillService;
    private server: GameServerGateway;
    private skillStateManager: SkillStateManager;
    private serverSkills: Map<SkillType, number> = new Map();
    private emblems: number = 0;
    private telegramId: string = '';
    private connected: boolean = false;

    private constructor() {
        this.server = GameServerFactory.createGameServer();
        this.skillStateManager = SkillStateManager.getInstance();
        
        // Listen for game state updates from the server
        this.server.onGameStateUpdate((state) => {
            this.emblems = state.emblems;
            
            // Update the permanent skills
            this.serverSkills.clear();
            state.player_skills.forEach((skill: PlayerSkill) => {
                this.serverSkills.set(skill.skillType as SkillType, skill.level);
            });
        });
    }

    public static getInstance(): PermanentSkillService {
        if (!PermanentSkillService.instance) {
            PermanentSkillService.instance = new PermanentSkillService();
        }
        return PermanentSkillService.instance;
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
     * Get player's emblem count
     */
    public getEmblems(): number {
        return this.emblems;
    }

    /**
     * Add emblems to the player
     */
    public addEmblems(amount: number): void {
        if (!this.connected) {
            console.warn('Not connected to server, unable to add emblems');
            return;
        }
        
        this.server.addEmblems(amount);
    }

    /**
     * Update a permanent skill level on the server
     */
    public updateSkill(skillType: SkillType, level: number): void {
        if (!this.connected) {
            console.warn('Not connected to server, unable to update skill');
            return;
        }
        
        this.server.updateSkill(skillType, level);
    }

    /**
     * Get the permanent level of a skill
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
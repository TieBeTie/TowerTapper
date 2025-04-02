import { GameServerGateway } from '../api/GameServerGateway';
import { GameServerFactory } from '../api/GameServerFactory';

/**
 * A singleton class to manage emblem storage and synchronization with the server.
 * This handles all emblem-related operations and server sync.
 */
export class EmblemStorage {
    private static instance: EmblemStorage;
    private server: GameServerGateway;
    private emblemCount: number = 0;
    private connected: boolean = false;
    private telegramId: string = '';

    private constructor() {
        this.server = GameServerFactory.createGameServer();
        
        // Listen for game state updates from the server
        this.server.onGameStateUpdate((state) => {
            this.emblemCount = state.emblems;
            console.log(`[EmblemStorage] Received emblem update from server: ${this.emblemCount}`);
        });
    }
    
    /**
     * Get the singleton instance
     */
    public static getInstance(): EmblemStorage {
        if (!EmblemStorage.instance) {
            EmblemStorage.instance = new EmblemStorage();
        }
        return EmblemStorage.instance;
    }
    
    /**
     * Connect to the game server
     */
    public async connect(telegramId: string): Promise<void> {
        if (this.connected) {
            return;
        }
        
        this.telegramId = telegramId;
        
        try {
            await this.server.connect(telegramId);
            this.connected = true;
            console.log(`[EmblemStorage] Connected to server with Telegram ID: ${telegramId}`);
        } catch (error) {
            console.error('[EmblemStorage] Failed to connect to game server:', error);
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
        console.log('[EmblemStorage] Disconnected from server');
    }
    
    /**
     * Get the current emblem count
     */
    public getEmblems(): number {
        return this.emblemCount;
    }
    
    /**
     * Add emblems to the player's count
     * This immediately syncs with the server
     */
    public addEmblems(amount: number): void {
        if (!this.connected) {
            console.warn('[EmblemStorage] Not connected to server, unable to add emblems');
            // Still update local value for UI purposes
            this.emblemCount += amount;
            return;
        }
        
        // Update local value
        this.emblemCount += amount;
        // Sync with server
        this.server.addEmblems(amount);
        console.log(`[EmblemStorage] Added ${amount} emblems, new total: ${this.emblemCount}`);
    }
    
    /**
     * Set the exact emblem count
     * Used for synchronization purposes
     */
    public setEmblems(amount: number): void {
        // Only update if different to avoid unnecessary sync
        if (this.emblemCount !== amount) {
            const diff = amount - this.emblemCount;
            
            if (this.connected) {
                if (diff !== 0) {
                    // Use addEmblems to sync the difference with the server
                    this.server.addEmblems(diff);
                }
            }
            
            this.emblemCount = amount;
            console.log(`[EmblemStorage] Set emblems to ${amount}`);
        }
    }
    
    /**
     * Remove emblems from the player's count
     * This immediately syncs with the server
     */
    public removeEmblems(amount: number): void {
        const newAmount = Math.max(0, this.emblemCount - amount);
        this.setEmblems(newAmount);
        console.log(`[EmblemStorage] Removed ${amount} emblems, new total: ${this.emblemCount}`);
    }
    
    /**
     * Check if connected to server
     */
    public isConnected(): boolean {
        return this.connected;
    }
} 
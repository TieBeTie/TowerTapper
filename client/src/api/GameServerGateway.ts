export interface PlayerSkill {
    skillType: string;
    level: number;
}

export interface GameState {
    emblems: number;
    player_skills: PlayerSkill[];
}

export interface GameServerGateway {
    connect(telegramId: string): Promise<void>;
    disconnect(): void;

    // Game events
    onGameStateUpdate(callback: (state: GameState) => void): void;
    
    // Emblem and skill actions
    updateEmblems(emblems: number): void;
    addEmblems(amount: number): void;
    updateSkill(skillType: string, level: number): void;
}

// WebSocket implementation
export class WebSocketGameServer implements GameServerGateway {
    private ws: WebSocket | null = null;
    private gameStateCallback: ((state: GameState) => void) | null = null;

    async connect(telegramId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(`ws://localhost:8080/ws?telegram_id=${telegramId}`);

                this.ws.onopen = () => {
                    console.log('Connected to game server');
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    const message = JSON.parse(event.data);

                    switch (message.type) {
                        case 'initial_state':
                        case 'game_state':
                            if (this.gameStateCallback) {
                                this.gameStateCallback(message.payload);
                            }
                            break;
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    onGameStateUpdate(callback: (state: GameState) => void): void {
        this.gameStateCallback = callback;
    }

    updateEmblems(emblems: number): void {
        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: 'update_emblems',
                payload: emblems
            }));
        }
    }

    addEmblems(amount: number): void {
        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: 'add_emblems',
                payload: amount
            }));
        }
    }

    updateSkill(skillType: string, level: number): void {
        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: 'update_skill',
                payload: {
                    skill_type: skillType,
                    level: level
                }
            }));
        }
    }
}

// Mock implementation for testing
export class MockGameServer implements GameServerGateway {
    private gameStateCallback: ((state: GameState) => void) | null = null;
    private playerSkills: PlayerSkill[] = [];
    private emblems: number = 0;

    async connect(): Promise<void> {
        console.log('Connected to mock server');
    }

    disconnect(): void {
        console.log('Disconnected from mock server');
    }

    onGameStateUpdate(callback: (state: GameState) => void): void {
        this.gameStateCallback = callback;
        // Send initial mock state
        if (this.gameStateCallback) {
            this.gameStateCallback({
                emblems: this.emblems,
                player_skills: this.playerSkills
            });
        }
    }

    updateEmblems(emblems: number): void {
        console.log('Mock: Updating emblems to', emblems);
        this.emblems = emblems;

        if (this.gameStateCallback) {
            this.gameStateCallback({
                emblems: this.emblems,
                player_skills: this.playerSkills
            });
        }
    }

    addEmblems(amount: number): void {
        console.log('Mock: Adding emblems', amount);
        this.emblems += amount;

        if (this.gameStateCallback) {
            this.gameStateCallback({
                emblems: this.emblems,
                player_skills: this.playerSkills
            });
        }
    }

    updateSkill(skillType: string, level: number): void {
        console.log('Mock: Updating skill', skillType, 'to level', level);
        
        // Update existing skill or add new one
        const existingSkillIndex = this.playerSkills.findIndex(s => s.skillType === skillType);
        if (existingSkillIndex >= 0) {
            this.playerSkills[existingSkillIndex].level = level;
        } else {
            this.playerSkills.push({ skillType, level });
        }

        if (this.gameStateCallback) {
            this.gameStateCallback({
                emblems: this.emblems,
                player_skills: this.playerSkills
            });
        }
    }
} 
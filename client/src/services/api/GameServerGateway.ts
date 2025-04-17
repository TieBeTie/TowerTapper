import { PlayerRating } from '../../game/types/PlayerRating';

export interface PlayerSkill {
    skillType: string;
    level: number;
    initialLevel?: number; // Начальный уровень навыка
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
                // Build WebSocket URL based on the current window location
                const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
                const host = window.location.hostname;
                const wsUrl = `${protocol}://${host}/ws`;
                
                console.log(`Attempting to connect to WebSocket at: ${wsUrl}?telegram_id=${telegramId}`);
                
                this.ws = new WebSocket(`${wsUrl}?telegram_id=${telegramId}`);

                let connectedHandled = false;
                
                this.ws.onopen = () => {
                    console.log('WebSocket connection opened successfully');
                    connectedHandled = true;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        console.log('Received WebSocket message:', message);

                        switch (message.type) {
                            case 'initial_state':
                            case 'game_state':
                                if (this.gameStateCallback) {
                                    this.gameStateCallback(message.payload);
                                }
                                break;
                            default:
                                console.log(`Unhandled message type: ${message.type}`);
                        }
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    if (!connectedHandled) {
                        connectedHandled = true;
                        reject(new Error('WebSocket connection error'));
                    }
                };
                
                this.ws.onclose = (event) => {
                    console.log(`WebSocket connection closed: Code=${event.code}, Reason=${event.reason || 'None provided'}`);
                    if (!connectedHandled) {
                        connectedHandled = true;
                        reject(new Error(`Connection closed: ${event.reason || 'Unknown reason'}`));
                    }
                };
                
                // Set a timeout in case the connection hangs
                setTimeout(() => {
                    if (!connectedHandled) {
                        connectedHandled = true;
                        if (this.ws) {
                            this.ws.close();
                        }
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 10000); // 10 seconds timeout
                
            } catch (error) {
                console.error('Error creating WebSocket:', error);
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

// --- Rating API ---
// Базовый URL для API запросов
const API_BASE_URL = '/api'; 

export async function fetchTopPlayers(limit: number = 10): Promise<PlayerRating[]> {
  const res = await fetch(`${API_BASE_URL}/rating/top?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch top players');
  return await res.json();
}

export async function fetchPlayerRank(telegramId: number): Promise<{ rank: number }> {
  const res = await fetch(`${API_BASE_URL}/rating/rank?telegram_id=${telegramId}`);
  if (!res.ok) throw new Error('Failed to fetch player rank');
  return await res.json();
} 
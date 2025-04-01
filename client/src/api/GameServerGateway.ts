export interface GameState {
    castle: {
        level: number;
        health: number;
        arrowSpeed: number;
        arrowDamage: number;
    };
    gold: number;
}

export interface GameServerGateway {
    connect(telegramId: string): Promise<void>;
    disconnect(): void;

    // Game events
    onGameStateUpdate(callback: (state: GameState) => void): void;
    onClickConfirmed(callback: () => void): void;

    // Player actions
    sendClick(): void;
    sendEnemyKilled(gold: number): void;
    sendCastleDamaged(health: number): void;
}

// WebSocket implementation
export class WebSocketGameServer implements GameServerGateway {
    private ws: WebSocket | null = null;
    private gameStateCallback: ((state: GameState) => void) | null = null;
    private clickConfirmedCallback: (() => void) | null = null;

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

                        case 'click_confirmed':
                            if (this.clickConfirmedCallback) {
                                this.clickConfirmedCallback();
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

    onClickConfirmed(callback: () => void): void {
        this.clickConfirmedCallback = callback;
    }

    sendClick(): void {
        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: 'click',
                payload: null
            }));
        }
    }

    sendEnemyKilled(gold: number): void {
        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: 'enemy_killed',
                payload: gold
            }));
        }
    }

    sendCastleDamaged(health: number): void {
        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: 'castle_damaged',
                payload: health
            }));
        }
    }
}

// Mock implementation for testing
export class MockGameServer implements GameServerGateway {
    private gameStateCallback: ((state: GameState) => void) | null = null;
    private clickConfirmedCallback: (() => void) | null = null;

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
                castle: {
                    level: 1,
                    health: 100,
                    arrowSpeed: 1.0,
                    arrowDamage: 1
                },
                gold: 0
            });
        }
    }

    onClickConfirmed(callback: () => void): void {
        this.clickConfirmedCallback = callback;
    }

    sendClick(): void {
        console.log('Mock: Click sent');
        if (this.clickConfirmedCallback) {
            this.clickConfirmedCallback();
        }
    }

    sendEnemyKilled(gold: number): void {
        console.log('Mock: Enemy killed, gold:', gold);
    }

    sendCastleDamaged(health: number): void {
        console.log('Mock: Castle damaged, health:', health);
    }
} 
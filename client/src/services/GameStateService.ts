import { GameServerGateway, GameState } from '../api/GameServerGateway';

export class GameStateService {
    private server: GameServerGateway;
    private gameState: GameState | null = null;
    private stateUpdateCallbacks: ((state: GameState) => void)[] = [];

    constructor(server: GameServerGateway) {
        this.server = server;
        this.setupServerListeners();
    }

    private setupServerListeners(): void {
        this.server.onGameStateUpdate((state: GameState) => {
            this.gameState = state;
            this.notifyStateUpdate();
        });

        this.server.onClickConfirmed(() => {
            // Здесь можно добавить логику подтверждения клика
            console.log('Click confirmed by server');
        });
    }

    private notifyStateUpdate(): void {
        if (this.gameState) {
            this.stateUpdateCallbacks.forEach(callback => callback(this.gameState!));
        }
    }

    async connect(telegramId: string): Promise<void> {
        await this.server.connect(telegramId);
    }

    disconnect(): void {
        this.server.disconnect();
    }

    onStateUpdate(callback: (state: GameState) => void): void {
        this.stateUpdateCallbacks.push(callback);
        // Если состояние уже есть, сразу отправляем его
        if (this.gameState) {
            callback(this.gameState);
        }
    }

    handleClick(): void {
        this.server.sendClick();
    }

    handleEnemyKilled(gold: number): void {
        this.server.sendEnemyKilled(gold);
    }

    handleCastleDamaged(health: number): void {
        this.server.sendCastleDamaged(health);
    }

    getCurrentState(): GameState | null {
        return this.gameState;
    }
} 
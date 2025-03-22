import { EventEmitter } from 'events';
import { GameServerGateway } from '../api/GameServerGateway';

export interface CoinsState {
    amount: number;
    lastSync: number;
}

export interface CoinChangeEvent {
    amount: number;
    total: number;
}

export type CoinServiceEvents = {
    'change': (amount: number) => void;
    'add': (event: CoinChangeEvent) => void;
    'subtract': (event: CoinChangeEvent) => void;
    'sync': (state: CoinsState) => void;
    'syncError': (error: Error) => void;
    'error': (error: Error) => void;
}

export class CoinsService {
    private static instance: CoinsService;
    private state: CoinsState;
    private events: EventEmitter;
    private syncInterval: number = 10000; // 10 seconds
    private syncTimer: NodeJS.Timeout | null = null;
    private server: GameServerGateway;

    private constructor(server: GameServerGateway) {
        this.server = server;
        this.state = {
            amount: 0,
            lastSync: Date.now()
        };
        this.events = new EventEmitter();
        this.startSync();
    }

    public static getInstance(server?: GameServerGateway): CoinsService {
        if (!CoinsService.instance) {
            if (!server) {
                throw new Error('GameServerGateway instance is required for CoinsService initialization');
            }
            CoinsService.instance = new CoinsService(server);
        }
        return CoinsService.instance;
    }

    private startSync(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }

        this.syncTimer = setInterval(() => {
            this.syncWithServer();
        }, this.syncInterval);
    }

    private async syncWithServer(): Promise<void> {
        try {
            // В будущем здесь будет реальная синхронизация с сервером
            this.state.lastSync = Date.now();
            this.events.emit('sync', this.state);
        } catch (error) {
            console.error('Failed to sync coins with server:', error);
            this.events.emit('syncError', error);
        }
    }

    public getAmount(): number {
        return this.state.amount;
    }

    public async add(amount: number): Promise<void> {
        if (amount <= 0) return;

        const newAmount = this.state.amount + amount;
        await this.setAmount(newAmount);
        this.events.emit('add', { amount, total: this.state.amount });
    }

    public async subtract(amount: number): Promise<boolean> {
        if (amount <= 0) return true;
        if (this.state.amount < amount) return false;

        const newAmount = this.state.amount - amount;
        await this.setAmount(newAmount);
        this.events.emit('subtract', { amount, total: this.state.amount });
        return true;
    }

    private async setAmount(amount: number): Promise<void> {
        this.state.amount = amount;
        this.events.emit('change', this.state.amount);
        
        try {
            await this.server.sendEnemyKilled(this.state.amount);
        } catch (error) {
            console.error('Failed to update coins on server:', error);
            this.events.emit('error', error instanceof Error ? error : new Error(String(error)));
        }
    }

    public on<E extends keyof CoinServiceEvents>(
        event: E,
        listener: CoinServiceEvents[E]
    ): void {
        this.events.on(event, listener);
    }

    public off<E extends keyof CoinServiceEvents>(
        event: E,
        listener: CoinServiceEvents[E]
    ): void {
        this.events.off(event, listener);
    }

    public destroy(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
        this.events.removeAllListeners();
    }
} 
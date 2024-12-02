import { GameServerGateway, WebSocketGameServer, MockGameServer } from './GameServerGateway';

export class GameServerFactory {
    static create(useMock: boolean = false): GameServerGateway {
        if (useMock) {
            return new MockGameServer();
        }
        return new WebSocketGameServer();
    }
} 
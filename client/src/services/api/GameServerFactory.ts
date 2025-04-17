import { GameServerGateway, WebSocketGameServer, MockGameServer } from './GameServerGateway';

export class GameServerFactory {
    static createGameServer(useMock: boolean = false): GameServerGateway {
        if (useMock) {
            return new MockGameServer();
        }
        return new WebSocketGameServer();
    }
} 
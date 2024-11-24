import Phaser from 'phaser';
import Tower from '../objects/towers/Tower';
import UIManager from '../managers/UIManager';
import EnemyManager from '../managers/EnemyManager';
import ProjectileManager from '../managers/ProjectileManager';
import TapManager from '../managers/TapManager';
import CollisionManager from '../managers/CollisionManager';
import CoinManager from '../managers/CoinManager';
import { GAME_PORT } from '../utils/Constants'; // Assuming you have a constants file

class GameScene extends Phaser.Scene {
    public tower!: Tower;
    public uiManager!: UIManager;
    enemyManager!: EnemyManager;
    projectileManager!: ProjectileManager;
    tapManager!: TapManager;
    collisionManager!: CollisionManager;
    coinManager!: CoinManager;
    coins!: number;
    socket!: WebSocket;

    constructor() {
        super({ key: 'GameScene' });
    }

    create(): void {
        const { width, height } = this.scale;
        const panelHeight = 100;

        // Create the background
        const background = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background');
        background.setOrigin(0.5, 0.5);
        background.displayWidth = this.cameras.main.width;
        background.displayHeight = this.cameras.main.height;

        // Initialize the tower before UIManager
        this.tower = new Tower(this, width / 2, (height - panelHeight) / 2, 'tower');
        this.tower.setName('tower');

        // Initialize UIManager after the tower is created
        this.uiManager = new UIManager(this);

        // Инициализация CoinManager
        this.coinManager = new CoinManager(this, this.uiManager);

        // Передача CoinManager в другие менеджеры без повторного создания
        this.enemyManager = new EnemyManager(this, this.uiManager, this.coinManager);
        this.projectileManager = new ProjectileManager(this, this.enemyManager);
        this.tapManager = new TapManager(this, this.projectileManager, this.uiManager, this.coinManager);
        this.collisionManager = new CollisionManager(this);

        // Initialize WebSocket connection
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        this.socket = new WebSocket(`${protocol}://${window.location.hostname}:${GAME_PORT}/ws`);

        this.socket.onopen = () => {
            console.log('Connected to server via WebSocket');
            // Send an initialization message
            const initMessage = { game_id: 1, action: 'init' };
            this.socket.send(JSON.stringify(initMessage));
        };

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('Received message from server:', message);
            // Handle incoming messages (e.g., game state updates)
            this.handleServerMessage(message);
        };

        this.socket.onclose = () => {
            console.log('WebSocket connection closed');
            // Optionally, attempt to reconnect after a delay
            setTimeout(() => {
                this.create(); // Reinitialize the WebSocket connection
            }, 5000);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleServerMessage(message: any): void {
        if (message.new_state) {
            // Update game state based on server message
            this.updateGameState(message.game_id, message.new_state);
        }
        // Handle other message types as needed
    }

    updateGameState(gameId: number, newState: string): void {
        // Implement logic to update the game based on new state
        console.log(`Game ${gameId} state updated to: ${newState}`);
        // Example: Update UI or game objects accordingly
        // this.uiManager.updateGameState(newState);
    }

    update(time: number, delta: number): void {
        this.projectileManager.update(time, delta);
        this.enemyManager.update(time, delta);
        // TapManager не требует цикла обновления
    }
}

export default GameScene;

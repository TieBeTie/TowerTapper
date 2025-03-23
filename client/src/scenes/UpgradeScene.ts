import Phaser from 'phaser';
import { UpgradeManager } from '../managers/UpgradeManager';
import { UpgradeHeader } from '../ui/UpgradeHeader';
import AudioManager from '../managers/AudioManager';

export class UpgradeScene extends Phaser.Scene {
    private upgradeManager!: UpgradeManager;
    private header!: UpgradeHeader;
    private audioManager!: AudioManager;

    constructor() {
        super({ key: 'UpgradeScene' });
    }

    create(): void {
        const { width, height } = this.scale;

        // Initialize AudioManager
        this.audioManager = AudioManager.getInstance(this);
        this.audioManager.playMusic();

        // Semi-transparent dark background
        this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0)
            .setInteractive();

        // Initialize upgrade manager
        this.upgradeManager = new UpgradeManager(this);

        // Create header
        const headerHeight = 60;
        this.header = new UpgradeHeader({
            width,
            height: headerHeight,
            scene: this,
            onClose: () => {
                this.scene.stop();
                this.scene.resume('GameScene');
            }
        });

        // Listen for coin updates
        const gameScene = this.scene.get('GameScene');
        gameScene.events.on('updateCoins', this.updateCoins, this);

        // Set initial coins
        const initialCoins = (gameScene as any).coinManager?.coins_count || 0;
        this.updateCoins(initialCoins);
    }

    private updateCoins(amount: number): void {
        this.header.updateCoins(amount);
    }

    shutdown(): void {
        const gameScene = this.scene.get('GameScene');
        gameScene.events.off('updateCoins', this.updateCoins, this);
    }
}

export default UpgradeScene;

import Phaser from 'phaser';
import AudioManager from '../managers/AudioManager';

class PauseScene extends Phaser.Scene {
    private audioManager!: AudioManager;

    constructor() {
        super({ key: 'PauseScene' });
    }

    create(): void {
        // Initialize AudioManager
        this.audioManager = AudioManager.getInstance(this);
        this.audioManager.playMusic();

        const { width, height } = this.scale;

        // Полупрозрачный оверлей для паузы
        this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0);

        const textConfig = {
            fontFamily: 'pixelFont',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };

        const buttonConfig = {
            ...textConfig,
            fontSize: '32px'
        };

        // Текст "Пауза"
        this.add.text(width / 2, height / 2 - 50, 'Пауза', textConfig)
            .setOrigin(0.5);

        // Кнопка "Продолжить"
        const resumeButton = this.add.text(width / 2, height / 2 + 50, 'Продолжить', buttonConfig)
            .setOrigin(0.5)
            .setInteractive();

        resumeButton.on('pointerdown', () => {
            this.scene.stop(); // Остановить PauseScene для возобновления игры
            this.scene.resume('GameScene');
        });
    }
}

export default PauseScene;
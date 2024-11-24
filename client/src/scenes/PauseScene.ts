import Phaser from 'phaser';

class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    create(): void {
        const { width, height } = this.scale;

        // Полупрозрачный оверлей для паузы
        this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0);

        // Текст "Пауза"
        this.add.text(width / 2, height / 2 - 50, 'Пауза', { fontSize: '48px', color: '#ffffff' })
            .setOrigin(0.5);

        // Кнопка "Продолжить"
        const resumeButton = this.add.text(width / 2, height / 2 + 50, 'Продолжить', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        resumeButton.on('pointerdown', () => {
            this.scene.stop(); // Остановить PauseScene для возобновления игры
            this.scene.resume('GameScene');
        });
    }
}

export default PauseScene;
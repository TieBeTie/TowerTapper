import Phaser from 'phaser';

class DeathScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DeathScene' });
    }

    create(): void {
        const { width, height } = this.scale;

        const textConfig = {
            fontFamily: 'pixelFont',
            fontSize: '48px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        };

        const buttonConfig = {
            ...textConfig,
            fontSize: '32px',
            backgroundColor: '#ff0000',
            padding: { x: 20, y: 10 }
        };

        // Добавление текста о смерти
        this.add.text(width / 2, height / 2 - 50, 'Вы проиграли!', textConfig)
            .setOrigin(0.5);

        // Кнопка возврата в меню
        const menuButton = this.add.text(width / 2, height / 2 + 50, 'Вернуться в меню', buttonConfig)
            .setOrigin(0.5)
            .setInteractive();

        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}

export default DeathScene;
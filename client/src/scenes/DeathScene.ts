import Phaser from 'phaser';

class DeathScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DeathScene' });
    }

    create(): void {
        const { width, height } = this.scale;

        // Добавление текста о смерти
        this.add.text(width / 2, height / 2 - 50, 'Вы проиграли!', {
            fontSize: '48px',
            color: '#ff0000'
        })
            .setOrigin(0.5);

        // Кнопка возврата в меню
        const menuButton = this.add.text(width / 2, height / 2 + 50, 'Вернуться в меню', {
            fontSize: '32px',
            color: '#fff',
            backgroundColor: '#ff0000',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive();

        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}

export default DeathScene;
import Phaser from 'phaser';
import GameScene from './GameScene';

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.scale;

        // Добавление фона
        this.add.image(width / 2, height / 2, 'logo');

        // Добавление кнопки "Начать игру"
        const playButton = this.add.text(width / 2, height / 2 + 100, 'Начать игру', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5).setInteractive();

        playButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

export default MenuScene;

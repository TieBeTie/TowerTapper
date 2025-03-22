import Phaser from 'phaser';

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Добавляем фон
        this.add.image(0, 0, 'background')
            .setOrigin(0, 0)
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // Анимированный монстр по центру
        const monster = this.add.sprite(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'enemy'
        );
        monster.setScale(1.5); // Делаем монстра побольше
        monster.play('enemy_walk', true);

        // Текст "ИГРАТЬ!" с PixelFont внизу
        const playText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.height * 0.65,
            'ИГРАТЬ!',
            {
                fontFamily: 'pixelFont',
                fontSize: '48px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        // Добавляем интерактивность и эффект при наведении
        playText
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                playText.setScale(1.1);
            })
            .on('pointerout', () => {
                playText.setScale(1);
            })
            .on('pointerdown', () => {
                this.scene.start('GameScene');
            });
    }
}

export default MenuScene;
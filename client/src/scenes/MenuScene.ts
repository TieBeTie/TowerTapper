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
            '►',
            {
                fontFamily: 'pixelFont',
                fontSize: '72px',
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
                this.startGame();
            });
    }

    private startGame(): void {
        // Создаем черный прямоугольник на весь экран
        const { width, height } = this.scale;
        const fadeRect = this.add.rectangle(0, 0, width, height, 0x000000, 0);
        fadeRect.setOrigin(0);

        // Анимируем затемнение и масштабирование кнопки
        this.tweens.add({
            targets: fadeRect,
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });

        // Находим монстра и анимируем его исчезновение
        const monster = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Sprite && 
            (child as Phaser.GameObjects.Sprite).texture.key === 'enemy'
        ) as Phaser.GameObjects.Sprite;

        if (monster) {
            this.tweens.add({
                targets: monster,
                scale: 0.5,
                alpha: 0,
                duration: 500,
                ease: 'Power2'
            });
        }

        // Находим кнопку "Играть" и анимируем её
        const playButton = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Text && 
            (child as Phaser.GameObjects.Text).text === '►'
        ) as Phaser.GameObjects.Text;

        if (playButton) {
            this.tweens.add({
                targets: playButton,
                scale: 1.5,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    // После завершения анимации запускаем GameScene
                    this.scene.start('GameScene');
                }
            });
        }
    }
}

export default MenuScene;
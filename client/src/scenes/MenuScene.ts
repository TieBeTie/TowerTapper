import Phaser from 'phaser';

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create(): void {
        const { width, height } = this.scale;

        // Создаем фон
        this.add.image(0, 0, 'background')
            .setOrigin(0, 0)
            .setDisplaySize(width, height);

        // Создаем монстра в центре экрана, но с маленьким размером
        const monster = this.add.sprite(width / 2, height / 2, 'enemy');
        monster.setScale(0.1);
        monster.play('enemy_walk');

        // Анимация появления монстра
        this.tweens.add({
            targets: monster,
            scale: 1.5,
            duration: 800,
            ease: 'Bounce.out',
            onComplete: () => {
                // После появления начинаем покачивание
                this.tweens.add({
                    targets: monster,
                    y: height / 2 + 10,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        // Создаем кнопку "Играть"
        const playButton = this.add.text(width / 2, height * 0.7, '►', {
            fontSize: '64px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Добавляем интерактивность кнопке
        playButton.setInteractive()
            .on('pointerover', () => {
                playButton.setScale(1.2);
            })
            .on('pointerout', () => {
                playButton.setScale(1);
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
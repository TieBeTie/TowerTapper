import Phaser from 'phaser';
import AudioManager from '../managers/AudioManager';
import { IScene } from '../types/IScene';
import { ScreenManager } from '../managers/ScreenManager';
import { UIManager } from '../managers/UIManager';

export default class MenuScene extends Phaser.Scene implements IScene {
    private audioManager!: AudioManager;
    public screenManager!: ScreenManager;
    public uiManager!: UIManager;

    constructor() {
        super({ key: 'MenuScene' });
    }

    preload(): void {
        // Загрузка ресурсов если нужно
    }

    create(): void {
        // Initialize ScreenManager
        this.screenManager = new ScreenManager(this);
        
        // Initialize AudioManager
        this.audioManager = AudioManager.getInstance(this);
        this.audioManager.playMusic();

        // Создаем фон через ScreenManager
        this.screenManager.setupBackground();

        // Получаем размеры экрана через ScreenManager
        const { width, height } = this.screenManager.getScreenSize();
        const gameScale = this.screenManager.getGameScale();
        const center = this.screenManager.getScreenCenter();

        // Создаем монстра в центре экрана, но с маленьким размером
        const monster = this.add.sprite(center.x, center.y, 'enemy');
        monster.setScale(0.5 * gameScale); // Уменьшаем начальный размер
        monster.play('enemy_walk');

        // Анимация появления монстра
        this.tweens.add({
            targets: monster,
            scale: 0.8 * gameScale, // Уменьшаем финальный размер
            duration: 800,
            ease: 'Bounce.out',
            onComplete: () => {
                // После появления начинаем покачивание
                this.tweens.add({
                    targets: monster,
                    y: center.y + 5, // Уменьшаем амплитуду покачивания
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        // Создаем кнопку "Играть" с использованием адаптивного шрифта
        const fontSize = this.screenManager.getResponsiveFontSize(64);
        const playButton = this.add.text(center.x, height * 0.7, '►', {
            fontSize: `${fontSize}px`,
            color: '#ffffff',
            fontFamily: 'pixelFont'
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
                // Play sound before starting the game
                this.audioManager.playSound('playButton');
                this.startGame();
            });
            
        // Подписываемся на изменение размера экрана
        this.events.on('screenResize', this.handleScreenResize, this);
    }
    
    private handleScreenResize(gameScale: number): void {
        // Находим и обновляем размер монстра
        const monster = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Sprite && 
            (child as Phaser.GameObjects.Sprite).texture.key === 'enemy'
        ) as Phaser.GameObjects.Sprite;
        
        if (monster) {
            monster.setScale(0.8 * gameScale); // Обновляем размер при ресайзе
            monster.setPosition(this.screenManager.getScreenCenter().x, this.screenManager.getScreenCenter().y);
        }
        
        // Находим и обновляем размер кнопки
        const playButton = this.children.list.find(child => 
            child instanceof Phaser.GameObjects.Text && 
            (child as Phaser.GameObjects.Text).text === '►'
        ) as Phaser.GameObjects.Text;
        
        if (playButton) {
            const fontSize = this.screenManager.getResponsiveFontSize(64);
            playButton.setFontSize(fontSize);
            playButton.setPosition(
                this.screenManager.getScreenCenter().x,
                this.screenManager.getScreenSize().height * 0.7
            );
        }
    }

    update(time: number, delta: number): void {
        // Обновление логики если нужно
    }

    private startGame(): void {
        // Создаем затемнение через ScreenManager
        const fadeRect = this.screenManager.createFadeOverlay();

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
                scale: 0.5 * this.screenManager.getGameScale(), // Учитываем масштаб игры
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

    destroy(): void {
        // Отписываемся от событий
        this.events.off('screenResize', this.handleScreenResize, this);
        
        if (this.screenManager) {
            this.screenManager.destroy();
        }
    }
}
// managers/UIManager.js
import Phaser from 'phaser';
import Button from '../ui/Button';
// Start of Selection
class UIManager {
    // ... existing properties ...

    // Add missing class properties with definite assignment assertions
    private uiContainer!: Phaser.GameObjects.Container;
    private playPauseButton!: Button;
    private upgradeButton!: Button;
    private coinsText!: Phaser.GameObjects.Text;
    private tapText!: Phaser.GameObjects.Text;
    private isPaused: boolean = false;

    constructor(private scene: Phaser.Scene) {
        this.createUI();
    }

    createUI() {
        const { width, height } = this.scene.scale;
        const panelHeight = 100;

        // Создание нижней панели
        const panel = this.scene.add.graphics();
        panel.fillStyle(0x333333, 1);
        panel.fillRect(0, height - panelHeight, width, panelHeight);
        // Start of Selection
        // Start of Selection
        // Создание контейнера для UI элементов на панели
        this.uiContainer = this.scene.add.container(0, height - panelHeight) as Phaser.GameObjects.Container;

        // Параметры размещения кнопок
        const buttonSpacing = width / 4;

        // Кнопка Плей/Пауза
        this.playPauseButton = new Button({
            scene: this.scene,
            x: buttonSpacing,
            y: panelHeight / 2,
            texture: 'pauseButton',
            callback: () => {
                if (this.isPaused) {
                    this.scene.scene.resume();
                    this.isPaused = false;
                    this.playPauseButton.setTexture('pauseButton');
                } else {
                    this.scene.scene.pause();
                    this.isPaused = true;
                    this.playPauseButton.setTexture('playButton');
                }
            }
        });

        // Кнопка Улучшения
        this.upgradeButton = new Button({
            scene: this.scene,
            x: 3 * buttonSpacing,
            y: panelHeight / 2,
            texture: 'upgradeButton',
            callback: () => {
                this.scene.scene.launch('UpgradeScene');
                this.scene.scene.pause();
            }
        });

        // Добавление кнопок в контейнер
        this.uiContainer.add([this.playPauseButton, this.upgradeButton]);

        // Инициализация монет и коэффициента тапания
        this.coinsText = this.scene.add.text(16, 16, 'Монеты: 0', { fontSize: '24px', color: '#fff' });
        this.tapText = this.scene.add.text(16, 50, 'Коэффициент тапания: 1.0', { fontSize: '24px', color: '#fff' });
    }

    updateCoins(coins: number) {
        this.coinsText.setText(`Монеты: ${Math.floor(coins)}`);
    }

    updateTapCoefficient(coefficient: number) {
        this.tapText.setText(`Коэффициент тапания: ${coefficient.toFixed(1)}`);
    }
}

export default UIManager;

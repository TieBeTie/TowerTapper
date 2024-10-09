// managers/UIManager.js
import Phaser from 'phaser';
import Button from '../ui/Button';

class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.createUI();
    }

    createUI() {
        const { width, height } = this.scene.scale;
        const panelHeight = 100;

        // Создание нижней панели
        const panel = this.scene.add.graphics();
        panel.fillStyle(0x333333, 1);
        panel.fillRect(0, height - panelHeight, width, panelHeight);

        // Создание контейнера для UI элементов на панели
        this.uiContainer = this.scene.add.container(0, height - panelHeight);

        // Параметры размещения кнопок
        const buttonSpacing = width / 4;

        // Кнопка Плей/Пауза
        this.isPaused = false;
        this.playPauseButton = new Button(this.scene, buttonSpacing, panelHeight / 2, 'pauseButton', () => {
            if (this.isPaused) {
                this.scene.scene.resume();
                this.isPaused = false;
                this.playPauseButton.setTexture('pauseButton');
            } else {
                this.scene.scene.pause();
                this.isPaused = true;
                this.playPauseButton.setTexture('playButton');
            }
        });

        // Кнопка Улучшения
        this.upgradeButton = new Button(this.scene, 3 * buttonSpacing, panelHeight / 2, 'upgradeButton', () => {
            this.scene.scene.launch('UpgradeScene');
            this.scene.scene.pause();
        });

        // Добавление кнопок в контейнер
        this.uiContainer.add([this.playPauseButton, this.upgradeButton]);

        // Инициализация монет и коэффициента тапания
        this.coinsText = this.scene.add.text(16, 16, 'Монеты: 0', { fontSize: '24px', fill: '#fff' });
        this.tapText = this.scene.add.text(16, 50, 'Коэффициент тапания: 1.0', { fontSize: '24px', fill: '#fff' });
    }

    updateCoins(coins) {
        this.coinsText.setText(`Монеты: ${Math.floor(coins)}`);
    }

    updateTapCoefficient(coefficient) {
        this.tapText.setText(`Коэффициент тапания: ${coefficient.toFixed(1)}`);
    }
}

export default UIManager;

// managers/UIManager.js
import Phaser from 'phaser';
import Button from '../ui/Button';
import Tower from '../objects/towers/Tower';

class UIManager {
    private uiContainer!: Phaser.GameObjects.Container;
    private playPauseButton!: Button;
    private upgradeButton!: Button;
    private coinIcon!: Phaser.GameObjects.Image;
    private coinNumberText!: Phaser.GameObjects.Text;
    private tapText!: Phaser.GameObjects.Text;
    private isPaused: boolean = false;
    private coinsCount: number = 0;
    private tapCoefficient: number = 1.0;

    constructor(private scene: Phaser.Scene) {
        this.createUI();
    }

    createUI() {
        const { width, height } = this.scene.scale;
        const panelHeight = 100;

        // Create the bottom panel
        const panel = this.scene.add.graphics();
        panel.fillStyle(0x333333, 1);
        panel.fillRect(0, height - panelHeight, width, panelHeight);

        // Create a container for UI elements on the panel
        this.uiContainer = this.scene.add.container(0, height - panelHeight);

        // Button placement parameters
        const buttonSpacing = width / 4;

        // Play/Pause Button
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

        // Upgrade Button
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

        // Add buttons to the container
        this.uiContainer.add([this.playPauseButton, this.upgradeButton]);

        // Create coin icon and number text
        this.coinIcon = this.scene.add.image(16, 16, 'coin').setOrigin(0, 0);
        this.coinIcon.setDisplaySize(24, 24);

        this.coinNumberText = this.scene.add.text(46, 16, `${Math.floor(this.coinsCount)}`, {
            fontFamily: 'PixelFont',
            fontSize: '24px',
            color: '#fff'
        });

        // Ensure tower is defined and get its position
        const tower = this.scene.children.getByName('tower') as Tower;
        if (tower) {
            const towerPosition = tower.getCenter();
            this.tapText = this.scene.add.text(towerPosition.x, towerPosition.y + 50, `X ${this.tapCoefficient.toFixed(1)}`, {
                fontFamily: 'PixelFont',
                fontSize: '24px',
                color: '#fff'
            }).setOrigin(0.5, 0.5);
        } else {
            console.error('Tower is not defined in the scene.');
        }
    }

    updateCoins(coins: number) {
        this.coinsCount = coins;
        this.coinNumberText.setText(`${Math.floor(this.coinsCount)}`);
    }

    updateTapCoefficient(coefficient: number) {
        this.tapCoefficient = coefficient;
        this.tapText.setText(`X ${this.tapCoefficient.toFixed(1)}`);
    }
}

export default UIManager;

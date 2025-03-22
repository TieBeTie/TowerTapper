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
        this.scene.scale.on('resize', this.handleResize, this);
    }

    private handleResize(gameSize: Phaser.Structs.Size): void {
        const { width, height } = gameSize;
        const baseWidth = this.scene.scale.baseSize.width;
        const baseHeight = this.scene.scale.baseSize.height;
        const scaleX = width / baseWidth;
        const scaleY = height / baseHeight;
        const scale = Math.min(scaleX, scaleY);

        // Update panel position
        const panelHeight = 100 * scale;
        this.uiContainer.setY(height - panelHeight);

        // Update button positions
        const buttonSpacing = width / 4;
        this.playPauseButton.setX(buttonSpacing);
        this.upgradeButton.setX(3 * buttonSpacing);

        // Update coin icon and text
        const iconSize = 40 * scale;
        this.coinIcon.setDisplaySize(iconSize, iconSize);
        this.coinIcon.setPosition(20 * scale, 20 * scale);

        // Update text
        const fontSize = 32 * scale;
        this.coinNumberText.setPosition(70 * scale, 25 * scale);
        this.coinNumberText.setStyle({ fontSize: `${fontSize}px` });

        // Update tap text if tower exists
        const tower = this.scene.children.getByName('tower') as Tower;
        if (tower) {
            const towerPosition = tower.getCenter();
            this.tapText.setPosition(towerPosition.x - 25 * scale, towerPosition.y + 170 * scale);
            this.tapText.setStyle({ fontSize: `${fontSize}px` });
        }
    }

    createUI() {
        const { width, height } = this.scene.scale;
        const baseWidth = this.scene.scale.baseSize.width;
        const baseHeight = this.scene.scale.baseSize.height;
        const scaleX = width / baseWidth;
        const scaleY = height / baseHeight;
        const scale = Math.min(scaleX, scaleY);
        const panelHeight = 100 * scale;

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
        const iconSize = 40 * scale;
        this.coinIcon = this.scene.add.image(20 * scale, 20 * scale, 'coin').setOrigin(0, 0);
        this.coinIcon.setDisplaySize(iconSize, iconSize);

        const fontSize = 32 * scale;
        const textConfig = {
            fontFamily: 'pixelFont',
            fontSize: `${fontSize}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4 * scale
        };

        this.coinNumberText = this.scene.add.text(70 * scale, 25 * scale, `${Math.floor(this.coinsCount)}`, textConfig);

        // Ensure tower is defined and get its position
        const tower = this.scene.children.getByName('tower') as Tower;
        if (tower) {
            const towerPosition = tower.getCenter();
            this.tapText = this.scene.add.text(
                towerPosition.x - 25 * scale,
                towerPosition.y + 170 * scale,
                `X ${this.tapCoefficient.toFixed(1)}`,
                textConfig
            ).setOrigin(0.5, 0.5);
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

    private updateTowerHealth() {
        const tower = this.scene.children.getByName('tower') as Tower;
        if (!tower) {
            console.error('Tower is not defined in the scene.');
            return;
        }
    }

    destroy() {
        this.scene.scale.removeListener('resize', this.handleResize, this);
    }
}

export default UIManager;

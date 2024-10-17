// BootScene.js
import Phaser from 'phaser';

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Загрузка игровых ресурсов
        this.load.on('filecomplete', (key: string, type: string, data: any) => {
            console.log(`File complete: ${key}`);
        });

        this.load.on('loaderror', (file: Phaser.Loader.File) => {
            console.error(`Error loading file: ${file.key}`);
        });

        this.load.image('tower', 'assets/images/towers/arrow.png');
        this.load.image('orc', 'assets/images/enemies/Enemie-1.png');
        this.load.image('goblin', 'assets/images/enemies/Enemie-1.png');
        this.load.image('logo', 'assets/images/logo.png');
        this.load.image('projectile', 'assets/images/projectiles/arrow.png');

        // Загрузка ресурсов для кнопок
        this.load.image('playButton', 'assets/images/play.png');
        this.load.image('pauseButton', 'assets/images/pause.png');
        this.load.image('upgradeButton', 'assets/images/upgrade.png');
        this.load.image('coin', 'assets/images/coin.png');
    }

    create() {
        this.scene.start('GameScene');
    }
}

export default BootScene;

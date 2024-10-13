// BootScene.js
import Phaser from 'phaser';
import '../assets/images/towers/tower.png';
import '../assets/images/enemies/orc.png';

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

        this.load.spritesheet('tower', 'assets/images/towers/tower.png', { frameWidth: 128, frameHeight: 128 });

        // this.load.image('orc', 'assets/images/enemies/orc.png');
        // this.load.image('goblin', 'assets/images/enemies/goblin.png');
        //this.load.image('logo', 'assets/images/logo.png');
        //this.load.image('projectile', 'assets/images/fireball.png');

        // Загрузка ресурсов для кнопок
        // this.load.image('playButton', 'assets/images/play.png');
        // this.load.image('pauseButton', 'assets/images/pause.png');
        // this.load.image('upgradeButton', 'assets/images/upgrade.png');
        // this.load.image('coin', 'assets/images/coin.png');
    }

    create() {
        this.scene.start('MenuScene');
    }
}

export default BootScene;

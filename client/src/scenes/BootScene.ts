// BootScene.js
import Phaser from 'phaser';

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Обработчики событий загрузки
        this.load.on('filecomplete', (key: string, type: string, data: any) => {
            console.log(`File complete: ${key}`);
        });

        this.load.on('loaderror', (file: Phaser.Loader.File) => {
            console.error(`Error loading file: ${file.key}`);
        });

        // Загрузка игровых ресурсов как спрайт-листа
        this.load.spritesheet('enemy', 'assets/images/enemies/Enemie_anim.png', {
            frameWidth: 75, // Ширина одного кадра в пикселях
            frameHeight: 125  // Высота одного кадра в пикселях
        });

        this.load.spritesheet('enemy_death', 'assets/images/enemies/death_scene.png', {
            frameWidth: 90, // Ширина одного кадра в пикселях
            frameHeight: 135  // Высота одного кадра в пикселях
        });

        this.load.image('tower', 'assets/images/towers/Tower-type-3.6@2x.png');
        this.load.image('logo', 'assets/images/logo.png');
        this.load.image('projectile', 'assets/images/projectiles/arrow.png');

        // Добавьте ваш файл фона
        this.load.image('background', 'assets/images/towers/Background1.png');

        // Загрузка ресурсов для кнопок
        this.load.image('playButton', 'assets/images/play.png');
        this.load.image('pauseButton', 'assets/images/pause.png');
        this.load.image('upgradeButton', 'assets/images/upgrade.png');
        this.load.image('coin', 'assets/images/coin.png');

        this.load.spritesheet('coin', 'assets/images/towers/Coin-sheet.png', {
            frameWidth: 65,
            frameHeight: 90
        });
    }

    create() {
        this.createAnimations();
        this.scene.start('GameScene');
    }

    createAnimations() {
        this.anims.create({
            key: 'enemy_walk',
            frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 8 }),
            frameRate: 32,
            repeat: -1
        });

        this.anims.create({
            key: 'enemy_die',
            frames: this.anims.generateFrameNumbers('enemy_death', { start: 0, end: 11 }),
            frameRate: 32,
            repeat: 0
        });

        this.anims.create({
            key: 'coin_spin',
            frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 8 }),
            frameRate: 12,
            repeat: -1
        });
    }
}

export default BootScene;

// BootScene.js
import Phaser from 'phaser';

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load the pixel font
        this.load.xml('pixelFont', 'assets/fonts/pixelFont.xml');
        this.load.image('logo', 'assets/images/ui/logo.png');
        
        // Обработчики событий загрузки
        this.load.on('filecomplete', (key: string) => {
            console.log(`File complete: ${key}`);
        });

        this.load.on('loaderror', (file: any) => {
            console.error(`Error loading file: ${file.key}`);
        });

        // Загрузка игровых ресурсов как спрайт-листа
        this.load.spritesheet('enemy', 'assets/images/enemies/Enemie_anim.png', {
            frameWidth: 75,
            frameHeight: 125
        });

        this.load.spritesheet('enemy_death', 'assets/images/enemies/death_scene.png', {
            frameWidth: 90,
            frameHeight: 135
        });

        this.load.image('tower', 'assets/images/towers/Tower-type-3.6@2x.png');
        this.load.image('projectile', 'assets/images/projectiles/arrow.png');
        this.load.image('background', 'assets/images/towers/Background1.png');

        // Загрузка ресурсов для кнопок
        this.load.image('playButton', 'assets/images/ui/play.png');
        this.load.image('pauseButton', 'assets/images/ui/pause.png');
        this.load.image('upgradeButton', 'assets/images/ui/upgrade.png');

        // Загрузка монет
        this.load.spritesheet('coin', 'assets/images/towers/Coin-sheet.png', {
            frameWidth: 65,
            frameHeight: 90
        });
    }

    create() {
        this.createAnimations();
        this.scene.start('MenuScene');
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

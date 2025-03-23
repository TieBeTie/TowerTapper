// BootScene.js
import Phaser from 'phaser';

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load WebFont loader
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

        // Load the pixel font
        this.load.image('logo', 'assets/images/ui/logo.png');
        
        // Load audio assets
        this.load.audio('gameMusic', 'assets/music/GameMusic.ogg');
        this.load.audio('arrow', 'assets/sounds/arrow.wav');
        this.load.audio('enemyDie', 'assets/sounds/enemy_die.wav');
        this.load.audio('towerDie', 'assets/sounds/tower_die.wav');
        this.load.audio('waveCompleted', 'assets/sounds/wave_completed.wav');
        this.load.audio('upgradeButton', 'assets/sounds/upgrade_button.wav');
        this.load.audio('towerDamage', 'assets/sounds/tower_damage.wav');
        this.load.audio('playButton', 'assets/sounds/play_button.wav');
        
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
        // @ts-ignore
        WebFont.load({
            custom: {
                families: ['pixelFont'],
                urls: ['assets/fonts/pixelFont.css']
            },
            active: () => {
                console.log('Font loaded successfully');
            },
            inactive: () => {
                console.error('Font failed to load');
            }
        });
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

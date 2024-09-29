import Phaser from 'phaser';
import MenuScene from './MenuScene';

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Загрузка логотипа или других ресурсов
        this.load.image('logo', 'assets/images/logo.png');
    }

    create() {
        // Переход к меню после загрузки
        this.scene.start('MenuScene');
    }
}

export default BootScene;

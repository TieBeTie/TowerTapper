import Phaser from 'phaser';

class Castle extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    // Инициализация параметров замка
  }

  upgrade() {
    // Логика улучшения замка
  }
}

export default Castle;

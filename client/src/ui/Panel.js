import Phaser from 'phaser';

class Panel extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height) {
    super(scene, x, y);
    this.setSize(width, height);
    scene.add.existing(this);
  }
}

export default Panel;

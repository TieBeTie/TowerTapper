import Phaser from 'phaser';

class Tower extends Phaser.Physics.Arcade.Sprite {
    health: number;
    maxHealth: number;
    healthBar: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.health = 500;
        this.maxHealth = 500;
        // Start of Selection
        this.setImmovable(true);
        this.setCollideWorldBounds(true);
        console.log('Tower создан. Сцена:', this.scene.sys.settings.key);
        this.healthBar = scene.add.graphics();
        this.updateHealthBar();

        // this.setDisplaySize(250, 250);
    }

    upgrade(): void {
        this.maxHealth += 100;
        this.health += 100;
        console.log('Замок улучшен! Текущее здоровье:', this.health);
        this.updateHealthBar();
    }

    takeDamage(amount: number): void {
        this.health -= amount;
        console.log('Замок получил урон:', amount, 'Текущее здоровье:', this.health);
        this.updateHealthBar();
        if (this.health <= 0) {
            this.destroy();
            this.healthBar.destroy();
            // Start of Selection
            console.log('Замок уничтожен!');
            if (this.scene && this.scene.scene) {
                this.scene.scene.start('DeathScene');
            } else {
                console.error('Сцена не определена при попытке перейти в DeathScene.');
            }
        }
    }

    updateHealthBar(): void {
        this.healthBar.clear();
        const barWidth = 100;
        const barHeight = 10;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.height / 2 - 20;

        this.healthBar.fillStyle(0xff0000);
        this.healthBar.fillRect(barX, barY, barWidth, barHeight);

        const healthPercentage = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
        this.healthBar.fillStyle(0x00ff00);
        this.healthBar.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
    }
}

export default Tower;
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

        this.setImmovable(true);
        this.setCollideWorldBounds(true);

        // Ensure body exists before setting properties
        if (this.body) {
            this.body.setSize(this.width * 0.6, this.height * 0.6);
            this.body.setOffset(this.width * 0.2, this.height * 0.2);
        }

        // Adjust the visual size
        this.setScale(0.8);

        console.log('Tower создан. Сцена:', this.scene.sys.settings.key);
        this.healthBar = scene.add.graphics();
        this.updateHealthBar();
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
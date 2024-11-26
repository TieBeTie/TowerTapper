import Phaser from 'phaser';

class Tower extends Phaser.Physics.Arcade.Sprite {
    health: number;
    maxHealth: number;
    defense: number;
    regeneration: number;
    private regenerationTimer: Phaser.Time.TimerEvent | null;
    healthBar: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.health = 500;
        this.maxHealth = 500;
        this.defense = 0;
        this.regeneration = 0;
        this.regenerationTimer = null;

        this.setImmovable(true);
        this.setCollideWorldBounds(true);

        if (this.body) {
            this.body.setSize(this.width * 0.6, this.height * 0.6);
            this.body.setOffset(this.width * 0.2, this.height * 0.2);
        }

        this.setScale(0.8);

        console.log('Tower создан. Сцена:', this.scene.sys.settings.key);
        this.healthBar = scene.add.graphics();
        this.updateHealthBar();

        // Start regeneration if enabled
        this.startRegeneration();
    }

    upgrade(): void {
        // Base upgrade still increases health
        this.maxHealth += 100;
        this.health += 100;
        console.log('Замок улучшен! Текущее здоровье:', this.health);
        this.updateHealthBar();
    }

    takeDamage(amount: number): void {
        // Apply defense reduction
        const reducedAmount = amount * (1 - (this.defense / 100));
        this.health -= reducedAmount;

        console.log('Замок получил урон:', reducedAmount, 'Текущее здоровье:', this.health);
        this.updateHealthBar();

        if (this.health <= 0) {
            this.stopRegeneration();
            this.destroy();
            this.healthBar.destroy();

            console.log('Замок уничтожен!');
            if (this.scene && this.scene.scene) {
                this.scene.scene.start('DeathScene');
            } else {
                console.error('Сцена не определена при попытке перейти в DeathScene.');
            }
        }
    }

    private startRegeneration(): void {
        if (this.regeneration > 0 && !this.regenerationTimer) {
            this.regenerationTimer = this.scene.time.addEvent({
                delay: 1000, // Regenerate every second
                callback: this.regenerateHealth,
                callbackScope: this,
                loop: true
            });
        }
    }

    private stopRegeneration(): void {
        if (this.regenerationTimer) {
            this.regenerationTimer.destroy();
            this.regenerationTimer = null;
        }
    }

    private regenerateHealth(): void {
        if (this.health < this.maxHealth) {
            this.health = Math.min(this.health + this.regeneration, this.maxHealth);
            this.updateHealthBar();
        }
    }

    updateHealthBar(): void {
        this.healthBar.clear();
        const barWidth = 100;
        const barHeight = 10;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.height / 2 - 20;

        // Background (red)
        this.healthBar.fillStyle(0xff0000);
        this.healthBar.fillRect(barX, barY, barWidth, barHeight);

        // Health bar (green)
        const healthPercentage = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
        this.healthBar.fillStyle(0x00ff00);
        this.healthBar.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
    }

    destroy(): void {
        if (this.scene) {
            this.scene.scene.start('DeathScene');
        } else {
            console.error('Сцена не определена при попытке перейти в DeathScene.');
        }
    }
}

export default Tower;
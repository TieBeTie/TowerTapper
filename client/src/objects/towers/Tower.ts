import Phaser from 'phaser';

class Tower extends Phaser.Physics.Arcade.Sprite {
    health: number;
    maxHealth: number;
    defense: number;
    regeneration: number;
    private regenerationTimer: Phaser.Time.TimerEvent | null;
    healthBar: Phaser.GameObjects.Graphics;
    private readonly INITIAL_HEALTH = 500;
    private readonly HEALTH_UPGRADE = 100;
    private readonly HEALTH_BAR_WIDTH = 100;
    private readonly HEALTH_BAR_HEIGHT = 10;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.health = this.INITIAL_HEALTH;
        this.maxHealth = this.INITIAL_HEALTH;
        this.defense = 0;
        this.regeneration = 0;
        this.regenerationTimer = null;

        this.setImmovable(true);
        this.setCollideWorldBounds(true);
        this.setScale(0.8);

        if (this.body) {
            this.body.setSize(this.width * 0.6, this.height * 0.6);
            this.body.setOffset(this.width * 0.2, this.height * 0.2);
        }

        this.healthBar = scene.add.graphics();
        this.updateHealthBar();
    }

    upgrade(): void {
        this.maxHealth += this.HEALTH_UPGRADE;
        this.health += this.HEALTH_UPGRADE;
        this.updateHealthBar();
    }

    takeDamage(amount: number): void {
        if (!this.active) return;

        const reducedAmount = amount * (1 - (this.defense / 100));
        this.health = Math.max(0, this.health - reducedAmount);
        this.updateHealthBar();

        if (this.health <= 0) {
            this.die();
        }
    }

    private die(): void {
        this.stopRegeneration();
        this.healthBar.destroy();

        if (this.scene?.scene) {
            this.scene.scene.start('DeathScene');
        }

        super.destroy();
    }

    private startRegeneration(): void {
        if (this.regeneration > 0 && !this.regenerationTimer) {
            this.regenerationTimer = this.scene.time.addEvent({
                delay: 1000,
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

    private regenerateHealth = (): void => {
        if (this.health < this.maxHealth) {
            this.health = Math.min(this.health + this.regeneration, this.maxHealth);
            this.updateHealthBar();
        }
    }

    updateHealthBar(): void {
        if (!this.active) return;

        this.healthBar.clear();
        const barX = this.x - this.HEALTH_BAR_WIDTH / 2;
        const barY = this.y - this.height / 2 - 20;

        // Background (red)
        this.healthBar.fillStyle(0xff0000);
        this.healthBar.fillRect(barX, barY, this.HEALTH_BAR_WIDTH, this.HEALTH_BAR_HEIGHT);

        // Health bar (green)
        const healthPercentage = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
        this.healthBar.fillStyle(0x00ff00);
        this.healthBar.fillRect(barX, barY, this.HEALTH_BAR_WIDTH * healthPercentage, this.HEALTH_BAR_HEIGHT);
    }

    destroy(fromScene?: boolean): void {
        this.stopRegeneration();
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        super.destroy(fromScene);
    }
}

export default Tower;
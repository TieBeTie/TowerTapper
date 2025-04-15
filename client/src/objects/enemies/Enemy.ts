import Phaser from 'phaser';
import { ProjectileFactory } from '../../factories/ProjectileFactory';
import { SkillStateManager } from '../../managers/SkillStateManager';
import { SkillType } from '../../types/SkillType';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    speed: number;
    health: number;
    maxHealth: number;
    cost: number;
    damage: number = 0; // Enemy damage to tower
    tower: Phaser.Physics.Arcade.Sprite;
    projectileFactory: ProjectileFactory;
    isDying: boolean;
    isUnderAttack: boolean = false;
    static readonly ENEMY_SCALE = 0.2;
    private skillStateManager: SkillStateManager;
    private baseSpeed: number;
    isFrozen: boolean = false;
    private freezeStartTime: number | null = null;
    private freezeInitialVelocity: Phaser.Math.Vector2 | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, cost: number) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.speed = 100;
        this.health = 0;
        this.maxHealth = 0;
        this.cost = Number(cost);
        this.baseSpeed = 100;
        this.speed = this.baseSpeed;
        this.skillStateManager = SkillStateManager.getInstance();

        this.setScale(Enemy.ENEMY_SCALE);

        this.tower = scene.children.getByName('tower') as Phaser.Physics.Arcade.Sprite;

        this.projectileFactory = new ProjectileFactory(scene);

        this.setCollideWorldBounds(true);

        if (this.body) {
            // Change from rectangular to circular hitbox
            const circleRadius = Math.max(this.width, this.height) * Enemy.ENEMY_SCALE; // Increased radius
            (this.body as Phaser.Physics.Arcade.Body).setCircle(
                circleRadius,
                (this.width - circleRadius * 2) * 0.5, // Changed from + to -
                (this.height - circleRadius * 2) * 0.5  // Changed from + to -
            );
        }

        this.anims.play('enemy_walk', true);

        this.isDying = false;
    }

    update(time: number, delta: number): void {
        if (this.isFrozen) {
            // Плавное замедление за 50 мс
            if (this.freezeStartTime === null) {
                this.freezeStartTime = time;
                if (this.body) {
                    this.freezeInitialVelocity = new Phaser.Math.Vector2((this.body as Phaser.Physics.Arcade.Body).velocity.x, (this.body as Phaser.Physics.Arcade.Body).velocity.y);
                }
            }
            const elapsed = time - (this.freezeStartTime || 0);
            if (this.body && this.freezeInitialVelocity) {
                if (elapsed < 500) {
                    // Линейное замедление
                    const factor = 1 - elapsed / 500;
                    (this.body as Phaser.Physics.Arcade.Body).setVelocity(
                        this.freezeInitialVelocity.x * factor,
                        this.freezeInitialVelocity.y * factor
                    );
                } else {
                    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
                    if (typeof this.body.stop === 'function') this.body.stop();
                }
            }
            return;
        }
        // Сбросить freeze state если разморожен
        this.freezeStartTime = null;
        this.freezeInitialVelocity = null;
        // If the enemy has an active body with non-zero velocity, 
        // we assume it's being knocked back, so we don't override its movement
        if (this.body && (this.body as Phaser.Physics.Arcade.Body).velocity.length() > 0) {
            return;
        }
        
        // Apply game speed to movement speed
        const gameSpeed = this.skillStateManager.getGameSpeed();
        this.speed = this.baseSpeed * gameSpeed;
        
        // Normal movement toward the tower
        this.scene.physics.moveToObject(this, this.tower, this.speed);
    }

    takeDamage(amount: number): void {
        this.health -= amount;
        
        // Показываем эффект получения урона (мигание)
        this.scene.tweens.add({
            targets: this,
            alpha: 0.7,
            duration: 100,
            yoyo: true,
            repeat: 1
        });
        
        if (this.health <= 0 && !this.isDying) {
            this.isDying = true;
            this.anims.play('enemy_die');
            
            const currentVelocity = this.body?.velocity?.clone() || new Phaser.Math.Vector2(0, 0);

            this.scene.tweens.add({
                targets: this,
                currentSpeed: this.speed,
                duration: 1000,
                ease: 'Power1',
                onComplete: () => {
                    this.emit('reached');
                    this.destroy();
                } 
            });
        }
    }

    setHealth(value: number): void {
        this.health = value;
        this.maxHealth = value; // Обновляем максимальное здоровье
    }

    setDamage(value: number): void {
        this.damage = value;
    }

    die(): void {
        if (this.isDying) return;
        this.isDying = true;

        // Get the game scene to access gold reward multiplier
        const gameScene = this.scene.scene.get('GameScene');
        const coinRewardMultiplier = (gameScene as any).getGoldRewardMultiplier?.() || 1;

        // Calculate final gold reward with multiplier
        const finalReward = Math.floor(this.cost * coinRewardMultiplier);

        // Spawn coins with the multiplied reward
        const coinManager = (gameScene as any).coinManager;
        if (coinManager) {
            coinManager.spawnGold(
                new Phaser.Math.Vector2(this.x, this.y),
                this.tower
            );
        }
    }

    setSpeed(value: number): void {
        this.baseSpeed = value;
        // Сразу же обновляем текущую скорость с учетом множителя скорости игры
        const gameSpeed = this.skillStateManager.getGameSpeed();
        this.speed = this.baseSpeed * gameSpeed;
    }
}

export default Enemy;

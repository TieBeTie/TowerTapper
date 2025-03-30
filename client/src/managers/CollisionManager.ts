import Phaser from 'phaser';
import Tower from '../objects/towers/Tower';
import { Projectile } from '../objects/projectiles/Projectile';
import Enemy from '../objects/enemies/Enemy';
import { DamageNumber } from '../ui/components/DamageNumber';
import { SkillSetStorage } from '../storage/SkillSetStorage';
import { SkillType } from '../types/SkillType';
import { IGameScene } from '../types/IGameScene';

// CollisionManager handles the logic for managing collisions between projectiles and enemies, as well as between the tower and enemies
class CollisionManager {
    private scene: IGameScene;
    private projectileEnemyCollider: Phaser.Physics.Arcade.Collider | null = null;
    private towerEnemyCollider: Phaser.Physics.Arcade.Collider | null = null;
    private readonly PROJECTILE_CHECK_DISTANCE = 150;
    private readonly TOWER_CHECK_DISTANCE = 100;
    private skillStorage: SkillSetStorage;

    constructor(scene: IGameScene) {
        this.scene = scene;
        this.skillStorage = SkillSetStorage.getInstance();
        this.setupColliders();
        this.scene.events.on('shutdown', this.cleanup);
    }

    private setupColliders = (): void => {
        // Setup collisions between projectiles and enemies with distance check
        this.projectileEnemyCollider = this.scene.physics.add.overlap(
            this.scene.projectileManager.projectiles,
            this.scene.enemyManager.enemies,
            this.handleProjectileEnemyCollision,
            this.checkProjectileDistance,
            this
        );

        // Setup collisions between tower and enemies with distance check
        this.towerEnemyCollider = this.scene.physics.add.overlap(
            this.scene.tower,
            this.scene.enemyManager.enemies,
            this.handleEnemyTowerCollision,
            this.checkTowerDistance,
            this
        );
    }

    private checkProjectileDistance = (
        object1: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Tilemaps.Tile,
        object2: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Tilemaps.Tile
    ): boolean => {
        const sprite1 = object1 as Phaser.GameObjects.Sprite;
        const sprite2 = object2 as Phaser.GameObjects.Sprite;

        if (!sprite1.active || !sprite2.active) return false;

        const distance = Phaser.Math.Distance.Between(
            sprite1.x, sprite1.y,
            sprite2.x, sprite2.y
        );
        return distance < this.PROJECTILE_CHECK_DISTANCE;
    }

    private checkTowerDistance = (
        object1: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Tilemaps.Tile,
        object2: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Tilemaps.Tile
    ): boolean => {
        const sprite1 = object1 as Phaser.GameObjects.Sprite;
        const sprite2 = object2 as Phaser.GameObjects.Sprite;

        if (!sprite1.active || !sprite2.active) return false;

        const distance = Phaser.Math.Distance.Between(
            sprite1.x, sprite1.y,
            sprite2.x, sprite2.y
        );
        return distance < this.TOWER_CHECK_DISTANCE;
    }

    private handleProjectileEnemyCollision = (
        object1: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Tilemaps.Tile,
        object2: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Tilemaps.Tile
    ): void => {
        const projectile = object1 as Projectile;
        const enemy = object2 as Enemy;

        if (!projectile.active || !enemy.active) return;

        // Get damage from storage
        const skills = this.skillStorage.load();
        const damage = skills.get(SkillType.DAMAGE)?.value || 20;
        
        // Get knockback value from storage
        const knockbackForce = skills.get(SkillType.KNOCKBACK)?.value || 50;
        
        // Get critical hit values
        const critChance = skills.get(SkillType.CRIT_CHANCE)?.value || 0;
        const critMultiplier = skills.get(SkillType.CRIT_MULTIPLIER)?.value || 0;
        
        // Calculate if this is a critical hit
        const isCriticalHit = Math.random() * 100 < critChance;
        
        // Calculate final damage
        let finalDamage = damage;
        if (isCriticalHit) {
            // Add the critical multiplier (convert from percentage)
            finalDamage = Math.floor(damage * (1 + critMultiplier / 100));
            
            // Display critical hit effect (optional)
            this.showCriticalHitEffect(enemy);
        }
        
        // Уведомляем ProjectileManager о попадании
        this.scene.projectileManager.handleProjectileHit(projectile, enemy);
        
        // Apply knockback effect
        if (knockbackForce > 0) {
            // Calculate knockback direction (away from tower/projectile source)
            const knockbackDirection = new Phaser.Math.Vector2(
                enemy.x - this.scene.tower.x,
                enemy.y - this.scene.tower.y
            ).normalize();
            
            // Apply force to enemy
            if (enemy.body) {
                const body = enemy.body as Phaser.Physics.Arcade.Body;
                body.setVelocity(
                    knockbackDirection.x * knockbackForce,
                    knockbackDirection.y * knockbackForce
                );
                
                // Reset the enemy's normal movement after a short delay
                this.scene.time.delayedCall(300, () => {
                    if (enemy.active && enemy.body) {
                        body.setVelocity(0, 0);
                    }
                });
            }
        }
        
        // Уничтожаем стрелу
        projectile.destroy();
        
        // Наносим урон врагу
        enemy.takeDamage(finalDamage);

        // Показываем число урона с учетом критического удара
        new DamageNumber({
            scene: this.scene,
            damage: finalDamage,
            x: enemy.x,
            y: enemy.y,
            isCritical: isCriticalHit
        });
        
        // Проверяем, должен ли сработать Lifesteal
        const lifestealChance = skills.get(SkillType.LIFESTEAL_CHANCE)?.value || 0;
        const lifestealAmount = skills.get(SkillType.LIFESTEAL_AMOUNT)?.value || 0;
        
        if (lifestealAmount > 0 && Math.random() * 100 < lifestealChance) {
            // Lifesteal activated, heal the tower
            if (this.scene.tower && this.scene.tower.active) {
                const prevHealth = this.scene.tower.health;
                this.scene.tower.health = Math.min(
                    this.scene.tower.health + lifestealAmount,
                    this.scene.tower.maxHealth
                );
                
                // Update health bar if needed
                this.scene.tower.updateHealthBar();
                
                // Show lifesteal effect
                this.showLifestealEffect(enemy, this.scene.tower, lifestealAmount);
                
                // Play heal sound if available
                if (this.scene.scene.get('GameScene') && (this.scene as any).audioManager) {
                    (this.scene as any).audioManager.playSound('heal');
                }
            }
        }
        
        if (enemy.health <= 0) {
            this.scene.enemyManager.handleEnemyDeath(enemy);
        }
    }

    private handleEnemyTowerCollision = (
        object1: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Tilemaps.Tile,
        object2: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Tilemaps.Tile
    ): void => {
        const tower = object1 as Tower;
        const enemy = object2 as Enemy;

        if (!tower.active || !enemy.active) return;

        enemy.destroy();
        tower.takeDamage(100);
    }

    private cleanup = (): void => {
        if (this.projectileEnemyCollider) {
            this.projectileEnemyCollider.destroy();
        }
        if (this.towerEnemyCollider) {
            this.towerEnemyCollider.destroy();
        }

        this.scene.events.off('shutdown', this.cleanup);
    }

    /**
     * Displays a visual effect for critical hits
     * @param enemy The enemy that received a critical hit
     */
    private showCriticalHitEffect(enemy: Enemy): void {
        // Play critical hit sound with increased volume if available
        if (this.scene.scene.get('GameScene') && (this.scene as any).audioManager) {
            // Play critical hit sound with slightly higher volume
            const audioManager = (this.scene as any).audioManager;
            const originalVolume = audioManager.sounds.get('crit')?.volume || 0.25;
            
            // Temporarily increase volume for this specific play
            if (audioManager.sounds.has('crit')) {
                const critSound = audioManager.sounds.get('crit');
                if (critSound) {
                    critSound.setVolume(originalVolume * 1.5); // 50% louder
                    audioManager.playSound('crit');
                    
                    // Reset volume after playing
                    this.scene.time.delayedCall(200, () => {
                        if (critSound) {
                            critSound.setVolume(originalVolume);
                        }
                    });
                }
            }
        }
    }

    private showLifestealEffect(enemy: Enemy, tower: Tower, amount: number): void {
        try {
            // Safety check to make sure the scene and objects are valid
            if (!this.scene || !enemy || !tower || !enemy.active || !tower.active) {
                return;
            }
            
            // Create a lifesteal text indicator with safety checks
            try {
                new DamageNumber({
                    scene: this.scene,
                    damage: amount,
                    x: enemy.x,
                    y: enemy.y - 20,
                    isCritical: false,
                    isHeal: true
                });
            } catch (e) {
                console.warn('Failed to create heal number indicator:', e);
                // Continue with the effect even if the number indicator fails
            }
            
            // Create a simpler green line effect from enemy to tower
            try {
                const graphics = this.scene.add.graphics();
                if (graphics) {
                    graphics.lineStyle(3, 0x00ff00, 0.4); // More transparent line
                    graphics.beginPath();
                    graphics.moveTo(enemy.x, enemy.y);
                    graphics.lineTo(tower.x, tower.y);
                    graphics.strokePath();
                    
                    // Use a simple fade-out with a short duration
                    this.scene.tweens.add({
                        targets: graphics,
                        alpha: 0,
                        duration: 200, // Shorter duration
                        ease: 'Linear',
                        onComplete: () => {
                            if (graphics && graphics.destroy) {
                                graphics.destroy();
                            }
                        }
                    });
                }
            } catch (e) {
                console.warn('Failed to create lifesteal line effect:', e);
            }
            
            // Add a green tint to the tower with safety check
            if (tower && tower.setTint) {
                tower.setTint(0x00ff00);
                
                // Clear the tint after a short delay with safety check
                this.scene.time.delayedCall(200, () => { 
                    if (tower && tower.active && tower.clearTint) {
                        tower.clearTint();
                    }
                });
            }
        } catch (e) {
            console.warn('Error showing lifesteal effect:', e);
        }
    }
}

export default CollisionManager;

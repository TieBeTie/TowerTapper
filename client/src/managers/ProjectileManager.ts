import Phaser from 'phaser';
import { Projectile } from '../objects/projectiles/Projectile';
import { ProjectileFactory } from '../factories/ProjectileFactory';
import { Enemy } from '../objects/enemies/Enemy';
import EnemyManager from './EnemyManager';
import GameScene from '../scenes/GameScene';
import Tower from '../objects/towers/Tower';


// ProjectileManager handles the logic for managing and firing projectiles at enemies
class ProjectileManager {
    scene: Phaser.Scene;
    projectiles: Phaser.Physics.Arcade.Group;
    projectileFactory: ProjectileFactory;
    enemyManager: EnemyManager;
    private damage: number = 50; // Базовый урон
    private projectilesInFlight: Map<Enemy, number> = new Map(); // Количество выпущенных стрел к врагу
    private projectileMaxLifetime: number = 5000; // Максимальное время жизни стрелы в мс
    private fireRate: number = 500; // Fire rate in milliseconds
    private lastFireTime: number = 0; // Last time a projectile was fired

    constructor(scene: Phaser.Scene, enemyManager: EnemyManager) {
        this.scene = scene;
        this.enemyManager = enemyManager;
        this.projectiles = this.scene.physics.add.group({
            classType: Projectile,
            runChildUpdate: true
        });
        this.projectileFactory = new ProjectileFactory(this.scene);
    }

    setDamage(damage: number): void {
        this.damage = damage;
    }

    getDamage(): number {
        return this.damage;
    }

    updateDamage(): void {
        // Обновляем урон из башни
        this.damage = this.getTowerDamage();
    }

    setFireRate(rate: number): void {
        this.fireRate = rate;
    }

    getFireRate(): number {
        return this.fireRate;
    }

    private getTowerDamage(): number {
        return (this.scene.tower as any).damage || 50;
    }

    fireProjectile(speedMultiplier: number = 1): void {
        const targetEnemy = this.enemyManager.findNearestAvailableEnemy(this.scene.tower.x, this.scene.tower.y);
        if (targetEnemy) {
            // Рассчитываем, сколько стрел нужно выпустить для убийства врага
            const projectilesNeeded = this.calculateProjectilesNeeded(targetEnemy);
            
            // Получаем текущее количество стрел в полете к этому врагу
            const currentProjectiles = this.projectilesInFlight.get(targetEnemy) || 0;
            
            // Если стрел уже достаточно, не стреляем больше
            if (currentProjectiles >= projectilesNeeded) {
                return;
            }
            
            // Создаем стрелу
            const arrow = this.projectileFactory.createArrow(this.scene.tower.x, this.scene.tower.y);
            // Используем урон из башни
            const towerDamage = this.getTowerDamage();
            console.log('Setting arrow damage:', towerDamage); // Debug log
            arrow.setDamage(towerDamage);
            arrow.fire(targetEnemy.x, targetEnemy.y, speedMultiplier);
            
            // Увеличиваем счетчик стрел для этого врага
            this.projectilesInFlight.set(targetEnemy, currentProjectiles + 1);
            
            // Добавляем данные о цели к стреле
            (arrow as any).targetEnemy = targetEnemy;
            
            // Устанавливаем таймер автоматического удаления стрелы
            this.scene.time.delayedCall(this.projectileMaxLifetime, () => {
                if (arrow.active) {
                    // Если стрела все еще активна, значит она не попала - удаляем её
                    this.handleMissedProjectile(arrow);
                }
            });
            
            this.projectiles.add(arrow);
            this.lastFireTime = this.scene.time.now;
            
            // Play arrow sound
            const gameScene = this.scene as GameScene;
            if (gameScene.audioManager) {
                gameScene.audioManager.playSound('arrow');
            }
        }
    }
    
    // Обработка промаха стрелы
    handleMissedProjectile(projectile: Projectile): void {
        const targetEnemy = (projectile as any).targetEnemy as Enemy;
        
        // Если враг все еще существует, корректируем счетчик стрел
        if (targetEnemy && targetEnemy.active) {
            const currentProjectiles = this.projectilesInFlight.get(targetEnemy) || 0;
            if (currentProjectiles > 0) {
                this.projectilesInFlight.set(targetEnemy, currentProjectiles - 1);
            }
        }
        
        // Уничтожаем стрелу
        projectile.destroy();
    }
    
    // Обработка попадания стрелы
    handleProjectileHit(projectile: Projectile, enemy: Enemy): void {
        // Используется в CollisionManager
        // Удаляем стрелу из счетчика стрел в полете к этому врагу
        const currentProjectiles = this.projectilesInFlight.get(enemy) || 0;
        if (currentProjectiles > 0) {
            this.projectilesInFlight.set(enemy, currentProjectiles - 1);
        }
    }
    
    // Расчет количества стрел, необходимых для убийства врага
    calculateProjectilesNeeded(enemy: Enemy): number {
        const towerDamage = this.getTowerDamage();
        const enemyHealth = enemy.health;
        return Math.ceil(enemyHealth / towerDamage);
    }

    update(time: number, delta: number): void {
        // Check if it's time to fire a new projectile automatically
        if (time - this.lastFireTime >= this.fireRate) {
            this.fireProjectile(1); // Fire with base speed multiplier
        }
        
        // Обновляем все стрелы
        this.projectiles.children.iterate(projectile => {
            if (projectile instanceof Projectile) {
                projectile.update(time, delta);
                
                // Проверяем, не покинула ли стрела игровое поле
                if (projectile.active && this.isProjectileOutOfBounds(projectile)) {
                    this.handleMissedProjectile(projectile);
                }
            }
            return false;
        });
        
        // Очищаем счетчики для неактивных врагов
        this.cleanupInactiveEnemies();
    }
    
    // Проверка, не вышла ли стрела за пределы игрового поля
    isProjectileOutOfBounds(projectile: Projectile): boolean {
        const bounds = this.scene.physics.world.bounds;
        const padding = 50; // Добавляем небольшой запас
        
        return (
            projectile.x < bounds.x - padding ||
            projectile.x > bounds.x + bounds.width + padding ||
            projectile.y < bounds.y - padding ||
            projectile.y > bounds.y + bounds.height + padding
        );
    }
    
    // Очистка счетчиков для неактивных врагов
    cleanupInactiveEnemies(): void {
        for (const [enemy, count] of this.projectilesInFlight.entries()) {
            if (!enemy.active) {
                this.projectilesInFlight.delete(enemy);
            }
        }
    }
}

export default ProjectileManager;

import Phaser from 'phaser';
import { Projectile } from '../objects/projectiles/Projectile';
import { ProjectileFactory } from '../factories/ProjectileFactory';
import { Enemy } from '../objects/enemies/Enemy';
import EnemyManager from './EnemyManager';
import GameScene from '../scenes/GameScene';
import Tower from '../objects/towers/Tower';
import { SkillSetStorage } from '../storage/SkillSetStorage';
import { SkillType } from '../types/SkillType';
import { IGameScene } from '../types/IGameScene';

// ProjectileManager handles the logic for managing and firing projectiles at enemies
class ProjectileManager {
    scene: IGameScene;
    projectiles: Phaser.Physics.Arcade.Group;
    projectileFactory: ProjectileFactory;
    enemyManager: EnemyManager;
    private projectileMaxLifetime: number = 5000; // Максимальное время жизни стрелы в мс
    private lastFireTime: number = 0; // Last time a projectile was fired
    private skillStorage: SkillSetStorage;

    constructor(scene: IGameScene, enemyManager: EnemyManager) {
        this.scene = scene;
        this.enemyManager = enemyManager;
        this.skillStorage = SkillSetStorage.getInstance();
        this.projectiles = this.scene.physics.add.group({
            classType: Projectile,
            runChildUpdate: true
        });
        this.projectileFactory = new ProjectileFactory(this.scene);
    }

    private getFireRate(): number {
        const skills = this.skillStorage.load();
        const attackSpeed = skills.get(SkillType.ATTACK_SPEED)?.value || 1;
        return 500 / attackSpeed; // Base fire rate (500ms) divided by attack speed multiplier
    }

    private getTowerDamage(): number {
        const skills = this.skillStorage.load();
        return skills.get(SkillType.DAMAGE)?.value || 20; // Return base damage of 20 if not found
    }

    fireProjectile(speedMultiplier: number = 1): void {
        // Находим ближайшего врага
        const targetEnemy = this.enemyManager.findNearestAvailableEnemy(this.scene.tower.x, this.scene.tower.y);
        if (targetEnemy) {
            // Создаем стрелу
            const arrow = this.projectileFactory.createArrow(this.scene.tower.x, this.scene.tower.y);
            

            const towerDamage = this.getTowerDamage();
            console.log('Setting arrow damage:', towerDamage);
            arrow.setDamage(towerDamage);
            
            // Запускаем стрелу в направлении врага
            arrow.fire(targetEnemy.x, targetEnemy.y, speedMultiplier);
            
            // Устанавливаем таймер автоматического удаления стрелы
            this.scene.time.delayedCall(this.projectileMaxLifetime, () => {
                if (arrow.active) {
                    // Если стрела все еще активна, удаляем её
                    arrow.destroy();
                }
            });
            
            // Добавляем стрелу в группу
            this.projectiles.add(arrow);
            this.lastFireTime = this.scene.time.now;
            
            // Проигрываем звук
            const gameScene = this.scene as GameScene;
            if (gameScene.audioManager) {
                gameScene.audioManager.playSound('arrow');
            }
        }
    }
    
    // Обработка попадания стрелы (используется в CollisionManager)
    handleProjectileHit(projectile: Projectile, enemy: Enemy): void {
        // Проверяем, что стрела и враг активны
        if (!projectile.active || !enemy.active) return;
    }

    update(time: number, delta: number): void {
        // Автоматический выстрел стрелы по таймеру
        const currentFireRate = this.getFireRate();
        if (time - this.lastFireTime >= currentFireRate) {
            this.fireProjectile(1); // Fire with base speed multiplier
        }
        
        // Обновляем все стрелы
        this.projectiles.children.iterate(projectile => {
            if (projectile instanceof Projectile) {
                projectile.update(time, delta);
                
                // Проверяем, не покинула ли стрела игровое поле
                if (projectile.active && this.isProjectileOutOfBounds(projectile)) {
                    projectile.destroy();
                }
            }
            return false;
        });
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
}

export default ProjectileManager;

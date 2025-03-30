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
import { SkillStateManager } from '../managers/SkillStateManager';

// ProjectileManager handles the logic for managing and firing projectiles at enemies
class ProjectileManager {
    scene: IGameScene;
    projectiles: Phaser.Physics.Arcade.Group;
    projectileFactory: ProjectileFactory;
    enemyManager: EnemyManager;
    private projectileMaxLifetime: number = 5000; // Максимальное время жизни стрелы в мс
    private lastFireTime: number = 0; // Last time a projectile was fired
    private skillStorage: SkillSetStorage;
    private skillStateManager: SkillStateManager;

    constructor(scene: IGameScene, enemyManager: EnemyManager) {
        this.scene = scene;
        this.enemyManager = enemyManager;
        this.skillStorage = SkillSetStorage.getInstance();
        this.skillStateManager = SkillStateManager.getInstance();
        this.projectiles = this.scene.physics.add.group({
            classType: Projectile,
            runChildUpdate: true
        });
        this.projectileFactory = new ProjectileFactory(this.scene);
    }

    private getFireRate(): number {
        const skills = this.skillStorage.load();
        const attackSpeed = skills.get(SkillType.ATTACK_SPEED)?.value || 1;
        // Apply game speed to fire rate (lower delay = faster fire rate)
        const gameSpeed = this.skillStateManager.getGameSpeed();
        return (500 / attackSpeed) / gameSpeed; 
    }

    private getTowerDamage(): number {
        const skills = this.skillStorage.load();
        return skills.get(SkillType.DAMAGE)?.value || 20; // Return base damage of 20 if not found
    }

    // Проверяет, должен ли сработать мультивыстрел
    private shouldTriggerMultishot(): boolean {
        const skills = this.skillStorage.load();
        const multishotChance = skills.get(SkillType.MULTISHOT)?.value || 0;
        
        // Генерируем случайное число от 0 до 100
        const roll = Math.random() * 100;
        
        // Если выпавшее число меньше шанса мультивыстрела, то активируем навык
        return roll < multishotChance;
    }

    // Находит ближайшего врага в диапазоне атаки башни
    findNearestEnemyInRange(): Enemy | null {
        // Проверяем, что башня существует
        if (!this.scene.tower) return null;
        
        // Получаем всех врагов
        const enemies = this.enemyManager.enemies.getChildren();
        if (!enemies.length) return null;
        
        let nearestEnemy: Enemy | null = null;
        let minDistance = Infinity;
        
        // Перебираем всех врагов
        for (const enemy of enemies) {
            // Проверяем, что враг активен и находится в радиусе атаки
            if (enemy.active && this.scene.tower.isInAttackRange(enemy)) {
                const enemyObj = enemy as Enemy;
                const distance = Phaser.Math.Distance.Between(
                    this.scene.tower.x, 
                    this.scene.tower.y, 
                    enemyObj.x, 
                    enemyObj.y
                );
                
                // Обновляем ближайшего врага
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestEnemy = enemyObj;
                }
            }
        }
        
        return nearestEnemy;
    }

    fireProjectile(speedMultiplier: number = 1): void {
        // Get game speed multiplier and combine with provided speedMultiplier
        const gameSpeed = this.skillStateManager.getGameSpeed();
        const combinedSpeedMultiplier = speedMultiplier * gameSpeed;
        
        // Находим ближайшего врага в радиусе атаки
        const targetEnemy = this.findNearestEnemyInRange();
        if (targetEnemy) {
            // Проверяем, должен ли сработать мультивыстрел
            const isMultishot = this.shouldTriggerMultishot();
            
            if (isMultishot) {
                // Мультивыстрел: 3 стрелы с небольшим отклонением
                this.fireMultipleArrows(targetEnemy, combinedSpeedMultiplier);
            } else {
                // Обычный выстрел одной стрелой
                this.fireSingleArrow(targetEnemy, combinedSpeedMultiplier);
            }
            
            // Обновляем время последнего выстрела
            this.lastFireTime = this.scene.time.now;
            
            // Проигрываем звук
            const gameScene = this.scene as GameScene;
            if (gameScene.audioManager) {
                gameScene.audioManager.playSound('arrow');
            }
        }
    }
    
    // Стреляем одной стрелой в цель
    private fireSingleArrow(target: Enemy, speedMultiplier: number): void {
        // Создаем стрелу
        const arrow = this.projectileFactory.createArrow(this.scene.tower.x, this.scene.tower.y);
        
        // Устанавливаем урон
        const towerDamage = this.getTowerDamage();
        console.log('Setting arrow damage:', towerDamage);
        arrow.setDamage(towerDamage);
        
        // Запускаем стрелу в направлении врага
        arrow.fire(target.x, target.y, speedMultiplier);
        
        // Устанавливаем таймер автоматического удаления стрелы
        this.scene.time.delayedCall(this.projectileMaxLifetime, () => {
            if (arrow.active) {
                // Если стрела все еще активна, удаляем её
                arrow.destroy();
            }
        });
        
        // Добавляем стрелу в группу
        this.projectiles.add(arrow);
    }
    
    // Стреляем тремя стрелами с отклонением
    private fireMultipleArrows(target: Enemy, speedMultiplier: number): void {
        // Получаем угол от башни к цели
        const angle = Phaser.Math.Angle.Between(
            this.scene.tower.x, 
            this.scene.tower.y, 
            target.x, 
            target.y
        );
        
        // Угол отклонения (в радианах) для боковых стрел
        const deviation = Phaser.Math.DegToRad(10); // 10 градусов
        
        // Стреляем центральной стрелой (прямо в цель)
        this.fireSingleArrow(target, speedMultiplier);
        
        // Вычисляем позиции для боковых стрел
        // Левая стрела (угол - отклонение)
        const leftAngle = angle - deviation;
        const leftX = target.x + Math.cos(leftAngle) * 50; // Небольшое смещение для визуального эффекта
        const leftY = target.y + Math.sin(leftAngle) * 50;
        
        // Правая стрела (угол + отклонение)
        const rightAngle = angle + deviation;
        const rightX = target.x + Math.cos(rightAngle) * 50;
        const rightY = target.y + Math.sin(rightAngle) * 50;
        
        // Создаем левую стрелу
        const leftArrow = this.projectileFactory.createArrow(this.scene.tower.x, this.scene.tower.y);
        const towerDamage = this.getTowerDamage();
        leftArrow.setDamage(towerDamage);
        leftArrow.fire(leftX, leftY, speedMultiplier);
        this.scene.time.delayedCall(this.projectileMaxLifetime, () => {
            if (leftArrow.active) leftArrow.destroy();
        });
        this.projectiles.add(leftArrow);
        
        // Создаем правую стрелу
        const rightArrow = this.projectileFactory.createArrow(this.scene.tower.x, this.scene.tower.y);
        rightArrow.setDamage(towerDamage);
        rightArrow.fire(rightX, rightY, speedMultiplier);
        this.scene.time.delayedCall(this.projectileMaxLifetime, () => {
            if (rightArrow.active) rightArrow.destroy();
        });
        this.projectiles.add(rightArrow);
    }
    
    // Обработка попадания стрелы (используется в CollisionManager)
    handleProjectileHit(projectile: Projectile, enemy: Enemy): void {
        // Проверяем, что стрела и враг активны
        if (!projectile.active || !enemy.active) return;
        
        // Log hit for debugging purposes
        console.log('Projectile hit enemy, knockback being handled in CollisionManager');
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

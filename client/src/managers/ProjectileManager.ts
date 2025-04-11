import Phaser from 'phaser';
import { Projectile } from '../objects/projectiles/Projectile';
import { ProjectileFactory } from '../factories/ProjectileFactory';
import { Enemy } from '../objects/enemies/Enemy';
import EnemyManager from './EnemyManager';
import GameScene from '../services/scenes/GameScene';
import Tower from '../objects/towers/Tower';
import { SkillType } from '../types/SkillType';
import { IGameScene } from '../types/IGameScene';
import { SkillStateManager } from '../managers/SkillStateManager';

// ProjectileManager handles the logic for managing and firing projectiles at enemies
class ProjectileManager {
    // Константы класса
    private static readonly PROJECTILE_MAX_LIFETIME: number = 5000; // Максимальное время жизни стрелы в мс
    private static readonly BASE_FIRE_INTERVAL: number = 1300; // Базовый интервал между выстрелами в мс
    private static readonly ATTACK_SPEED_NORMALIZER: number = 4; // Базовое значение Attack Speed для нормализации
    private static readonly DEFAULT_DAMAGE: number = 3; // Базовый урон стрелы
    private static readonly MULTISHOT_DEVIATION_DEGREES: number = 10; // Угол отклонения для мультивыстрела в градусах
    private static readonly MULTISHOT_OFFSET: number = 50; // Смещение для боковых стрел в мультивыстреле
    private static readonly OUT_OF_BOUNDS_PADDING: number = 50; // Отступ для проверки выхода стрел за границы

    scene: IGameScene;
    projectiles: Phaser.Physics.Arcade.Group;
    projectileFactory: ProjectileFactory;
    enemyManager: EnemyManager;
    private projectileMaxLifetime: number; // Максимальное время жизни стрелы в мс
    private lastFireTime: number = 0; // Last time a projectile was fired
    private skillManager: SkillStateManager;

    constructor(scene: IGameScene, enemyManager: EnemyManager) {
        this.scene = scene;
        this.enemyManager = enemyManager;
        this.skillManager = SkillStateManager.getInstance();
        this.projectiles = this.scene.physics.add.group({
            classType: Projectile,
            runChildUpdate: true
        });
        this.projectileFactory = new ProjectileFactory(this.scene);
        this.projectileMaxLifetime = ProjectileManager.PROJECTILE_MAX_LIFETIME;
    }

    private getFireRate(): number {
        const attackSpeed = this.skillManager.getState(SkillType.ATTACK_SPEED) || 1;
        // Apply game speed to fire rate (lower delay = faster fire rate)
        const gameSpeed = this.skillManager.getGameSpeed();
        return (ProjectileManager.BASE_FIRE_INTERVAL / attackSpeed) / gameSpeed; 
    }

    private getTowerDamage(): number {
        return this.skillManager.getState(SkillType.DAMAGE) || ProjectileManager.DEFAULT_DAMAGE;
    }

    // Проверяет, должен ли сработать мультивыстрел
    private shouldTriggerMultishot(): boolean {
        const multishotChance = this.skillManager.getState(SkillType.MULTISHOT) || 0;
        
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
        // Get game speed multiplier and attack speed
        const gameSpeed = this.skillManager.getGameSpeed();
        const attackSpeed = this.skillManager.getState(SkillType.ATTACK_SPEED) || 1;
        
        // Combine both game speed and attack speed for projectile speed
        // We use a formula that makes arrows faster based on attack speed:
        // 1. Baseline attack speed is 2.5, so we divide by 2.5 to normalize
        // 2. With attackSpeed=2.5, the arrow has normal speed (multiplier=1)
        // 3. With attackSpeed=5.0, the arrow flies twice as fast (multiplier=2)
        const combinedSpeedMultiplier = speedMultiplier * gameSpeed * (attackSpeed / ProjectileManager.ATTACK_SPEED_NORMALIZER);
        
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
        const deviation = Phaser.Math.DegToRad(ProjectileManager.MULTISHOT_DEVIATION_DEGREES);
        
        // Стреляем центральной стрелой (прямо в цель)
        this.fireSingleArrow(target, speedMultiplier);
        
        // Вычисляем позиции для боковых стрел
        // Левая стрела (угол - отклонение)
        const leftAngle = angle - deviation;
        const leftX = target.x + Math.cos(leftAngle) * ProjectileManager.MULTISHOT_OFFSET;
        const leftY = target.y + Math.sin(leftAngle) * ProjectileManager.MULTISHOT_OFFSET;
        
        // Правая стрела (угол + отклонение)
        const rightAngle = angle + deviation;
        const rightX = target.x + Math.cos(rightAngle) * ProjectileManager.MULTISHOT_OFFSET;
        const rightY = target.y + Math.sin(rightAngle) * ProjectileManager.MULTISHOT_OFFSET;
        
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
        const padding = ProjectileManager.OUT_OF_BOUNDS_PADDING;
        
        return (
            projectile.x < bounds.x - padding ||
            projectile.x > bounds.x + bounds.width + padding ||
            projectile.y < bounds.y - padding ||
            projectile.y > bounds.y + bounds.height + padding
        );
    }
}

export default ProjectileManager;

import Phaser from 'phaser';
import Tower from '../objects/towers/Tower';
import { Projectile } from '../objects/projectiles/Projectile';
import Enemy from '../objects/enemies/Enemy';
import { DamageNumber } from '../ui/components/DamageNumber';

// CollisionManager handles the logic for managing collisions between projectiles and enemies, as well as between the tower and enemies
class CollisionManager {
    private scene: Phaser.Scene;
    private projectileEnemyCollider: Phaser.Physics.Arcade.Collider;
    private towerEnemyCollider: Phaser.Physics.Arcade.Collider;
    private readonly PROJECTILE_CHECK_DISTANCE = 150;
    private readonly TOWER_CHECK_DISTANCE = 100;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

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

        // Подписываемся на событие shutdown сцены для очистки
        this.scene.events.once('shutdown', this.cleanup, this);
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

        // Get damage from the projectile using getDamage method
        const damage = (projectile as any).getDamage?.() || 50;
        
        // Уведомляем ProjectileManager о попадании
        this.scene.projectileManager.handleProjectileHit(projectile, enemy);
        
        // Уничтожаем стрелу
        projectile.destroy();
        
        // Наносим урон врагу
        enemy.takeDamage(damage);

        // Показываем число урона
        new DamageNumber({
            scene: this.scene,
            damage: damage,
            x: enemy.x,
            y: enemy.y
        });

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
}

export default CollisionManager;

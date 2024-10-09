// managers/CollisionManager.js
import Phaser from 'phaser';

class CollisionManager {
    constructor(scene) {
        this.scene = scene;

        // Настройка коллайшенов между снарядами и врагами
        this.scene.physics.add.overlap(
            this.scene.projectileManager.projectiles,
            this.scene.enemyManager.enemies,
            this.handleProjectileEnemyCollision,
            null,
            this
        );

        // Настройка коллайшенов между замком и врагами
        this.scene.physics.add.overlap(
            this.scene.tower,
            this.scene.enemyManager.enemies,
            this.handleEnemyTowerCollision,
            null,
            this
        );
    }

    handleProjectileEnemyCollision(projectile, enemy) {
        projectile.destroy();
        enemy.takeDamage(50); // Урон от снаряда

        if (enemy.health <= 0) {
            const enemyCost = Number(enemy.cost);
            if (!isNaN(enemyCost)) {
                this.scene.coins += enemyCost;
            } else {
                console.error('Стоимость врага не является числом:', enemy.cost);
            }
            this.scene.uiManager.updateCoins(this.scene.coins);

            // Уведомляем менеджер врагов о смерти врага
            this.scene.enemyManager.handleEnemyDeath(enemy);
        }
    }

    handleEnemyTowerCollision(tower, enemy) {
        enemy.destroy();
        tower.takeDamage(100); // Урон от врага

        // Проверяем, если здоровье башни <= 0, то переходим на сцену смерти
        if (tower.health <= 0) {
            this.scene.scene.start('DeathScene');
        }
    }
}

export default CollisionManager;

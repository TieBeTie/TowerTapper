import Phaser from 'phaser';
import Tower from '../objects/towers/Tower';
import { Projectile } from '../objects/projectiles/Projectile';
import Enemy from '../objects/enemies/Enemy';

class CollisionManager {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        // Setup collisions between projectiles and enemies
        this.scene.physics.add.overlap(
            this.scene.projectileManager.projectiles,
            this.scene.enemyManager.enemies,
            this.handleProjectileEnemyCollision,
            undefined,
            this
        );

        // Setup collisions between tower and enemies
        this.scene.physics.add.overlap(
            this.scene.tower,
            this.scene.enemyManager.enemies,
            this.handleEnemyTowerCollision,
            undefined,
            this
        );
    }

    /**
     * Handles collision between a projectile and an enemy.
     * @param object1 - The first object involved in the collision.
     * @param object2 - The second object involved in the collision.
     */
    private handleProjectileEnemyCollision(
        object1: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Tilemaps.Tile,
        object2: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Tilemaps.Tile
    ): void {
        const projectile = object1 instanceof Projectile ? object1 : (object2 as Projectile);
        const enemy = object1 instanceof Projectile ? (object2 as Enemy) : (object1 as Enemy);

        if (projectile && enemy) {
            // Destroy the projectile
            projectile.destroy();

            // Inflict damage on the enemy
            enemy.takeDamage(50); // Adjust damage as needed

            // Check if the enemy is dead
            if (enemy.health <= 0) {
                const enemyCost = Number(enemy.cost);
                if (!isNaN(enemyCost)) {
                    // Add coins to the player's total
                    this.scene.coins += enemyCost;
                } else {
                    console.error('Enemy cost is not a number:', enemy.cost);
                }

                // Update the UI to reflect the new coin total
                this.scene.uiManager.updateCoins(this.scene.coins);

                // Notify the EnemyManager about the enemy's death
                this.scene.enemyManager.handleEnemyDeath(enemy);
            }
        } else {
            console.error('Invalid collision objects:', object1, object2);
        }
    }

    /**
     * Handles collision between the tower and an enemy.
     * @param object1 - The first object involved in the collision.
     * @param object2 - The second object involved in the collision.
     */
    private handleEnemyTowerCollision(
        object1: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Tilemaps.Tile,
        object2: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Tilemaps.Tile
    ): void {
        const tower = object1 instanceof Tower ? object1 : (object2 as Tower);
        const enemy = object1 instanceof Tower ? (object2 as Enemy) : (object1 as Enemy);

        if (tower && enemy) {
            // Destroy the enemy
            enemy.destroy();

            // Inflict damage on the tower
            tower.takeDamage(100); // Adjust damage as needed

            // Check if the tower's health has dropped to zero or below
            if (tower.health <= 0) {
                // Transition to the DeathScene
                this.scene.scene.start('DeathScene');
            }
        } else {
            console.error('Invalid collision objects:', object1, object2);
        }
    }
}

export default CollisionManager;

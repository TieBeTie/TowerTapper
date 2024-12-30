import Phaser from 'phaser';
import { Projectile } from '../objects/projectiles/Projectile';
import { ProjectileFactory } from '../factories/ProjectileFactory';
import { Enemy } from '../objects/enemies/Enemy';
import EnemyManager from './EnemyManager';


// ProjectileManager handles the logic for managing and firing projectiles at enemies
class ProjectileManager {
    scene: Phaser.Scene;
    projectiles: Phaser.Physics.Arcade.Group;
    projectileFactory: ProjectileFactory;
    enemyManager: EnemyManager;

    constructor(scene: Phaser.Scene, enemyManager: EnemyManager) {
        this.scene = scene;
        this.enemyManager = enemyManager;
        this.projectiles = this.scene.physics.add.group({
            classType: Projectile,
            runChildUpdate: true
        });
        this.projectileFactory = new ProjectileFactory(this.scene);
    }

    fireProjectile(speedMultiplier: number = 1): void {
        const targetEnemy = this.enemyManager.findNearestAvailableEnemy(this.scene.tower.x, this.scene.tower.y);
        if (targetEnemy) {
            const arrow = this.projectileFactory.createArrow(this.scene.tower.x, this.scene.tower.y);
            arrow.fire(targetEnemy.x, targetEnemy.y, speedMultiplier);
            this.projectiles.add(arrow);
            targetEnemy.isUnderAttack = true;
        }
    }

    update(time: number, delta: number): void {
        this.projectiles.children.iterate(projectile => {
            if (projectile instanceof Projectile) {
                projectile.update(time, delta);
            }
            return false;
        });
    }
}

export default ProjectileManager;

import Phaser from 'phaser';
import { Projectile } from '../objects/projectiles/Projectile';
import { ProjectileFactory } from '../factories/ProjectileFactory';

class ProjectileManager {
    scene: Phaser.Scene;
    projectiles: Phaser.Physics.Arcade.Group;
    projectileFactory: ProjectileFactory;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.projectiles = this.scene.physics.add.group({
            classType: Projectile,
            runChildUpdate: true
        });
        this.projectileFactory = new ProjectileFactory(this.scene);
    }

    fireProjectile(x: number, y: number, target: Phaser.GameObjects.Sprite): void {
        const arrow = this.projectileFactory.createArrow(x, y, target.x, target.y);
        this.projectiles.add(arrow);
    }

    update(time: number, delta: number): void {
        // Update logic for projectiles if necessary
    }
}

export default ProjectileManager;
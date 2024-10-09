// managers/ProjectileManager.js
import Projectile from '../objects/projectiles/Projectile';

class ProjectileManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = this.scene.physics.add.group({
            classType: Projectile,
            runChildUpdate: true
        });
    }

    fireProjectile(x, y, target) {
        if (target) {
            const projectile = new Projectile(this.scene, x, y, 'projectile', target);
            this.projectiles.add(projectile);
        }
    }

    update(time, delta) {
        this.projectiles.getChildren().forEach(projectile => {
            projectile.update(time, delta);
        });
    }
}

export default ProjectileManager;

// managers/EnemyManager.js
import EnemyFactory from '../factories/EnemyFactory';

class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.enemies = this.scene.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });

        // Спавн врагов с интервалом
        this.scene.time.addEvent({
            delay: 500,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }

    spawnEnemy() {
        const enemyType = Phaser.Math.RND.pick(['orc', 'goblin']);
        const xPosition = Phaser.Math.Between(50, this.scene.scale.width - 50);
        const yPosition = Phaser.Math.RND.pick([0, this.scene.scale.height - 100]);

        const enemy = EnemyFactory.createEnemy(enemyType, this.scene, xPosition, yPosition);
        if (enemy) {
            this.enemies.add(enemy);
        } else {
            console.error(`Не удалось создать врага типа: ${enemyType}`);
        }
    }

    findNearestEnemy(x, y) {
        let nearestEnemy = null;
        let minDistance = Infinity;

        this.enemies.getChildren().forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        });

        return nearestEnemy;
    }

    update(time, delta) {
        this.enemies.getChildren().forEach(enemy => {
            enemy.update(time, delta);
        });
    }
}

export default EnemyManager;

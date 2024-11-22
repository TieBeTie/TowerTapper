import Phaser from 'phaser';
import EnemyFactory from '../factories/EnemyFactory';
import Enemy from '../objects/enemies/Enemy';

class EnemyManager {
    scene: Phaser.Scene;
    enemies: Phaser.Physics.Arcade.Group;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.enemies = this.scene.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });

        // Spawn enemies at regular intervals
        this.scene.time.addEvent({
            delay: 500,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }

    spawnEnemy(): void {
        const enemyType = Phaser.Math.RND.pick(['orc', 'goblin']) as 'orc' | 'goblin';
        const xPosition = Phaser.Math.Between(50, this.scene.scale.width - 50);
        const yPosition = Phaser.Math.RND.pick([0, this.scene.scale.height - 100]) as number;

        const enemy = EnemyFactory.createEnemy(enemyType, this.scene, xPosition, yPosition);
        if (enemy) {
            this.enemies.add(enemy);
        } else {
            console.error(`Failed to create enemy of type: ${enemyType}`);
        }
    }

    findNearestEnemy(x: number, y: number): Enemy | null {
        let nearestEnemy: Enemy | null = null;
        let minDistance = Infinity;

        this.enemies.getChildren().forEach((enemy: Phaser.GameObjects.GameObject) => {
            const distance = Phaser.Math.Distance.Between(x, y, (enemy as Enemy).x, (enemy as Enemy).y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy as Enemy;
            }
        });

        return nearestEnemy;
    }

    update(time: number, delta: number): void {
        this.enemies.getChildren().forEach((enemy: Phaser.GameObjects.GameObject) => {
            (enemy as Enemy).update(time, delta);
        });
    }

    handleEnemyDeath(enemy: Phaser.GameObjects.GameObject): void {
        // Получаем позицию врага
        const x = (enemy as Enemy).x;
        const y = (enemy as Enemy).y;

        // Создаем спрайт анимации смерти на позиции врага
        const deathAnimation = this.scene.add.sprite(x, y, 'enemy_die');
        deathAnimation.play('enemy_die');

        // Удаляем врага из группы и сцены
        this.enemies.remove(enemy, true, true);

        // Удаляем анимацию после завершения
        deathAnimation.on('animationcomplete', () => {
            deathAnimation.destroy();
        }, this);
    }
}

export default EnemyManager;
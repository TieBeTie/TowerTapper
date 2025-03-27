import Phaser from 'phaser';
import EnemyFactory from '../factories/EnemyFactory';
import Enemy from '../objects/enemies/Enemy';
import CoinCollectionEffectFromEnemyManager from './CoinManager';
import { UIManager } from './UIManager';
import { WaveManager } from './WaveManager';
import Tower from '../objects/towers/Tower';
import GameScene from '../scenes/GameScene';

// EnemyManager handles the logic for managing and spawning enemies
class EnemyManager {
    scene: Phaser.Scene;
    enemies: Phaser.Physics.Arcade.Group;
    private coinCollectionEffectFromEnemy: CoinCollectionEffectFromEnemyManager;
    private waveManager: WaveManager;
    private spawnTimer: Phaser.Time.TimerEvent | null = null;

    constructor(scene: Phaser.Scene, uiManager: UIManager, coinCollectionEffectFromEnemy: CoinCollectionEffectFromEnemyManager, waveManager: WaveManager) {
        this.scene = scene;
        this.enemies = this.scene.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });
        this.coinCollectionEffectFromEnemy = coinCollectionEffectFromEnemy;
        this.waveManager = waveManager;

        // Подписка на события волн
        this.waveManager.on('waveStart', (waveConfig: { number: number; enemyHealthMultiplier: number; enemyCount: number; spawnInterval: number }) => {
            this.startSpawningEnemies(waveConfig);
        });

        // Начинаем первую волну
        this.waveManager.startNextWave();
    }

    // Геттер для получения статуса таймера спавна
    public isSpawnTimerActive(): boolean {
        return this.spawnTimer !== null;
    }

    startSpawningEnemies(waveConfig: any): void {
        // Останавливаем предыдущий таймер, если он существует
        if (this.spawnTimer) {
            this.spawnTimer.remove();
            this.spawnTimer = null;
        }
        
        let enemiesSpawned = 0;
        console.log(`Starting wave ${waveConfig.number} with ${waveConfig.enemyCount} enemies`);
        
        // Проверяем, что в волне есть враги для спавна
        if (waveConfig.enemyCount <= 0) {
            console.warn("Wave has no enemies to spawn, completing immediately");
            this.waveManager.enemyDefeated(); // Вызываем один раз, чтобы завершить "пустую" волну
            return;
        }
        
        // Создаем таймер для спавна врагов
        this.spawnTimer = this.scene.time.addEvent({
            delay: waveConfig.spawnInterval,
            callback: () => {
                // Проверяем, что волна активна
                if (!this.waveManager.isCurrentWaveActive()) {
                    console.log("Wave is no longer active, stopping spawn timer");
                    if (this.spawnTimer) {
                        this.spawnTimer.remove();
                        this.spawnTimer = null;
                    }
                    return;
                }
                
                if (enemiesSpawned < waveConfig.enemyCount) {
                    const success = this.spawnEnemy();
                    if (success) {
                        enemiesSpawned++;
                        console.log(`Spawned enemy ${enemiesSpawned}/${waveConfig.enemyCount}`);
                    } else {
                        console.warn("Failed to spawn enemy, will retry");
                    }
                    
                    // Если это последний враг, сразу останавливаем таймер
                    if (enemiesSpawned >= waveConfig.enemyCount) {
                        console.log("All enemies spawned, removing timer");
                        if (this.spawnTimer) {
                            this.spawnTimer.remove();
                            this.spawnTimer = null;
                        }
                    }
                } else {
                    console.log("Extra spawn attempt stopped, removing timer");
                    if (this.spawnTimer) {
                        this.spawnTimer.remove();
                        this.spawnTimer = null;
                    }
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    spawnEnemy(): boolean {
        const enemyType = Phaser.Math.RND.pick(['orc', 'goblin']) as 'orc' | 'goblin';
        const xPosition = Phaser.Math.Between(50, this.scene.scale.width - 50);
        const yPosition = Phaser.Math.RND.pick([0, this.scene.scale.height - 100]) as number;

        const enemy = EnemyFactory.createEnemy(enemyType, this.scene, xPosition, yPosition, this.waveManager);
        if (enemy) {
            this.enemies.add(enemy);
            
            // Подписываемся на событие когда враг достигает башни (это не то же самое, что смерть от стрелы)
            enemy.once('reached', () => {
                // Удаляем врага из группы
                this.enemies.remove(enemy, true, true);
                
                // Уведомляем WaveManager о поражении врага только если он достиг башни
                this.waveManager.enemyDefeated();
                
                console.log("Enemy reached tower");
            });
            
            return true;
        } else {
            console.error(`Failed to create enemy of type: ${enemyType}`);
            // НЕ вызываем enemyDefeated если просто не удалось создать врага
            return false;
        }
    }

    findNearestAvailableEnemy(x: number, y: number): Enemy | null {
        let nearestEnemy: Enemy | null = null;
        let minDistance = Infinity;

        // Check if enemies group is valid before accessing it
        if (!this.enemies || !this.enemies.getChildren) {
            return null;
        }
        
        try {
            const children = this.enemies.getChildren();
            if (Array.isArray(children)) {
                children.forEach((enemy: Phaser.GameObjects.GameObject) => {
                    if (enemy && enemy.active) {
                        const enemyInstance = enemy as Enemy;
                        const distance = Phaser.Math.Distance.Between(x, y, enemyInstance.x, enemyInstance.y);
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearestEnemy = enemyInstance;
                        }
                    }
                });
            }
        } catch (error) {
            console.warn('Error in findNearestAvailableEnemy:', error);
        }

        return nearestEnemy;
    }

    update(time: number, delta: number): void {
        // Check if enemies group is valid before accessing it
        if (!this.enemies || !this.enemies.getChildren) {
            return;
        }
        
        try {
            const children = this.enemies.getChildren();
            if (Array.isArray(children)) {
                children.forEach((enemy: Phaser.GameObjects.GameObject) => {
                    if (enemy && enemy.active) {
                        (enemy as Enemy).update(time, delta);
                    }
                });
            }
        } catch (error) {
            console.warn('Error in EnemyManager update:', error);
        }
    }

    handleEnemyDeath(enemy: Phaser.GameObjects.GameObject): void {
        // Safety check
        if (!enemy || !this.enemies) {
            return;
        }

        try {
            // Получаем позицию врага
            const x = (enemy as Phaser.Physics.Arcade.Sprite).x;
            const y = (enemy as Phaser.Physics.Arcade.Sprite).y;

            // Make sure scene is valid before creating animations
            if (!this.scene || !this.scene.add) {
                return;
            }

            const deathAnimation = this.scene.add.sprite(x, y, 'enemy_die');
            deathAnimation.setScale(Enemy.ENEMY_SCALE);
            deathAnimation.play('enemy_die');

            // Удаляем врага из группы и сцены
            if (this.enemies.remove) {
                this.enemies.remove(enemy, true, true);
            }

            // Удаляем анимацию после завершения
            deathAnimation.on('animationcomplete', () => {
                deathAnimation.destroy();
            }, this);

            // Уведомляем WaveManager о поражении врага (от стрелы)
            if (this.waveManager) {
                this.waveManager.enemyDefeated();
            }
            console.log("Enemy killed by arrow");

            // Spawn a coin above the castle (Tower)
            if (this.scene && this.scene.children && this.scene.children.getByName) {
                const tower = this.scene.children.getByName('tower') as Tower;
                if (tower && this.coinCollectionEffectFromEnemy) {
                    this.coinCollectionEffectFromEnemy.spawnCoin(new Phaser.Math.Vector2(x, y), tower);
                } else {
                    console.warn('Башня не найдена в сцене.');
                }
            }

            // Play enemy death sound
            const gameScene = this.scene as GameScene;
            if (gameScene && gameScene.audioManager) {
                gameScene.audioManager.playSound('enemyDie');
            }
        } catch (error) {
            console.warn('Error in handleEnemyDeath:', error);
        }
    }
}

export default EnemyManager;
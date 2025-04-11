import Phaser from 'phaser';
import EnemyFactory from '../factories/EnemyFactory';
import Enemy from '../objects/enemies/Enemy';
import GoldManager from './GoldManager';
import { UIManager } from './UIManager';
import { WaveManager } from './WaveManager';
import Tower from '../objects/towers/Tower';
import GameScene from '../services/scenes/GameScene';
import { SkillStateManager } from '../managers/SkillStateManager';

// EnemyManager handles the logic for managing and spawning enemies
class EnemyManager {
    scene: Phaser.Scene;
    enemies: Phaser.Physics.Arcade.Group;
    private goldCollectionEffectFromEnemy: GoldManager;
    private waveManager: WaveManager;
    private spawnTimer: Phaser.Time.TimerEvent | null = null;
    private skillStateManager: SkillStateManager;

    constructor(scene: Phaser.Scene, uiManager: UIManager, goldCollectionEffectFromEnemy: GoldManager, waveManager: WaveManager) {
        this.scene = scene;
        this.enemies = this.scene.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });
        this.goldCollectionEffectFromEnemy = goldCollectionEffectFromEnemy;
        this.waveManager = waveManager;
        this.skillStateManager = SkillStateManager.getInstance();

        // Подписка на события волн
        this.waveManager.on('waveStart', (waveConfig: { number: number; enemyHealthMultiplier: number; enemyCount: number; spawnInterval: number }) => {
            this.startSpawningEnemies(waveConfig);
        });

        // Начинаем первую волну
        this.waveManager.startNextWave();
    }

    // Геттер для получения статуса таймера спавна
    public isSpawnTimerActive(): boolean {
        return this.spawnTimer !== null && !this.spawnTimer.hasDispatched;
    }

    startSpawningEnemies(waveConfig: any): void {
        // Destroy existing timer if it exists
        this.clearSpawnTimer();
        
        // Extract wave config
        const enemyCount = waveConfig.enemyCount || 10;
        
        // Make each wave last exactly 20 seconds by calculating the appropriate spawn interval
        const waveDuration = 20000; // 20 seconds in milliseconds
        const spawnInterval = waveDuration / enemyCount;
        
        // Apply game speed to spawn interval
        const gameSpeed = this.skillStateManager.getGameSpeed();
        const adjustedSpawnInterval = spawnInterval / gameSpeed;
        
        // Create a spawn counter to track how many enemies need to be spawned
        let enemiesLeftToSpawn = enemyCount;
        
        // Start a timer to spawn enemies at the calculated interval
        this.spawnTimer = this.scene.time.addEvent({
            delay: adjustedSpawnInterval,
            callback: () => {
                if (enemiesLeftToSpawn > 0) {
                    this.spawnEnemy();
                    enemiesLeftToSpawn--;
                    
                    if (enemiesLeftToSpawn <= 0) {
                        this.clearSpawnTimer();
                    }
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    spawnEnemy(): boolean {
        try {
            // First make sure we have a valid scene and physics system
            if (!this.scene || !this.scene.physics) {
                console.error('Scene or physics not available');
                return false;
            }
            
            // Check if enemies group exists and recreate if needed
            if (!this.enemies) {
                console.warn('Enemies group not found, recreating');
                this.enemies = this.scene.physics.add.group({
                    classType: Enemy,
                    runChildUpdate: true
                });
            }
            
            // Определяем сторону появления врага (0 = сверху, 1 = справа, 2 = снизу, 3 = слева)
            const spawnSide = Phaser.Math.Between(0, 3);
            let xPosition = 0;
            let yPosition = 0;
            
            // Выбираем координаты в зависимости от стороны
            switch (spawnSide) {
                case 0: // Сверху
                    xPosition = Phaser.Math.Between(50, this.scene.scale.width - 50);
                    yPosition = 0;
                    break;
                case 1: // Справа
                    xPosition = this.scene.scale.width;
                    yPosition = Phaser.Math.Between(50, this.scene.scale.height - 50);
                    break;
                case 2: // Снизу
                    xPosition = Phaser.Math.Between(50, this.scene.scale.width - 50);
                    yPosition = this.scene.scale.height;
                    break;
                case 3: // Слева
                    xPosition = 0;
                    yPosition = Phaser.Math.Between(50, this.scene.scale.height - 50);
                    break;
            }
            
            // Generate random enemy type
            const enemyType = Phaser.Math.RND.pick(['orc', 'goblin']) as 'orc' | 'goblin';

            // Create the enemy
            const enemy = EnemyFactory.createEnemy(enemyType, this.scene, xPosition, yPosition, this.waveManager);
            
            // Add enemy to group if valid
            if (enemy && this.enemies && this.enemies.add) {
                this.enemies.add(enemy);
                
                // Set up reached event
                enemy.once('reached', () => {
                    // Safely remove from group
                    if (this.enemies && this.enemies.remove) {
                        this.enemies.remove(enemy, true, true);
                    }
                    
                    // Update wave manager
                    if (this.waveManager) {
                        this.waveManager.enemyDefeated();
                    }
                    
                    console.log("Enemy reached tower");
                });
                
                return true;
            } else {
                console.error(`Failed to create enemy of type: ${enemyType}`);
                return false;
            }
        } catch (error) {
            console.error('Error in spawnEnemy:', error);
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

            // Spawn a gold above the castle (Tower)
            if (this.scene && this.scene.children && this.scene.children.getByName) {
                const tower = this.scene.children.getByName('tower') as Tower;
                if (tower && this.goldCollectionEffectFromEnemy) {
                    this.goldCollectionEffectFromEnemy.spawnGold(new Phaser.Math.Vector2(x, y), tower);
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

    clearSpawnTimer(): void {
        if (this.spawnTimer) {
            this.spawnTimer.remove();
            this.spawnTimer = null;
        }
    }
}

export default EnemyManager;
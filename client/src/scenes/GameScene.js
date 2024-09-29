import Phaser from 'phaser';
import Tower from '../objects/Tower';
import EnemyFactory from '../objects/Enemy/EnemyFactory';
import Projectile from '../objects/Projectile';
import Enemy from '../objects/Enemy/Enemy';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Загрузка игровых ресурсов
        this.load.image('castle', 'assets/images/castle.png');
        this.load.image('orc', 'assets/images/enemies/orc.png');
        this.load.image('goblin', 'assets/images/enemies/goblin.png');
        this.load.image('logo', 'assets/images/logo.png'); // Если используется
        this.load.image('projectile', 'assets/images/projectile.png'); // Добавляем снаряд
    }

    create() {
        const { width, height } = this.scale;

        // Инициализация замка в центре экрана
        this.tower = new Tower(this, width / 2, height / 2, 'castle');

        // Создание группы врагов с правильным classType
        this.enemies = this.physics.add.group({
            classType: Enemy, // Исправлено: Используем класс Enemy
            runChildUpdate: true
        });

        // Создание группы снарядов
        this.projectiles = this.physics.add.group({
            classType: Projectile,
            runChildUpdate: true
        });

        // Спавн врагов с интервалом
        this.time.addEvent({
            delay: 300,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Обработка кликов для запуска снарядов
        this.input.on('pointerdown', this.fireProjectile, this);

        // Настройка коллайшенов между снарядами и врагами
        this.physics.add.overlap(this.projectiles, this.enemies, this.handleProjectileEnemyCollision, null, this);

        // Настройка коллайшенов между врагами и замком
        this.physics.add.overlap(this.enemies, this.tower, this.handleEnemyTowerCollision, null, this);
    }

    spawnEnemy() {
        const enemyType = Phaser.Math.RND.pick(['Orc', 'Goblin']);
        const xPosition = Phaser.Math.Between(50, this.scale.width - 50);
        const yPosition = Phaser.Math.RND.pick([0, this.scale.height]); // Спавн сверху или снизу
        const enemy = EnemyFactory.createEnemy(enemyType, this, xPosition, yPosition);
        this.enemies.add(enemy);
    }

    fireProjectile(pointer) {
        const projectile = new Projectile(this, this.tower.x, this.tower.y, 'projectile', pointer.x, pointer.y);
        this.projectiles.add(projectile);
    }

    handleProjectileEnemyCollision(projectile, enemy) {
        projectile.destroy();
        enemy.takeDamage(50); // Урон от снаряда
    }

    handleEnemyTowerCollision(enemy, tower) {
        enemy.destroy();
        tower.takeDamage(100); // Урон от врага
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
        this.projectiles.getChildren().forEach(projectile => {
            projectile.update(time, delta);
        });
    }
}

export default GameScene;
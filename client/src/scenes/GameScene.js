import Phaser from 'phaser';
import Tower from '../objects/Tower';
import EnemyFactory from '../objects/Enemy/EnemyFactory';
import Projectile from '../objects/Projectile';
import Enemy from '../objects/Enemy/Enemy';
import Button from '../ui/Button';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Загрузка игровых ресурсов
        this.load.on('filecomplete', function (key, type, data) {
            console.log(`File complete: ${key}`);
        });

        this.load.on('loaderror', function (file) {
            console.error(`Error loading file: ${file.key}`);
        });

        this.load.image('tower', './assets/images/towers/tower.png');
        this.load.image('orc', './assets/images/enemies/orc.png'); // Исправлено: 'zombie.png' на 'orc.png'
        this.load.image('goblin', './assets/images/enemies/goblin.png');
        this.load.image('logo', './assets/images/logo.png'); // Если используется
        this.load.image('projectile', './assets/images/fireball.png'); // Добавляем снаряд

        // Загрузка необходимых ресурсов для кнопок
        this.load.image('playButton', 'assets/images/play.png');
        this.load.image('pauseButton', 'assets/images/pause.png');
        this.load.image('upgradeButton', 'assets/images/upgrade.png');
        this.load.image('coin', 'assets/images/coin.png');
    }

    create() {
        const { width, height } = this.scale;
        const panelHeight = 100; // Высота нижней панели

        // Инициализация монет
        this.coins = 0;
        this.coinText = this.add.text(16, 16, 'Монеты: 0', { fontSize: '24px', fill: '#fff' });

        // Инициализация коэффициента тапания
        this.tapCoefficient = 1;
        this.tapText = this.add.text(16, 50, 'Коэффициент тапания: 1.0', { fontSize: '24px', fill: '#fff' });

        // Создание нижней панели после инициализации текстов
        this.createBottomPanel(width, height, panelHeight);

        // Инициализация замка в центре игровой области (учитывая панель)
        this.tower = new Tower(this, width / 2, (height - panelHeight) / 2, 'tower');

        // Создание группы врагов с правильным classType
        this.enemies = this.physics.add.group({
            classType: Enemy, // Используем класс Enemy
            runChildUpdate: true
        });

        // Создание группы снарядов
        this.projectiles = this.physics.add.group({
            classType: Projectile,
            runChildUpdate: true
        });

        // Спавн врагов с интервалом
        this.time.addEvent({
            delay: 2000, // Интервал спавна врагов (миллисекунды)
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Обработка кликов для запуска снарядов и увеличения монет
        this.input.on('pointerdown', (pointer, gameObjects) => {
            // Проверка, был ли клик на UI элементе
            if (gameObjects.length === 0) {
                this.fireProjectile(pointer);
                this.handleTap(pointer);
            }
        }, this);

        // Настройка коллайшенов между снарядами и врагами
        this.physics.add.overlap(this.projectiles, this.enemies, this.handleProjectileEnemyCollision, null, this);

        // Настройка коллайшенов между замком и врагами
        this.physics.add.overlap(this.tower, this.enemies, this.handleEnemyTowerCollision, null, this);

        // Настройка увеличения коэффициента тапания каждые 3 секунды
        this.time.addEvent({
            delay: 2000, // 3 секунды
            callback: this.increaseTapCoefficient,
            callbackScope: this,
            loop: true
        });
    }

    createBottomPanel(width, height, panelHeight) {
        // Создание графики для панели
        const panel = this.add.graphics();
        panel.fillStyle(0x333333, 1); // Темно-серая панель
        panel.fillRect(0, height - panelHeight, width, panelHeight);

        // Создание контейнера для UI элементов на панели
        const uiContainer = this.add.container(0, height - panelHeight);

        // Параметры размещения кнопок
        const buttonSpacing = width / 4;

        // Кнопка Плей/Пауза
        this.isPaused = false;
        this.playPauseButton = new Button(this, buttonSpacing, panelHeight / 2, 'pauseButton', () => {
            if (this.isPaused) {
                this.scene.stop('PauseScene'); // Остановить PauseScene для возобновления игры
                this.isPaused = false;
                this.playPauseButton.setTexture('pauseButton');
            } else {
                this.scene.launch('PauseScene'); // Запустить PauseScene
                this.isPaused = true;
                this.playPauseButton.setTexture('playButton');
            }
        });

        // Кнопка Улучшения
        this.upgradeButton = new Button(this, 3 * buttonSpacing, panelHeight / 2, 'upgradeButton', () => {
            this.scene.launch('UpgradeScene');
            // Дополнительно можно приостановить GameScene, если требуется
            this.scene.pause();
        });

        // Добавление кнопок в контейнер
        uiContainer.add([this.playPauseButton, this.upgradeButton]);
    }

    spawnEnemy() {
        const enemyType = Phaser.Math.RND.pick(['orc', 'goblin']);
        const xPosition = Phaser.Math.Between(50, this.scale.width - 50);
        const yPosition = Phaser.Math.RND.pick([0, this.scale.height - 100]);

        const enemy = EnemyFactory.createEnemy(enemyType, this, xPosition, yPosition);
        if (enemy) {
            this.enemies.add(enemy);
        } else {
            console.error(`Не удалось создать врага типа: ${enemyType}`);
        }
    }

    fireProjectile(pointer) {
        const nearestEnemy = this.findNearestEnemy(this.tower.x, this.tower.y);
        if (nearestEnemy) {
            const projectile = new Projectile(this, this.tower.x, this.tower.y, 'projectile', nearestEnemy);
            this.projectiles.add(projectile);
        }
    }

    handleProjectileEnemyCollision(projectile, enemy) {
        projectile.destroy();
        enemy.takeDamage(50); // Урон от снаряда
    }

    handleEnemyTowerCollision(tower, enemy) {
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

        this.enemies.getChildren().forEach(enemy => {
            enemy.update(time, delta);
        });
    }

    handleTap(pointer) {
        this.coins += 1 * this.tapCoefficient;
        this.coinText.setText(`Монеты: ${Math.floor(this.coins)}`);
    }

    increaseTapCoefficient() {
        this.tapCoefficient += 0.5;
        this.tapText.setText(`Коэффициент тапания: ${this.tapCoefficient.toFixed(1)}`);
    }
}

export default GameScene;
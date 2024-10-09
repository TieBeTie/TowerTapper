import Phaser from 'phaser';

class Tower extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.health = 500;
        this.maxHealth = 500; // Максимальное здоровье
        this.setImmovable(true); // Замок не движется
        this.setCollideWorldBounds(true);
        // Диагностика: Вывод текущей сцены
        console.log('Tower создан. Сцена:', this.scene.key);
        // Инициализация графики для шкалы здоровья
        this.healthBar = scene.add.graphics();
        this.updateHealthBar();
    }


    upgrade() {
        // Логика улучшения замка
        this.maxHealth += 100;
        this.health += 100;
        console.log('Замок улучшен! Текущее здоровье:', this.health);
        this.updateHealthBar();
    }

    takeDamage(amount) {
        this.health -= amount;
        console.log('Замок получил урон:', amount, 'Текущее здоровье:', this.health);
        this.updateHealthBar();
        if (this.health <= 0) {
            this.destroy();
            this.healthBar.destroy();
            console.log('Замок уничтожен!');
            // Правильный вызов метода start
            if (this.scene) { // Проверка, что this.scene определен
                this.scene.start('DeathScene');
            } else {
                console.error('Сцена не определена при попытке перейти в DeathScene.');
            }
        }
    }

    updateHealthBar() {
        // Очистка предыдущего состояния
        this.healthBar.clear();

        // Параметры шкалы здоровья
        const barWidth = 100;
        const barHeight = 10;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.height / 2 - 20;

        // Рисуем фон шкалы (красный цвет)
        this.healthBar.fillStyle(0xff0000);
        this.healthBar.fillRect(barX, barY, barWidth, barHeight);

        // Рисуем текущее здоровье (зелёный цвет)
        const healthPercentage = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
        this.healthBar.fillStyle(0x00ff00);
        this.healthBar.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
    }
}

export default Tower;
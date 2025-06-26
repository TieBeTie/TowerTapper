import Phaser from 'phaser';
import Enemy from './Enemy';
import PerlinNoise from '../../utils/PerlinNoise';
import { ENEMY_ATTRIBUTES } from '../../definitions/EnemyAttributes';

class BombOrbEnemy extends Enemy {
    static readonly BOSS_SCALE = 0.2;

    private exploded: boolean = false;
    private jitterX: number = 0;
    private jitterY: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string = 'bomb_orb', cost: number = 500) {
        super(scene, x, y, texture, cost);

        // Параметры босса
        this.setScale(BombOrbEnemy.BOSS_SCALE);
        // Увеличим хитбокс, чтобы столкновения срабатывали чуть раньше
        if (this.body) {
            const base = Math.max(this.width, this.height) * BombOrbEnemy.BOSS_SCALE * 1.25; // +25%
            (this.body as Phaser.Physics.Arcade.Body).setCircle(
                base,
                (this.width - base * 2) * 0.5,
                (this.height - base * 2) * 0.5
            );
        }
        // Используем атрибуты из единого словаря
        const attrs = ENEMY_ATTRIBUTES['bomb_orb'];
        this.setHealth(attrs.baseHealth);
        this.setDamage(attrs.baseDamage);
        this.setSpeed(attrs.baseSpeed);
        this.setOrigin(0.5, 0.5);

        // У босса статичное изображение: не нужна анимация ходьбы
        this.anims.stop();
        // Анимация могла переключить текстуру на 'orby_move', вернём исходную
        this.setTexture('bomb_orb');
    }

    update(time: number, delta: number): void {
        // Сначала убираем старое смещение, затем обновляем базовую логику
        this.x -= this.jitterX;
        this.y -= this.jitterY;

        super.update(time, delta);

        if (this.exploded) return;

        // Генерируем новое резкое смещение в диапазоне -2..2 пикселя
        this.jitterX = Phaser.Math.Between(-1, 1);
        this.jitterY = Phaser.Math.Between(-1, 1);

        this.x += this.jitterX;
        this.y += this.jitterY;

        // Проверяем расстояние до башни
        if (!this.scene) return;
        const tower = this.scene.children.getByName('tower') as Phaser.Physics.Arcade.Sprite;
        if (!tower) return;

        const distance = Phaser.Math.Distance.Between(this.x, this.y, tower.x, tower.y);
        if (distance < 40) { // ближний радиус детонации
            this.explode();
        }
    }

    private explode(): void {
        if (this.exploded) return;
        this.exploded = true;

        // Повреждаем башню
        const tower = this.scene.children.getByName('tower') as any;
        if (tower && typeof tower.takeDamage === 'function') {
            tower.takeDamage(this.damage);
        }

        // Точка взрыва — середина между башней и орбом
        const explodeX = (this.x + tower.x) / 2;
        const explodeY = (this.y + tower.y) / 2;

        // Визуальный эффект взрыва — небольшой фейерверк
        if (!this.scene.textures.exists('square_particle')) {
            const g = this.scene.add.graphics();
            g.fillStyle(0xffffff, 1);
            g.fillRect(0, 0, 6, 6);
            g.generateTexture('square_particle', 6, 6);
            g.destroy();
        }

        // --- Основной всплеск ---
        const yellowPalette = [0xFFEB3B, 0xFFC107, 0xFFB300, 0xFF9800, 0xFF6F00, 0xFF5722];

        // Аудио эффект
        const gameScene: any = this.scene.scene.get('GameScene');
        if (gameScene && gameScene.audioManager) {
            gameScene.audioManager.playSound('bomb_orb_explosion');
        }

        // Уведомляем менеджер волн
        const gameSceneAny: any = this.scene.scene.get('GameScene');
        if (gameSceneAny && gameSceneAny.waveManager) {
            gameSceneAny.waveManager.enemyDefeated();
        }

        // --- Облако салюта ---
        const cloudEllipse = new Phaser.Geom.Ellipse(0, 0, 17, 13);
        const cloudEmitter = this.scene.add.particles(explodeX, explodeY, 'square_particle', {
            lifespan: 800,
            speed: { min: 15, max: 35 },
            scale: { start: 0.35, end: 0 },
            blendMode: 'ADD',
            frequency: -1,
            tint: yellowPalette,
            gravityY: 110,
            emitZone: {
                type: 'random',
                source: {
                    getRandomPoint: (p: any) => {
                        Phaser.Geom.Ellipse.Random(cloudEllipse, p);
                        const n = PerlinNoise.noise(p.x * 0.05, p.y * 0.05) - 0.5;
                        const offset = n * 12;
                        p.x += offset;
                        p.y += offset;
                        return p;
                    }
                }
            }
        });
        cloudEmitter.setDepth?.(15);
        cloudEmitter.emitParticle(28);

        // Добавим исходящее ускорение каждому созданному фрагменту
        cloudEmitter.forEachAlive((p: any) => {
            const dx = p.x - explodeX; const dy = p.y - explodeY; const len = Math.hypot(dx, dy) || 1;
            const boost = 20;
            p.velocityX += (dx / len) * boost;
            p.velocityY += (dy / len) * boost;
        }, this);

        this.scene.time.delayedCall(2000, () => (cloudEmitter as any).manager?.destroy());

        // Уничтожаем себя
        // Сбросить дрожание
        this.x -= this.jitterX;
        this.y -= this.jitterY;
        this.destroy();
    }

    // --- Переопределённый метод получения урона ---
    takeDamage(amount: number): void {
        if (this.exploded) return;

        this.health -= amount;

        // Эффект мигания, аналогичный базовой реализации
        this.scene.tweens.add({
            targets: this,
            alpha: 0.7,
            duration: 100,
            yoyo: true,
            repeat: 1
        });

        if (this.health <= 0) {
            this.explodeCentered();
        }
    }

    /**
     * Взрыв в центре орба (используется при убийстве стрелой).
     */
    private explodeCentered(): void {
        if (this.exploded) return;
        this.exploded = true;

        // Устанавливаем здоровье 1, чтобы CollisionManager не вызвал enemyManager.handleEnemyDeath()
        this.health = 1;

        const explodeX = this.x;
        const explodeY = this.y;

        // Создаём текстуру частицы, если ещё нет
        if (!this.scene.textures.exists('square_particle')) {
            const g = this.scene.add.graphics();
            g.fillStyle(0xffffff, 1);
            g.fillRect(0, 0, 6, 6);
            g.generateTexture('square_particle', 6, 6);
            g.destroy();
        }

        const yellowPalette = [0xFFEB3B, 0xFFC107, 0xFFB300, 0xFF9800, 0xFF6F00, 0xFF5722];

        // Звук взрыва
        const gameScene: any = this.scene.scene.get('GameScene');
        if (gameScene && gameScene.audioManager) {
            gameScene.audioManager.playSound('bomb_orb_explosion');
        }

        // Сообщаем менеджеру волн о смерти врага
        const gameSceneAny: any = gameScene;
        if (gameSceneAny && gameSceneAny.waveManager) {
            gameSceneAny.waveManager.enemyDefeated();
        }

        // Частицы
        const cloudEllipse = new Phaser.Geom.Ellipse(0, 0, 17, 13);
        const cloudEmitter = this.scene.add.particles(explodeX, explodeY, 'square_particle', {
            lifespan: 800,
            speed: { min: 15, max: 35 },
            scale: { start: 0.35, end: 0 },
            blendMode: 'ADD',
            frequency: -1,
            tint: yellowPalette,
            gravityY: 110,
            emitZone: {
                type: 'random',
                source: {
                    getRandomPoint: (p: any) => {
                        Phaser.Geom.Ellipse.Random(cloudEllipse, p);
                        const n = PerlinNoise.noise(p.x * 0.05, p.y * 0.05) - 0.5;
                        const offset = n * 12;
                        p.x += offset;
                        p.y += offset;
                        return p;
                    }
                }
            }
        });
        cloudEmitter.setDepth?.(15);
        cloudEmitter.emitParticle(28);

        cloudEmitter.forEachAlive((p: any) => {
            const dx = p.x - explodeX;
            const dy = p.y - explodeY;
            const len = Math.hypot(dx, dy) || 1;
            const boost = 20;
            p.velocityX += (dx / len) * boost;
            p.velocityY += (dy / len) * boost;
        }, this);

        this.scene.time.delayedCall(2000, () => (cloudEmitter as any).manager?.destroy());

        // Выдаём золото
        const coinManager = gameSceneAny?.coinManager;
        if (coinManager) {
            coinManager.spawnGold(new Phaser.Math.Vector2(explodeX, explodeY), this.tower, this.cost);
        }

        // Сбросить дрожание
        this.x -= this.jitterX;
        this.y -= this.jitterY;
        this.destroy();
    }

    // --- Переопределяем die() чтобы вместо анимации смерти был взрыв ---
    die(): void {
        if (this.exploded) return;
        this.explodeCentered();
    }

    // При уничтожении объекта гарантируем остановку твина
    destroy(fromScene?: boolean): void {
        this.x -= this.jitterX;
        this.y -= this.jitterY;
        super.destroy(fromScene);
    }
}

export default BombOrbEnemy; 
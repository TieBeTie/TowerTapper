import Phaser from 'phaser';
import { SkillType } from '../../types/SkillType';
import { ScreenManager } from '../../managers/ScreenManager';
import { SkillStateManager } from '../../managers/SkillStateManager';
import { useGameStore } from '../../../stores/game';

class Tower extends Phaser.Physics.Arcade.Sprite {
    // Цветовые константы
    private static readonly COLOR_RED = 0xff6b6b;  // Более розовый оттенок
    private static readonly COLOR_WHITE = 0xffffff;
    private static readonly COLOR_CIRCLE = 0xffffff; // Голубой цвет для круга

    // Константа масштаба башни
    private static readonly TOWER_SCALE = 0.27;
    private static readonly TOWER_ANGLE = -4;
    private static readonly ATTACK_RANGE_CIRCLE_ALPHA = 0.1;
    private static readonly ATTACK_RANGE_CIRCLE_LINE_ALPHA = 0.3;
    // Константа для базового радиуса атаки (в % от высоты экрана)

    // We'll keep these properties for compatibility, but they'll be wrappers
    // around the centralized health system
    get health(): number { return this.skillManager.getCurrentHealth(); }
    set health(value: number) { /* Do nothing, use methods instead */ }

    get maxHealth(): number { return this.skillManager.getMaxHealth(); }
    set maxHealth(value: number) { /* Do nothing, use methods instead */ }

    get defense(): number { return this.skillManager.getState(SkillType.DEFENSE) || 0; }
    set defense(value: number) { /* Do nothing, use methods instead */ }

    get regeneration(): number { return this.skillManager.getState(SkillType.HEALTH_REGEN) || 0; }
    set regeneration(value: number) { /* Do nothing, use methods instead */ }

    private isDying: boolean = false;
    private skillManager: SkillStateManager;
    private screenManager: ScreenManager;
    private attackRangeCircle: Phaser.GameObjects.Graphics | null;
    private attackRange: number;
    private isTakingDamageAnimation: boolean = false;
    // Add throttling to prevent excessive updates
    private lastCircleUpdateTime: number = 0;
    private readonly CIRCLE_UPDATE_INTERVAL: number = 500; // ms

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Инициализируем ScreenManager
        this.screenManager = new ScreenManager(scene);

        this.skillManager = SkillStateManager.getInstance();

        // Initialize health through centralized system
        this.skillManager.initializeHealth();
        this.attackRange = this.skillManager.getState(SkillType.ATTACK_RANGE);

        // Создаем графический объект для отображения радиуса атаки с нужной глубиной
        this.attackRangeCircle = this.scene.add.graphics();
        this.attackRangeCircle.setDepth(-5); // Между островом (-15) и башней (10)
        this.updateAttackRangeVisual();

        this.setImmovable(true);
        this.setCollideWorldBounds(true);

        // Установка точного положения башни по центру игровой области
        const center = this.screenManager.getGameViewCenter();
        this.setPosition(center.x, center.y);

        // Масштаб с учетом коэффициента из ScreenManager
        const gameScale = this.screenManager.getGameScale();
        this.setScale(Tower.TOWER_SCALE * gameScale);

        // Слегка наклоняем башню влево
        this.setAngle(Tower.TOWER_ANGLE);

        if (this.body) {
            this.body.setSize(this.width * 0.6, this.height * 0.6);
            this.body.setOffset(this.width * 0.2, this.height * 0.2);
        }

        // Set tower to a high depth to ensure it's above the attack circle
        this.setDepth(10);
        this.scene.events.on('screenResize', this.handleScreenResize, this);

        // Use the new specific event name to avoid recursion
        this.scene.events.on('tower-force-attack-circle', () => {
            // Apply throttling to event handling
            const currentTime = Date.now();
            if (currentTime - this.lastCircleUpdateTime < this.CIRCLE_UPDATE_INTERVAL) {
                return; // Skip this update if not enough time has passed
            }
            this.lastCircleUpdateTime = currentTime;
            this.safeUpdateAttackCircle();
        }, this);

        // Start update loop to handle regeneration properly
        this.scene.events.on('update', this.onUpdate, this);
    }

    // Method to handle continuous regeneration in the update loop
    private onUpdate = (time: number, delta: number): void => {
        // Process regeneration through the centralized system
        this.skillManager.processRegeneration(delta);

        // Update health bar to reflect new health
        this.updateHealthBar();
    }

    private handleScreenResize(gameScale: number): void {
        this.setScale(Tower.TOWER_SCALE * gameScale);
        const center = this.screenManager.getGameViewCenter();
        this.setPosition(center.x, center.y);

        // Сохраняем небольшой наклон башни влево при изменении размера экрана
        this.setAngle(Tower.TOWER_ANGLE);

        // Apply throttling to screen resize handling
        const currentTime = Date.now();
        if (currentTime - this.lastCircleUpdateTime < this.CIRCLE_UPDATE_INTERVAL) {
            return; // Skip this update if not enough time has passed
        }
        this.lastCircleUpdateTime = currentTime;

        // Use the safer method that doesn't recreate the graphics object
        this.safeUpdateAttackCircle();
    }

    upgrade(): void {
        // Проверка наличия сцены перед обновлением
        if (!this.scene) {
            console.warn('Cannot upgrade tower: scene is undefined');
            return;
        }

        const skills = this.skillManager.getState(SkillType.MAX_HEALTH) || this.maxHealth;
        this.maxHealth = skills;
        this.defense = this.skillManager.getState(SkillType.DEFENSE) || this.defense;
        this.regeneration = this.skillManager.getState(SkillType.HEALTH_REGEN) || this.regeneration;

        // Обновляем радиус атаки при улучшении
        this.attackRange = this.skillManager.getState(SkillType.ATTACK_RANGE);

        // Update the attack range circle using the safe method
        this.safeUpdateAttackCircle();

        if (this.regeneration > 0) {
            this.startRegeneration();
        }
    }

    // Add a safe method that doesn't destroy and recreate the circle
    private safeUpdateAttackCircle(): void {
        // Получаем актуальное значение радиуса прямо из SkillStateManager
        this.attackRange = this.skillManager.getState(SkillType.ATTACK_RANGE);
        // Only update if active and has a scene
        if (!this.active || !this.scene) {
            console.warn('Cannot update attack circle: inactive tower or missing scene');
            return;
        }

        // Apply throttling directly in the update method as well
        const currentTime = Date.now();
        if (currentTime - this.lastCircleUpdateTime < this.CIRCLE_UPDATE_INTERVAL && this.attackRangeCircle) {
            return; // Skip if not enough time has passed and circle already exists
        }
        this.lastCircleUpdateTime = currentTime;

        // Make sure the circle exists
        if (!this.attackRangeCircle || !this.attackRangeCircle.scene) {
            this.attackRangeCircle = this.scene.add.graphics();
            this.attackRangeCircle.setDepth(-5); // Между островом (-15) и башней (10)
        } else {
            // Just clear the existing one instead of destroying and recreating
            this.attackRangeCircle.clear();
        }

        // Draw with more visible style 
        this.attackRangeCircle.lineStyle(3, Tower.COLOR_CIRCLE, Tower.ATTACK_RANGE_CIRCLE_LINE_ALPHA);
        // Добавляем полупрозрачную белую заливку
        this.attackRangeCircle.fillStyle(Tower.COLOR_WHITE, Tower.ATTACK_RANGE_CIRCLE_ALPHA); // 0.15 - едва заметная прозрачность
        const center = this.getPosition();
        this.attackRangeCircle.fillCircle(center.x, center.y, this.attackRange);
        this.attackRangeCircle.strokeCircle(center.x, center.y, this.attackRange);
        this.attackRangeCircle.setVisible(true);
    }

    // Обновляем визуальное отображение радиуса атаки - safer version that doesn't recreate
    public updateAttackRangeVisual(): void {
        // Проверяем, существует ли сцена перед использованием
        if (!this.scene) {
            console.warn('Cannot update attack range visual: scene is undefined');
            return;
        }

        // First, ensure the graphics object exists
        if (!this.attackRangeCircle || !this.attackRangeCircle.scene) {
            this.attackRangeCircle = this.scene.add.graphics();
            this.attackRangeCircle.setDepth(-5); // Между островом (-15) и башней (10)
        } else {
            // Just clear it rather than destroying and recreating
            this.attackRangeCircle.clear();
        }

        // Draw with more visible style
        this.attackRangeCircle.lineStyle(3, Tower.COLOR_CIRCLE, Tower.ATTACK_RANGE_CIRCLE_LINE_ALPHA);
        this.attackRangeCircle.fillStyle(Tower.COLOR_WHITE, Tower.ATTACK_RANGE_CIRCLE_ALPHA);
        const center = this.getPosition();
        this.attackRangeCircle.fillCircle(center.x, center.y, this.attackRange);
        this.attackRangeCircle.strokeCircle(center.x, center.y, this.attackRange);
        this.attackRangeCircle.setVisible(true);
    }

    // Keep this method, but make it safer
    private forceAttackRangeVisibility(): void {
        // Use the safer update method instead of destroying and recreating
        this.safeUpdateAttackCircle();
    }

    // Проверяем, находится ли враг в радиусе атаки
    isInAttackRange(enemy: Phaser.GameObjects.GameObject): boolean {
        if (!enemy || !enemy.active) return false;

        const distance = Phaser.Math.Distance.Between(
            this.x,
            this.y,
            (enemy as Phaser.Physics.Arcade.Sprite).x,
            (enemy as Phaser.Physics.Arcade.Sprite).y
        );

        return distance <= this.attackRange;
    }

    // Получаем текущий радиус атаки
    getAttackRange(): number {
        // Берём актуальное значение из SkillStateManager,
        // чтобы не зависеть от устаревшего свойства
        return this.skillManager.getState(SkillType.ATTACK_RANGE);
    }

    // Method required by UpgradeManager
    updateHealthBar(): void {
        // Safety check for scene existence
        if (!this.scene) return;

        // Get current health values from the centralized system
        const currentHealth = this.skillManager.getCurrentHealth();
        const maxHealth = this.skillManager.getMaxHealth();

        // Update Pinia store
        try {
            const gameStore = useGameStore();
            gameStore.updateHealth(currentHealth, maxHealth);
        } catch (err) {
            console.warn('Could not update Pinia store with health', err);
        }

        // If a GameScene health bar needs to be updated
        if ('updateHealthBar' in this.scene) {
            (this.scene as any).updateHealthBar(currentHealth, maxHealth);
        }
    }

    takeDamage(amount: number): void {
        if (!this.active || this.isDying) return;

        this.skillManager.applyDamage(amount);

        if (!this.scene) return;

        if ('audioManager' in this.scene) {
            (this.scene as any).audioManager?.playSound('towerDamage');
        }

        // Запускаем анимацию только если не идёт предыдущая
        if (!this.isTakingDamageAnimation) {
            this.isTakingDamageAnimation = true;
            this.scene.tweens.add({
                targets: this,
                x: this.x + 4,
                duration: 15,
                yoyo: true,
                repeat: 2,
                ease: 'Stepped',
                onComplete: () => {
                    this.x = this.x; // Вернуть на место (или не трогать вообще)
                    this.isTakingDamageAnimation = false;
                }
            });

            this.setTint(Tower.COLOR_RED);
            this.scene.time.delayedCall(100, () => {
                if (!this.isDying && this.scene) {
                    this.clearTint();
                }
            });
        }

        if (this.health <= 0) {
            this.die();
        }
        this.updateHealthBar();
    }

    private die(): void {
        this.isDying = true;
        this.stopRegeneration();

        // Reset gold to zero when tower dies
        if (this.scene) {
            const gameScene = this.scene.scene.get('GameScene');
            // Обновляем статус башни в хранилище Pinia
            try {
                const gameStore = useGameStore();
                gameStore.setTowerAlive(false);
            } catch (err) {
                console.warn('Could not update tower alive status in store', err);
            }

            if ((gameScene as any).goldManager) {
                (gameScene as any).goldManager.updateGoldDirectly(0);
            }
            // Скрываем UI и glow-эффект при смерти башни
            if ((gameScene as any).uiManager && typeof (gameScene as any).uiManager.setVisible === 'function') {
                (gameScene as any).uiManager.setVisible(false);
                // Скрываем StatsView полностью
                if ((gameScene as any).uiManager.statsView && typeof (gameScene as any).uiManager.statsView.setVisible === 'function') {
                    (gameScene as any).uiManager.statsView.setVisible(false);
                }
                // Полностью уничтожаем UIManager
                if (typeof (gameScene as any).uiManager.destroy === 'function') {
                    (gameScene as any).uiManager.destroy();
                    (gameScene as any).uiManager = null;
                }
            }
            if ((gameScene as any).mysticalBackground && typeof (gameScene as any).mysticalBackground.hideGlowLayer === 'function') {
                (gameScene as any).mysticalBackground.hideGlowLayer();
            }
            // collision manager
            if ((gameScene as any).collisionManager && typeof (gameScene as any).collisionManager.destroy === 'function') {
                (gameScene as any).collisionManager.destroy();
                (gameScene as any).collisionManager = null;
            }
            // Отключаем projectileManager
            if ((gameScene as any).projectileManager && typeof (gameScene as any).projectileManager.destroy === 'function') {
                (gameScene as any).projectileManager.destroy();
                (gameScene as any).projectileManager = null;
            }
            // Останавливаем движение врагов (замораживаем их update)
            if ((gameScene as any).enemyManager && typeof (gameScene as any).enemyManager.freezeAllEnemies === 'function') {
                (gameScene as any).enemyManager.freezeAllEnemies();
            }

        }

        // Play tower death sound if audioManager exists
        if (this.scene && 'audioManager' in this.scene) {
            (this.scene as any).audioManager?.playSound('towerDie');
        }

        // Safety check for scene existence before adding tweens
        if (!this.scene) {
            return;
        }

        // Добавляем розовый цвет при разрушении
        this.setTint(Tower.COLOR_RED);

        // Добавляем эффект тряски влево-вправо
        this.scene.tweens.add({
            targets: this,
            x: this.x + 8,
            duration: 15,
            yoyo: true,
            repeat: 20,
            ease: 'Stepped'
        });

        // Добавляем эффект постепенного исчезновения
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 700,
            ease: 'Power2',
            onComplete: () => {
                // Даем игроку немного времени осознать конец игры
                const phaserScene = this.scene as Phaser.Scene;
                if (phaserScene && phaserScene.time && phaserScene.scene) {
                    phaserScene.time.delayedCall(400, () => {
                        phaserScene.scene.stop('GameScene');
                        phaserScene.scene.start('MenuScene');
                        super.destroy();
                    });
                    return;
                }
                if (this.scene?.scene) {
                    // Используем правильный способ перехода между сценами
                    // с явной остановкой текущей сцены
                    this.scene.scene.stop('GameScene');
                    this.scene.scene.start('MenuScene');
                }
                super.destroy();
            }
        });
    }

    // Remove the regeneration timer and methods since we now handle it in update
    private stopRegeneration(): void {
        // Nothing to do here anymore since regeneration is handled in update
    }

    private startRegeneration(): void {
        // Nothing to do here anymore since regeneration is handled in update
    }

    destroy(fromScene?: boolean): void {
        // Check if scene still exists before trying to access it
        if (this.scene && this.scene.events) {
            this.scene.events.off('screenResize', this.handleScreenResize, this);
            this.scene.events.off('tower-force-attack-circle', () => {
                this.safeUpdateAttackCircle();
            }, this);
            this.scene.events.off('update', this.onUpdate, this);
        }

        // Destroy the attack range circle
        if (this.attackRangeCircle) {
            this.attackRangeCircle.destroy();
        }

        super.destroy(fromScene);
    }

    // Helper method to get current position
    public getPosition(): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(this.x, this.y);
    }

    public setAttackRangeVisible(visible: boolean): void {
        if (this.attackRangeCircle) {
            this.attackRangeCircle.setVisible(visible);
        }
    }
}

export default Tower;
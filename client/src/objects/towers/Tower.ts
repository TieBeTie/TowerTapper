import Phaser from 'phaser';
import { SkillType } from '../../types/SkillType';
import { SkillSetStorage } from '../../storage/SkillSetStorage';
import { ScreenManager } from '../../managers/ScreenManager';

class Tower extends Phaser.Physics.Arcade.Sprite {
    // Цветовые константы
    private static readonly COLOR_RED = 0xff6b6b;  // Более розовый оттенок
    private static readonly COLOR_GREEN = 0x00ff00;
    private static readonly COLOR_WHITE = 0xffffff;
    private static readonly COLOR_CIRCLE = 0xffffff; // Голубой цвет для круга
    
    // Константа масштаба башни
    private static readonly TOWER_SCALE = 0.4;
    // Константа для базового радиуса атаки (в % от высоты экрана)
    private static readonly BASE_ATTACK_RANGE_PERCENT = 0.25;

    health: number;
    maxHealth: number;
    defense: number;
    regeneration: number;
    private regenerationTimer: Phaser.Time.TimerEvent | null;
    private isDying: boolean = false;
    private skillStorage: SkillSetStorage;
    private screenManager: ScreenManager;
    private attackRangeCircle: Phaser.GameObjects.Graphics;
    private attackRange: number;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Инициализируем ScreenManager
        this.screenManager = new ScreenManager(scene);

        this.skillStorage = SkillSetStorage.getInstance();
        const skills = this.skillStorage.load();

        // Initialize values from storage or use defaults if not found
        this.health = skills.get(SkillType.MAX_HEALTH)?.value || 500;
        this.maxHealth = this.health;
        this.defense = skills.get(SkillType.DEFENSE)?.value || 0;
        this.regeneration = skills.get(SkillType.HEALTH_REGEN)?.value || 0;
        this.regenerationTimer = null;
        this.isDying = false;

        // Инициализируем радиус атаки
        const attackRangeSkill = skills.get(SkillType.ATTACK_RANGE)?.value || 1;
        const { height } = this.screenManager.getScreenSize();
        this.attackRange = height * Tower.BASE_ATTACK_RANGE_PERCENT * attackRangeSkill;

        // Создаем графический объект для отображения радиуса атаки с нужной глубиной
        this.attackRangeCircle = this.scene.add.graphics();
        this.attackRangeCircle.setDepth(-10); // Set a very low depth to ensure it's below everything
        this.updateAttackRangeVisual();

        this.setImmovable(true);
        this.setCollideWorldBounds(true);
        
        // Установка точного положения башни по центру игровой области
        const center = this.screenManager.getGameViewCenter();
        this.setPosition(center.x, center.y);
        
        // Масштаб с учетом коэффициента из ScreenManager
        const gameScale = this.screenManager.getGameScale();
        this.setScale(Tower.TOWER_SCALE * gameScale);

        if (this.body) {
            this.body.setSize(this.width * 0.6, this.height * 0.6);
            this.body.setOffset(this.width * 0.2, this.height * 0.2);
        }

        if (this.regeneration > 0) {
            this.startRegeneration();
        }
        
        // Set tower to a high depth to ensure it's above the attack circle
        this.setDepth(10);
        this.scene.events.on('screenResize', this.handleScreenResize, this);
        
        // Use the new specific event name to avoid recursion
        this.scene.events.on('tower-force-attack-circle', this.safeUpdateAttackCircle, this);
    }
    
    private handleScreenResize(gameScale: number): void {
        this.setScale(Tower.TOWER_SCALE * gameScale);
        const center = this.screenManager.getGameViewCenter();
        this.setPosition(center.x, center.y);
        
        // Обновляем радиус атаки при изменении размера экрана
        const { height } = this.screenManager.getScreenSize();
        const skills = this.skillStorage.load();
        const attackRangeSkill = skills.get(SkillType.ATTACK_RANGE)?.value || 1;
        this.attackRange = height * Tower.BASE_ATTACK_RANGE_PERCENT * attackRangeSkill;
        
        // Use the safer method that doesn't recreate the graphics object
        this.safeUpdateAttackCircle();
    }

    upgrade(): void {
        const skills = this.skillStorage.load();
        this.maxHealth = skills.get(SkillType.MAX_HEALTH)?.value || this.maxHealth;
        this.defense = skills.get(SkillType.DEFENSE)?.value || this.defense;
        this.regeneration = skills.get(SkillType.HEALTH_REGEN)?.value || this.regeneration;
        
        // Обновляем радиус атаки при улучшении
        const attackRangeSkill = skills.get(SkillType.ATTACK_RANGE)?.value || 1;
        const { height } = this.screenManager.getScreenSize();
        this.attackRange = height * Tower.BASE_ATTACK_RANGE_PERCENT * attackRangeSkill;
        this.updateAttackRangeVisual();
        
        this.health = this.maxHealth;

        if (this.regeneration > 0) {
            this.startRegeneration();
        }
    }

    // Add a safe method that doesn't destroy and recreate the circle
    private safeUpdateAttackCircle(): void {
        // Only update if active and has a scene
        if (!this.active || !this.scene) return;
        
        // Make sure the circle exists
        if (!this.attackRangeCircle || !this.attackRangeCircle.scene) {
            this.attackRangeCircle = this.scene.add.graphics();
            this.attackRangeCircle.setDepth(-10);
        } else {
            // Just clear the existing one instead of destroying and recreating
            this.attackRangeCircle.clear();
        }
        
        // Draw with more visible style 
        this.attackRangeCircle.lineStyle(3, Tower.COLOR_CIRCLE, 0.7);
        this.attackRangeCircle.fillStyle(Tower.COLOR_CIRCLE, 0.2);
        
        const center = this.getPosition();
        this.attackRangeCircle.fillCircle(center.x, center.y, this.attackRange);
        this.attackRangeCircle.strokeCircle(center.x, center.y, this.attackRange);
        this.attackRangeCircle.setVisible(true);
    }

    // Обновляем визуальное отображение радиуса атаки - safer version that doesn't recreate
    public updateAttackRangeVisual(): void {
        // First, ensure the graphics object exists
        if (!this.attackRangeCircle || !this.attackRangeCircle.scene) {
            this.attackRangeCircle = this.scene.add.graphics();
            this.attackRangeCircle.setDepth(-10);
        } else {
            // Just clear it rather than destroying and recreating
            this.attackRangeCircle.clear();
        }
        
        // Draw with more visible style
        this.attackRangeCircle.lineStyle(3, Tower.COLOR_CIRCLE, 0.7); 
        this.attackRangeCircle.fillStyle(Tower.COLOR_CIRCLE, 0.2);
        
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
        return this.attackRange;
    }

    // Method required by UpgradeManager
    updateHealthBar(): void {
        // Safety check for scene existence
        if (!this.scene) return;
        
        // This method is called after upgrades are applied
        // It might have been intended to update a health bar UI element
        // For now we just make sure it exists to prevent the error
        // If there's a health bar UI in the game scene, we would update it here
        
        // If a GameScene health bar needs to be updated
        if ('updateHealthBar' in this.scene) {
            (this.scene as any).updateHealthBar(this.health, this.maxHealth);
        }
    }

    takeDamage(amount: number): void {
        if (!this.active || this.isDying) return;

        const reducedAmount = amount * (1 - (this.defense / 100));
        this.health = Math.max(0, this.health - reducedAmount);

        // Safety check for scene existence before accessing it
        if (!this.scene) return;

        // Play tower damage sound
        if ('audioManager' in this.scene) {
            (this.scene as any).audioManager?.playSound('towerDamage');
        }

        // Добавляем эффект тряски при получении урона
        this.scene.tweens.add({
            targets: this,
            x: this.x + 4,
            duration: 15,
            yoyo: true,
            repeat: 2,
            ease: 'Stepped'
        });

        // Добавляем эффект красного свечения
        this.setTint(Tower.COLOR_RED);
        this.scene.time.delayedCall(100, () => {
            if (!this.isDying && this.scene) {
                this.clearTint();
            }
        });

        if (this.health <= 0) {
            this.die();
        }
        
        // Update health bar if needed
        this.updateHealthBar();
    }

    private die(): void {
        this.isDying = true;
        this.stopRegeneration();

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
                if (this.scene?.scene) {
                    this.scene.scene.start('MenuScene');
                }
                super.destroy();
            }
        });
    }

    private startRegeneration(): void {
        if (this.regeneration > 0 && !this.regenerationTimer) {
            this.regenerationTimer = this.scene.time.addEvent({
                delay: 1000,
                callback: this.regenerateHealth,
                callbackScope: this,
                loop: true
            });
        }
    }

    private stopRegeneration(): void {
        if (this.regenerationTimer) {
            // Only destroy the timer if it's valid
            if (this.regenerationTimer.destroy) {
                try {
                    this.regenerationTimer.destroy();
                } catch (e) {
                    // Ignore errors if the timer can't be destroyed
                    console.warn('Failed to destroy regeneration timer:', e);
                }
            }
            this.regenerationTimer = null;
        }
    }

    private regenerateHealth = (): void => {
        if (this.health < this.maxHealth) {
            this.health = Math.min(this.health + this.regeneration, this.maxHealth);
        }
    }

    destroy(fromScene?: boolean): void {
        // Check if scene still exists before trying to access it
        if (this.scene && this.scene.events) {
            this.scene.events.off('screenResize', this.handleScreenResize, this);
            this.scene.events.off('tower-force-attack-circle', this.safeUpdateAttackCircle, this);
        }
        this.stopRegeneration();
        
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
}

export default Tower;
import Phaser from 'phaser';
import GameScene from '../scenes/GameScene';
import { SkillType } from '../types/SkillType';
import { SkillStateManager } from './SkillStateManager';

interface WaveConfig {
    number: number;
    enemyHealthMultiplier: number;
    enemyCount: number;
    spawnInterval: number;
    enemySpeedMultiplier: number;
}

export class WaveManager extends Phaser.Events.EventEmitter {
    private currentWave: number = 0;
    private currentWaveConfig: WaveConfig | null = null;
    private isWaveActive: boolean = false;
    private enemiesRemaining: number = 0;
    private baseEnemyHealth: number = 1; // Базовое здоровье врага равно 1
    private baseEnemyDamage: number = 3; // Базовый урон врага
    private baseEnemySpeed: number = 50; // Базовая скорость врага (уже уменьшена в 2 раза от стандартной 200)
    private autoStartNextWave: boolean = true; // Автоматически запускать следующую волну
    private waveDelay: number = 3000; // 3 seconds between waves
    private enemies: Phaser.GameObjects.Group;
    private scene: GameScene;
    private isWaveInProgress: boolean = false;
    private skillStateManager: SkillStateManager;
    private maxWaveCompleted: number = 0;

    constructor(scene: GameScene) {
        super();
        this.scene = scene;
        this.enemies = scene.add.group();
        this.skillStateManager = SkillStateManager.getInstance();
        this.setupEventListeners();
    }

    private generateWaveConfig(waveNumber: number): WaveConfig {
        // Рассчитываем множитель скорости: начинаем с 1 и увеличиваем на 3% с каждой волной
        const speedMultiplier = 1 + (waveNumber - 1) * 0.03;
        
        return {
            number: waveNumber,
            enemyHealthMultiplier: waveNumber, // Увеличиваем здоровье на 1 с каждой волной
            enemyCount: 18 + waveNumber * 2, // Начинаем с 20 врагов и увеличиваем на 2 с каждой волной
            spawnInterval: 1000, // Интервал спавна в мс
            enemySpeedMultiplier: speedMultiplier // Увеличиваем скорость на 3% с каждой волной
        };
    }

    public startNextWave(): void {
        if (this.isWaveActive) {
            console.log("Cannot start a new wave while current wave is active");
            return; // Нельзя начать новую волну, пока активна текущая
        }
        
        this.currentWave++;
        
        // Apply wave bonus at the beginning of each wave
        this.applyWaveBonus();
        
        // Apply emblem bonus at the beginning of each wave
        this.applyEmblemBonus();
        
        // Генерируем конфигурацию текущей волны
        this.currentWaveConfig = this.generateWaveConfig(this.currentWave);
        
        // Убеждаемся, что всегда есть хотя бы один враг в волне
        if (this.currentWaveConfig.enemyCount <= 0) {
            console.warn("Wave config has no enemies, setting to minimum of 1");
            this.currentWaveConfig.enemyCount = 1;
        }
        
        // Устанавливаем количество врагов и активируем волну
        this.enemiesRemaining = this.currentWaveConfig.enemyCount;
        this.isWaveActive = true;
        
        console.log(`Starting wave ${this.currentWave} with ${this.enemiesRemaining} enemies`);
        
        // Уведомляем подписчиков о начале новой волны
        this.emit('waveStart', this.currentWaveConfig);
    }

    public enemyDefeated(): void {
        // Проверяем, что у нас есть активная волна и остались враги
        if (!this.isWaveActive) {
            console.warn("Enemy defeated called but no active wave");
            return;
        }
        
        if (this.enemiesRemaining <= 0) {
            console.warn("Enemy defeated called but no enemies remaining");
            return;
        }
        
        // Уменьшаем счетчик оставшихся врагов
        this.enemiesRemaining--;
        
        // Логируем количество оставшихся врагов для отладки
        console.log(`Enemies remaining: ${this.enemiesRemaining}`);
        
        // Если это был последний враг, завершаем волну
        if (this.enemiesRemaining <= 0) {
            this.completeWave();
        }
    }

    // Метод для завершения текущей волны
    private completeWave(): void {
        if (!this.isWaveActive) {
            return; // Волна уже завершена
        }
        
        this.isWaveActive = false;
        console.log(`Wave ${this.currentWave} completed!`);
        this.emit('waveComplete', this.currentWave);
        
        // Если автозапуск включен, запускаем следующую волну после задержки
        if (this.autoStartNextWave) {
            console.log(`Next wave will start in ${this.waveDelay}ms`);
            setTimeout(() => {
                this.startNextWave();
            }, this.waveDelay);
        }

        // Play wave completion sound
        const gameScene = this.scene as GameScene;
        if (gameScene.audioManager) {
            gameScene.audioManager.playSound('waveCompleted');
        }

        // === Логика обновления max_wave_completed ===
        // Получаем WebSocket из сцены
        if (gameScene.socket && gameScene.socket.readyState === WebSocket.OPEN) {
            if (this.currentWave > this.maxWaveCompleted) {
                this.maxWaveCompleted = this.currentWave;
                gameScene.socket.send(JSON.stringify({
                    type: 'update_max_wave',
                    payload: this.currentWave
                }));
            }
        }
    }

    public getCurrentWaveConfig(): WaveConfig {
        if (!this.currentWaveConfig) {
            // Generate config for current wave if it doesn't exist
            this.currentWaveConfig = this.generateWaveConfig(Math.max(1, this.currentWave));
        }
        return this.currentWaveConfig;
    }

    public getEnemyHealth(): number {
        const waveConfig = this.getCurrentWaveConfig();
        return this.baseEnemyHealth * waveConfig.enemyHealthMultiplier;
    }

    public getEnemyDamage(): number {
        // Calculate damage based on wave tier
        // Waves 1-9: 3 damage
        // Waves 10-19: 6 damage
        // Waves 20-29: 9 damage, etc.
        const waveTier = Math.floor(this.currentWave / 10);
        return this.baseEnemyDamage * (waveTier + 1);
    }

    public getCurrentWave(): number {
        return this.currentWave;
    }

    public isCurrentWaveActive(): boolean {
        return this.isWaveActive;
    }

    public getRemainingEnemies(): number {
        return this.enemiesRemaining;
    }

    // Установить режим автоматического запуска
    public setAutoStartNextWave(value: boolean): void {
        this.autoStartNextWave = value;
    }

    // Установить задержку между волнами
    public setWaveDelay(milliseconds: number): void {
        this.waveDelay = milliseconds;
    }

    private setupEventListeners(): void {
        // Implementation of setupEventListeners method
    }

    // Add a new method to apply wave bonus
    private applyWaveBonus(): void {
        const waveBonus = this.skillStateManager.getState(SkillType.WAVE_BONUS);
        
        if (waveBonus > 0) {
            // If wave bonus level is 1, give 2 gold; if level 2, give 3 gold; and so on
            const goldBonus = waveBonus + 1;
            
            // Add gold to the player's account
            const gameScene = this.scene as GameScene;
            if (gameScene.goldManager) {
                // Directly add gold without any animations
                const currentGold = gameScene.goldManager.getGoldCount();
                gameScene.goldManager.updateGoldDirectly(currentGold + goldBonus);
                
                // Log bonus for debugging
                console.log(`Applied wave bonus: +${goldBonus} gold at wave ${this.currentWave}`);
            }
        }
    }

    // Add a new method to apply emblem bonus
    private applyEmblemBonus(): void {
        const gameScene = this.scene as GameScene;
        
        if (gameScene.emblemManager) {
            const emblemBonus = gameScene.emblemManager.getEmblemBonus();
            
            if (emblemBonus > 0) {
                // Add emblems each wave based on the bonus level
                gameScene.emblemManager.addEmblems(emblemBonus);
                
                // Log bonus for debugging
                console.log(`Added ${emblemBonus} emblems at wave ${this.currentWave}`);
                
                // You can display a notification if needed
                if (gameScene.uiManager && gameScene.uiManager.showNotification) {
                    gameScene.uiManager.showNotification(`+${emblemBonus} Emblems!`, 0x9370DB); // Purple color
                }
            }
        }
    }

    public getEnemySpeed(): number {
        const waveConfig = this.getCurrentWaveConfig();
        return this.baseEnemySpeed * waveConfig.enemySpeedMultiplier;
    }
} 
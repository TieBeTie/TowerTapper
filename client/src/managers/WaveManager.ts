import { EventEmitter } from 'events';
import Phaser from 'phaser';
import GameScene from '../scenes/GameScene';

interface WaveConfig {
    number: number;
    enemyHealthMultiplier: number;
    enemyCount: number;
    spawnInterval: number;
}

export class WaveManager extends Phaser.Events.EventEmitter {
    private currentWave: number = 0;
    private waveConfigs: WaveConfig[] = [];
    private isWaveActive: boolean = false;
    private enemiesRemaining: number = 0;
    private baseEnemyHealth: number = 10; // Базовое здоровье врага
    private autoStartNextWave: boolean = true; // Автоматически запускать следующую волну
    private waveDelay: number = 3000; // 3 seconds between waves
    private enemies: Phaser.GameObjects.Group;
    private scene: GameScene;
    private isWaveInProgress: boolean = false;

    constructor(scene: GameScene) {
        super();
        this.scene = scene;
        this.enemies = scene.add.group();
        this.initializeWaveConfigs();
        this.setupEventListeners();
    }

    private initializeWaveConfigs(): void {
        // Конфигурация волн. Можно настроить под ваши требования
        for (let i = 1; i <= 10; i++) {
            this.waveConfigs.push({
                number: i,
                enemyHealthMultiplier: 1 + (i - 1) * 0.2, // Увеличиваем здоровье на 20% с каждой волной
                enemyCount: 5 + i * 2, // Увеличиваем количество врагов в волне
                spawnInterval: 500 // Интервал спавна в мс (постоянный)
            });
        }
    }

    public startNextWave(): void {
        if (this.isWaveActive) {
            console.log("Cannot start a new wave while current wave is active");
            return; // Нельзя начать новую волну, пока активна текущая
        }
        
        this.currentWave++;
        
        // Получаем конфигурацию текущей волны
        const waveConfig = this.getCurrentWaveConfig();
        
        // Убеждаемся, что всегда есть хотя бы один враг в волне
        if (waveConfig.enemyCount <= 0) {
            console.warn("Wave config has no enemies, setting to minimum of 1");
            waveConfig.enemyCount = 1;
        }
        
        // Устанавливаем количество врагов и активируем волну
        this.enemiesRemaining = waveConfig.enemyCount;
        this.isWaveActive = true;
        
        console.log(`Starting wave ${this.currentWave} with ${this.enemiesRemaining} enemies`);
        
        // Уведомляем подписчиков о начале новой волны
        this.emit('waveStart', waveConfig);
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
    }

    public getCurrentWaveConfig(): WaveConfig {
        if (this.currentWave <= 0 || this.currentWave > this.waveConfigs.length) {
            // Если запрашиваемая волна вне диапазона, возвращаем первую или последнюю
            const waveIndex = Math.max(0, Math.min(this.currentWave - 1, this.waveConfigs.length - 1));
            return this.waveConfigs[waveIndex];
        }
        return this.waveConfigs[this.currentWave - 1];
    }

    public getEnemyHealth(): number {
        const waveConfig = this.getCurrentWaveConfig();
        return this.baseEnemyHealth * waveConfig.enemyHealthMultiplier;
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
} 
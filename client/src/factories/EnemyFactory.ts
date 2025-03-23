import Phaser from 'phaser';
import Enemy from '../objects/enemies/Enemy';
import GoblinEnemy from '../objects/enemies/GoblinEnemy';
import OrcEnemy from '../objects/enemies/OrcEnemy';
import { WaveManager } from '../managers/WaveManager';

type EnemyType = 'orc' | 'goblin';

class EnemyFactory {
    static createEnemy(type: EnemyType, scene: Phaser.Scene, x: number, y: number, waveManager?: WaveManager): Enemy | null {
        let enemy: Enemy | null = null;
        
        // Базовая стоимость врагов
        const goblinCost = 100;
        const orcCost = 200;
        
        switch (type) {
            case 'goblin':
                enemy = new GoblinEnemy(scene, x, y, 'goblin', goblinCost);
                break;
            case 'orc':
                enemy = new OrcEnemy(scene, x, y, 'orc', orcCost);
                break;
            default:
                console.error(`Unknown enemy type: ${type}`);
                return null;
        }
        
        // Если есть менеджер волн, устанавливаем здоровье в зависимости от волны
        if (waveManager) {
            const health = waveManager.getEnemyHealth();
            enemy.setHealth(health);
        }
        
        return enemy;
    }
}

export default EnemyFactory;
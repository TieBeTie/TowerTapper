import Phaser from 'phaser';
import Enemy from '../objects/enemies/Enemy';
import GoblinEnemy from '../objects/enemies/GoblinEnemy';
import OrcEnemy from '../objects/enemies/OrcEnemy';
import BombOrbEnemy from '../objects/enemies/BombOrbEnemy';
import { WaveManager } from '../managers/WaveManager';

type EnemyType = 'orby' | 'strong_orby' | 'bomb_orb';

class EnemyFactory {
    static createEnemy(type: EnemyType, scene: Phaser.Scene, x: number, y: number, waveManager?: WaveManager): Enemy | null {
        let enemy: Enemy | null = null;

        // Базовая стоимость врагов
        const orbyCost = 1;
        const strongOrbyCost = 2;
        const bossCost = 30;

        switch (type) {
            case 'orby':
                enemy = new GoblinEnemy(scene, x, y, 'orby_move', orbyCost);
                break;
            case 'strong_orby':
                enemy = new OrcEnemy(scene, x, y, 'orby_move', strongOrbyCost);
                break;
            case 'bomb_orb':
                enemy = new BombOrbEnemy(scene, x, y, 'bomb_orb', bossCost);
                break;
            default:
                console.error(`Unknown enemy type: ${type}`);
                return null;
        }

        // Если есть менеджер волн, устанавливаем параметры в зависимости от волны
        if (waveManager && type !== 'bomb_orb') {
            // Устанавливаем параметры только обычным врагам
            const health = waveManager.getEnemyHealth();
            enemy.setHealth(health);

            const damage = waveManager.getEnemyDamage();
            enemy.setDamage(damage);

            const speed = waveManager.getEnemySpeed();
            enemy.setSpeed(speed);
        }

        return enemy;
    }
}

export default EnemyFactory;
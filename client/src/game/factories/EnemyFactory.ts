import Phaser from 'phaser';
import Enemy from '../objects/enemies/Enemy';
import Orby from '../objects/enemies/Orby';
import BombOrbEnemy from '../objects/enemies/BombOrbEnemy';
import { WaveManager } from '../managers/WaveManager';
import { ENEMY_ATTRIBUTES, EnemyType } from '../definitions/EnemyAttributes';

class EnemyFactory {
    static createEnemy(type: EnemyType, scene: Phaser.Scene, x: number, y: number, waveManager?: WaveManager): Enemy | null {
        const attrs = ENEMY_ATTRIBUTES[type];
        let enemy: Enemy | null = null;

        switch (type) {
            case 'orby':
                enemy = new Orby(scene, x, y, 'orby_move', attrs.cost);
                break;
            case 'bomb_orb':
                enemy = new BombOrbEnemy(scene, x, y, 'bomb_orb', attrs.cost);
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

            const speedMultiplier = waveManager.getSpeedMultiplier();
            enemy.setSpeed(attrs.baseSpeed * speedMultiplier);
        }

        return enemy;
    }
}

export default EnemyFactory;
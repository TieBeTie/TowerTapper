import Phaser from 'phaser';
import Enemy from '../objects/enemies/Enemy';
import GoblinEnemy from '../objects/enemies/GoblinEnemy';
import OrcEnemy from '../objects/enemies/OrcEnemy';

type EnemyType = 'orc' | 'goblin';

class EnemyFactory {
    static createEnemy(type: EnemyType, scene: Phaser.Scene, x: number, y: number): Enemy | null {
        switch (type) {
            case 'goblin':
                return new GoblinEnemy(scene, x, y, 'goblin', 100);
            case 'orc':
                return new OrcEnemy(scene, x, y, 'orc', 200);
            default:
                console.error(`Unknown enemy type: ${type}`);
                return null;
        }
    }
}

export default EnemyFactory;
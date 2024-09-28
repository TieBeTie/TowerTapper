import OrcEnemy from './OrcEnemy';
import GoblinEnemy from './GoblinEnemy';

class EnemyFactory {
    static createEnemy(type, scene, x, y) {
        switch (type) {
            case 'Orc':
                return new OrcEnemy(scene, x, y);
            case 'Goblin':
                return new GoblinEnemy(scene, x, y);
            default:
                throw new Error(`Unknown enemy type: ${type}`);
        }
    }
}

export default EnemyFactory;

import OrcEnemy from './OrcEnemy';
import GoblinEnemy from './GoblinEnemy';

class EnemyFactory {
    static createEnemy(type, scene, x, y) {
        switch (type) {
            case 'Orc':
                return new OrcEnemy(scene, x, y, 'orc');
            case 'Goblin':
                return new GoblinEnemy(scene, x, y, 'goblin');
            default:
                throw new Error(`Неизвестный тип врага: ${type}`);
        }
    }
}

export default EnemyFactory;
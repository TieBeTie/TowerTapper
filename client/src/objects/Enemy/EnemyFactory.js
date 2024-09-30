import Enemy from './Enemy';

class EnemyFactory {
    static createEnemy(type, scene, x, y) {
        switch (type) {
            case 'orc':
                return new Enemy(scene, x, y, 'orc');
            case 'goblin':
                return new Enemy(scene, x, y, 'goblin');
            // Добавьте другие типы врагов здесь, если необходимо
            default:
                console.error(`Неизвестный тип врага: ${type}`);
                return null;
        }
    }
}

export default EnemyFactory;
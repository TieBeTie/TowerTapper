import Enemy from '../objects/enemies/Enemy';

class EnemyFactory {
    static createEnemy(type, scene, x, y) {
        switch (type) {
            case 'orc':
                return new Enemy(scene, x, y, 'orc', 200); // Передаём cost = 200 для орков
            case 'goblin':
                return new Enemy(scene, x, y, 'goblin', 100); // Передаём cost = 100 для гоблинов
            // Добавьте другие типы врагов здесь, если необходимо
            default:
                console.error(`Неизвестный тип врага: ${type}`);
                return null;
        }
    }
}

export default EnemyFactory;
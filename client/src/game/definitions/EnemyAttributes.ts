// Унифицированный перечень типов врагов, используемый по всей игре
export type EnemyType = 'orby' | 'bomb_orb';

// Базовые характеристики (до применения множителей волны, навыков и т.-д.)
export interface EnemyAttributes {
    /** Пикселей в секунду без учёта множителей */
    baseSpeed: number;
    /** Стоимость/награда за убийство */
    cost: number;
    /** Базовое здоровье (может быть перезаписано WaveManager-ом) */
    baseHealth: number;
    /** Базовый урон по башне (может быть увеличен WaveManager-ом) */
    baseDamage: number;
}

// Единый источник истинны: все константы скорости и других параметров — здесь
export const ENEMY_ATTRIBUTES: Readonly<Record<EnemyType, EnemyAttributes>> = {
    orby: {
        baseSpeed: 35,      // прежнее значение baseEnemySpeed в WaveManager
        cost: 1,
        baseHealth: 1,
        baseDamage: 3,
    },
    bomb_orb: {
        baseSpeed: 20,      // как было зашито внутри BombOrbEnemy
        cost: 30,
        baseHealth: 60,
        baseDamage: 15,
    },
} as const; 
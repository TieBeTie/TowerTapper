<template>
  <div class="upgrade-panel">
    <!-- Прокручиваемая витрина улучшений (верхние 85%) -->
    <div class="skills-showcase">
      <UpgradeSkillShowcase 
        :skills="getButtonsForCategory(activeCategory)" 
        :goldCount="gameStore.stats.gold"
        @upgrade="onUpgrade"
      />
    </div>
    
    <!-- Фиксированные категории внизу (15%) -->
    <div class="category-tabs">
      <CategoryTab 
        :categories="CATEGORIES" 
        :activeCategory="activeCategory" 
        @change-category="setActiveCategory"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import CategoryTab from './CategoryTab.vue';
import UpgradeSkillShowcase from './UpgradeSkillShowcase.vue';
import { useGameStore } from '../../stores/game';
import { SkillType } from '../../game/types/SkillType';

// Используем игровой store
const gameStore = useGameStore();

// Категории улучшений (как в UIManager.ts)
const CATEGORIES = ["Attack Upgrades", "Defense Upgrades", "Utility Upgrades"];

// Активная категория (индекс)
const activeCategory = ref(0);

// Получаем данные кнопок
const upgradeButtons = computed(() => {
  // Attack Upgrades (категория 0)
  const attackButtons = [
    createSkillButton(SkillType.DAMAGE, "Damage", 0),
    createSkillButton(SkillType.ATTACK_SPEED, "Attack Speed", 0),
    createSkillButton(SkillType.ATTACK_RANGE, "Attack Range", 0),
    createSkillButton(SkillType.MULTISHOT, "Multishot", 0),
    createSkillButton(SkillType.CRIT_CHANCE, "Crit Chance", 0),
    createSkillButton(SkillType.CRIT_MULTIPLIER, "Crit Multiplier", 0)
  ];
  
  // Defense Upgrades (категория 1)
  const defenseButtons = [
    createSkillButton(SkillType.MAX_HEALTH, "Max Health", 1),
    createSkillButton(SkillType.HEALTH_REGEN, "Health Regen", 1),
    createSkillButton(SkillType.DEFENSE, "Defense", 1),
    createSkillButton(SkillType.KNOCKBACK, "Knockback", 1),
    createSkillButton(SkillType.LIFESTEAL_CHANCE, "Lifesteal Chance", 1),
    createSkillButton(SkillType.LIFESTEAL_AMOUNT, "Lifesteal Amount", 1)
  ];
  
  // Utility Upgrades (категория 2)
  const utilityButtons = [
    createSkillButton(SkillType.DAILY_GOLD, "Daily Gold", 2),
    createSkillButton(SkillType.COIN_REWARD, "Kill Gold", 2),
    createSkillButton(SkillType.EMBLEM_BONUS, "Emblem Bonus", 2),
    createSkillButton(SkillType.FREE_UPGRADE, "Free Upgrade", 2),
    createSkillButton(SkillType.SUPPLY_DROP, "Supply Drop", 2),
    createSkillButton(SkillType.GAME_SPEED, "Game Speed", 2)
  ];
  
  return [...attackButtons, ...defenseButtons, ...utilityButtons];
});

// Создаем кнопку навыка
function createSkillButton(skillType: SkillType, name: string, category: number) {
  // Получаем уровень и стоимость из store если есть, иначе используем значения по умолчанию
  // @ts-ignore - Игнорируем ошибку для метода getSkillInfo
  const skill = gameStore.getSkillInfo?.(skillType) || null;
  
  const baseCost = getBaseCost(skillType);
  const level = skill?.level || 1;
  
  return {
    id: SkillType[skillType],
    skillType,
    category,
    name,
    description: '', // Убрали описание
    cost: Math.floor(baseCost * Math.pow(1.5, level - 1)),
    level,
    maxLevel: 10
  };
}

// Базовая стоимость каждого типа навыка
function getBaseCost(skillType: SkillType): number {
  const costs = {
    [SkillType.DAMAGE]: 10,
    [SkillType.ATTACK_SPEED]: 15,
    [SkillType.ATTACK_RANGE]: 20,
    [SkillType.MULTISHOT]: 25,
    [SkillType.CRIT_CHANCE]: 20,
    [SkillType.CRIT_MULTIPLIER]: 30,
    
    [SkillType.MAX_HEALTH]: 10,
    [SkillType.HEALTH_REGEN]: 15,
    [SkillType.DEFENSE]: 20,
    [SkillType.KNOCKBACK]: 15,
    [SkillType.LIFESTEAL_CHANCE]: 25,
    [SkillType.LIFESTEAL_AMOUNT]: 25,
    
    [SkillType.DAILY_GOLD]: 30,
    [SkillType.COIN_REWARD]: 20,
    [SkillType.EMBLEM_BONUS]: 50,
    [SkillType.FREE_UPGRADE]: 100,
    [SkillType.SUPPLY_DROP]: 35,
    [SkillType.GAME_SPEED]: 75
  };
  
  return costs[skillType] || 10;
}

// Функция для смены активной категории
const setActiveCategory = (index: number) => {
  activeCategory.value = index;
};

// Функция для получения кнопок по категории
const getButtonsForCategory = (categoryIndex: number) => {
  return upgradeButtons.value.filter(button => button.category === categoryIndex);
};

// Функция для обработки улучшения
const onUpgrade = (buttonId: string) => {
  const button = upgradeButtons.value.find(b => b.id === buttonId);
  if (!button) return;
  
  // Проверяем, хватает ли золота
  if (gameStore.stats.gold >= button.cost) {
    // Обновляем золото и уровень навыка через store
    // @ts-ignore - Игнорируем ошибку для метода upgradeSkill
    if (typeof gameStore.upgradeSkill === 'function') {
      // @ts-ignore
      gameStore.upgradeSkill(button.skillType, button.cost);
    } else {
      // Запасной вариант если метод не реализован
      gameStore.updateGold(gameStore.stats.gold - button.cost);
    }
  }
};

// При монтировании выбираем первую категорию
onMounted(() => {
  setActiveCategory(0);
});
</script>

<style scoped>
.upgrade-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* Верхняя часть с кнопками улучшений (85% высоты) */
.skills-showcase {
  width: 100%;
  flex: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 40px; /* Оставляем место для вкладок снизу */
  overflow-y: auto;
  background-color: rgba(20, 20, 20, 0.6);
}

/* Нижняя часть с категориями (фиксированная высота) */
.category-tabs {
  width: 100%;
  height: 40px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
}
</style> 
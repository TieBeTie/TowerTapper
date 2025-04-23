<template>
  <div class="upgrade-panel">
    <UpgradeSkillShowcase 
      :skills="getButtonsForCategory(activeCategory)" 
      :goldCount="goldCount"
      @upgrade="onUpgrade"
    />
    <CategoryTab 
      :categories="categories" 
      :activeCategory="activeCategory" 
      @change-category="setActiveCategory"
    />
    

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect } from 'vue';
import CategoryTab from './CategoryTab.vue';
import UpgradeSkillShowcase from './UpgradeSkillShowcase.vue';
import { useGameStore } from '../../stores/game';

// Get the game store
const gameStore = useGameStore();

// Внутреннее состояние компонента
const categories = ref(["Attack Upgrades", "Defense Upgrades", "Utility Upgrades"]);
const goldCount = ref(0);

// Активная категория (индекс)
const activeCategory = ref(0);

// Имитация данных из UpgradeManager
const upgradeButtons = ref([
  // Attack Upgrades (категория 0)
  { id: 'damage', category: 0, name: 'Damage', description: 'Увеличивает урон', cost: 10, level: 1, maxLevel: 10 },
  { id: 'attack_speed', category: 0, name: 'Attack Speed', description: 'Увеличивает скорость атаки', cost: 15, level: 1, maxLevel: 10 },
  { id: 'attack_range', category: 0, name: 'Attack Range', description: 'Увеличивает дальность атаки', cost: 20, level: 1, maxLevel: 5 },
  
  // Defense Upgrades (категория 1)
  { id: 'max_health', category: 1, name: 'Max Health', description: 'Увеличивает максимальное здоровье', cost: 10, level: 1, maxLevel: 10 },
  { id: 'health_regen', category: 1, name: 'Health Regen', description: 'Восстанавливает здоровье', cost: 15, level: 1, maxLevel: 5 },
  { id: 'defense', category: 1, name: 'Defense', description: 'Снижает получаемый урон', cost: 20, level: 1, maxLevel: 5 },
  
  // Utility Upgrades (категория 2)
  { id: 'gold_bonus', category: 2, name: 'Gold Bonus', description: 'Увеличивает золото за убийства', cost: 20, level: 1, maxLevel: 5 },
  { id: 'emblem_bonus', category: 2, name: 'Emblem Bonus', description: 'Увеличивает шанс выпадения эмблем', cost: 30, level: 1, maxLevel: 3 },
  { id: 'game_speed', category: 2, name: 'Game Speed', description: 'Ускоряет игровой процесс', cost: 50, level: 1, maxLevel: 3 },
]);

// Use a watcher to update the gold count from the store
watchEffect(() => {
  goldCount.value = gameStore.stats.gold;
});

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
  if (button && goldCount.value >= button.cost) {
    // Обновляем золото через Pinia вместо eventBus
    gameStore.updateGold(goldCount.value - button.cost);
    
    // Обновляем уровень локально для демонстрации
    button.level += 1;
    button.cost = Math.floor(button.cost * 1.5); // Увеличиваем стоимость
  }
};
</script>

<style scoped>
/* Панель улучшений */
.upgrade-panel {
  width: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  pointer-events: auto; /* Разрешаем взаимодействие с панелью */
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 768px) {
  .upgrade-panel {
    padding: 5px;
  }
}
</style> 
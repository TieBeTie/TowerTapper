<template>
  <div v-if="gameStore.gameUIVisible" class="game-ui">
    <!-- Верхняя панель с информацией о ресурсах (15% высоты) -->
    <div class="stats-view">
      <StatsView />
    </div>
    
    <!-- Основная панель с улучшениями (85% высоты) -->
    <div v-if="gameStore.upgradesPanelVisible" class="upgrade-showcase">
      <UpgradePanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useGameStore } from '../../stores/game';
import StatsView from './StatsView.vue';
import UpgradePanel from './UpgradePanel.vue';

console.log('[GameGeneralUIPanel] Component script executed');

// Use the game store
const gameStore = useGameStore();

// На монтировании показываем UI
onMounted(() => {
  console.log('[GameGeneralUIPanel] Component mounted');
  
  // При монтировании сразу показываем UI
  gameStore.showGameUI();
  
  // Также показываем панель улучшений
  gameStore.showUpgradesPanel();
  
  // Добавляем инициализацию начальных данных для тестирования
  if (gameStore.stats.gold === 0) {
    gameStore.updateGold(100);
  }
});
</script>

<style scoped>
/* Основной контейнер для UI */
.game-ui {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100vw;
  height: calc(33vh); /* 33% экрана по вертикали */
  z-index: 1000;
  pointer-events: none; /* UI не блокирует нажатия на игру */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: rgba(20, 20, 20, 0.8);
  box-shadow: 0 -2px 10px 0 rgba(0, 0, 0, 0.5);
  border-top: 1px solid #666;
  overflow: hidden;
}

/* Панель StatsView - 15% высоты UI */
.stats-view {
  flex: 0 0 15%;
  width: 100%;
  overflow: hidden;
  pointer-events: auto; /* Разрешаем взаимодействие со статистикой */
}

/* Панель улучшений - 85% высоты UI (включая категории) */
.upgrade-showcase {
  flex: 0 0 85%;
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  pointer-events: auto; /* Разрешаем взаимодействие с панелью улучшений */
}
</style> 
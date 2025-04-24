<template>
  <div v-if="gameStore.isTowerAlive" class="game-ui">
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
import { onMounted, watch } from 'vue';
import { useGameStore } from '../../stores/game';
import StatsView from './StatsView.vue';
import UpgradePanel from './UpgradePanel.vue';

console.log('[GameGeneralUIPanel] Component script executed');

// Use the game store
const gameStore = useGameStore();

// На монтировании показываем UI
onMounted(() => {
  console.log('[GameGeneralUIPanel] Component mounted');
  
  // При монтировании показываем панель улучшений
  gameStore.showUpgradesPanel();
  
  // Добавляем инициализацию начальных данных для тестирования
  if (gameStore.stats.gold === 0) {
    gameStore.updateGold(100);
  }
});

// Следим за изменением состояния башни
watch(() => gameStore.isTowerAlive, (isAlive) => {
  console.log(`[GameGeneralUIPanel] Tower state changed: ${isAlive ? 'alive' : 'dead'}`);
  
  // Автоматически показываем или скрываем UI в зависимости от состояния башни
  if (isAlive) {
    gameStore.showGameUI();
  } else {
    gameStore.hideGameUI();
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
  background: transparent;
  box-shadow: none;
  border-top: none;
  overflow: hidden;
}

/* Панель StatsView - 12% высоты UI */
.stats-view {
  flex: 0 0 10%;
  width: 100%;
  overflow: hidden;
  pointer-events: auto; /* Разрешаем взаимодействие со статистикой */
}

/* Панель улучшений - 90% высоты UI (включая категории) */
.upgrade-showcase {
  flex: 0 0 90%;
  width: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  pointer-events: auto; /* Разрешаем взаимодействие с панелью улучшений */
}
</style> 
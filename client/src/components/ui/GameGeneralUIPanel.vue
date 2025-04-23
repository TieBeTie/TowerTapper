<template>
  <div v-if="gameStore.gameUIVisible" class="game-ui">
    <!-- Верхняя панель с информацией о ресурсах (15% высоты) -->
    <StatsView />
    
    <!-- Средняя панель с витриной апгрейдов (70% высоты) -->
    <div class="upgrade-showcase" v-if="gameStore.upgradesPanelVisible">
      <UpgradePanel />
    </div>
    
    <!-- Нижняя панель с категориями (15% высоты) -->
    <div class="category-switcher" v-if="gameStore.upgradesPanelVisible">
      <!-- Здесь будут кнопки категорий -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useGameStore } from '../../stores/game';
import StatsView from './StatsView.vue';
import UpgradePanel from './UpgradePanel.vue';
import { ScreenManager } from '../../game/managers/ScreenManager';

console.log('[GameGeneralUIPanel] Component script executed');

// Use the game store
const gameStore = useGameStore();

// Получаем пропорции UI из ScreenManager
const uiHeightRatio = ScreenManager.getUIViewHeightRatio();

// На монтировании показываем UI
onMounted(() => {
  console.log('[GameGeneralUIPanel] Component mounted');
  
  // При монтировании сразу показываем UI
  gameStore.showGameUI();
});
</script>

<style scoped>
/* Основной контейнер для UI */
.game-ui {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100vw;
  height: calc(33vh); /* 33% экрана по вертикали - из ScreenManager.UI_VIEW_HEIGHT_RATIO */
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
:deep(.stats-view) {
  flex: 0 0 15%;
  width: 100%;
  overflow: hidden;
}

/* Панель улучшений - 70% высоты UI */
.upgrade-showcase {
  flex: 0 0 70%;
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto; /* Разрешаем взаимодействие с панелью улучшений */
}

/* Панель категорий - 15% высоты UI */
.category-switcher {
  flex: 0 0 15%;
  width: 100%;
  background: rgba(30, 30, 30, 0.8);
  border-top: 1px solid #444;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  pointer-events: auto; /* Разрешаем взаимодействие с кнопками */
}
</style> 
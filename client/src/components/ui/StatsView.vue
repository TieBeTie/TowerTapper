<template>
  <div class="stats-view">
    <!-- Semi-transparent background (как background в StatsView.ts) -->
    <div class="stats-background"></div>
    
    <!-- Content container (как contentContainer в StatsView.ts) -->
    <div class="content-container">
      <!-- HP container (левая сторона) -->
      <div class="hp-container">
        <div class="progress-bar">
          <div class="progress-bar-fill" :style="{ width: `${calculateHealthPercentage()}%` }"></div>
        </div>
        <div class="hp-text">{{ Math.floor(healthState.current) }}/{{ healthState.max }}</div>
      </div>
      
      <!-- Currency container (правая сторона) -->
      <div class="currency-container">
        <div class="currency-item gold">
          <img class="currency-img gold-img" src="/assets/images/towers/Gold.png" alt="Gold" />
          <div class="currency-text gold-text">{{ goldCount }}</div>
        </div>
        <div class="currency-item emblem">
          <img class="currency-img emblem-img" src="/assets/images/currency/heraldic_emblem16x16.png" alt="Emblem" />
          <div class="currency-text emblem-text">{{ emblemCount }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watchEffect } from 'vue';
import { useGameStore } from '../../stores/game';

// Constants matching StatsView.ts
const HP_COLOR = '#009900'; // equivalent to 0x009900
const HP_BACKGROUND_COLOR = '#005500'; // equivalent to 0x005500

// Get the game store
const gameStore = useGameStore();

// Reactive state
const goldCount = ref(0);
const emblemCount = ref(0);
const healthState = reactive({
  current: 100,
  max: 100
});

// Use watchEffect to automatically track store changes
watchEffect(() => {
  // Update gold from store
  goldCount.value = gameStore.stats.gold;
  console.log(`[StatsView] Gold updated from store: ${goldCount.value}`);
  
  // Update emblems from store
  emblemCount.value = gameStore.stats.emblems;
  console.log(`[StatsView] Emblems updated from store: ${emblemCount.value}`);
  
  // Update health from store
  healthState.current = gameStore.stats.health;
  healthState.max = gameStore.stats.maxHealth;
  console.log(`[StatsView] Health updated from store: ${healthState.current}/${healthState.max}`);
});

// Calculate percentage for progress bar - like in StatsView.ts
function calculateHealthPercentage(): number {
  if (healthState.max <= 0) return 0;
  const percentage = (healthState.current / healthState.max) * 100;
  return Math.max(0, Math.min(100, percentage));
}

// Initialize the UI on mount
onMounted(() => {
  console.log('[StatsView] Component mounted, connected to Pinia store');
});
</script>

<style scoped>
/* Основные стили компонента - соответствуют константам из StatsView.ts */
.stats-view {
  position: relative;
  width: 100%;
  height: 10vh; /* Аналогичная высота как в StatsView.ts (10% экрана) */
  z-index: 1500; /* Такой же z-index как в StatsView.ts */
  overflow: hidden;
  pointer-events: auto; /* Make stats view interactive */
}

/* Полупрозрачный черный фон как в StatsView.ts */
.stats-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Идентично fillStyle(0x000000, 0.5) */
  z-index: -1;
}

/* Контейнер для содержимого */
.content-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 3%; /* Соответствует PADDING_RATIO = 0.08 в StatsView.ts */
}

/* HP Container (левая сторона) - позиционирование как в distributeElements() */
.hp-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  margin-left: 2%; 
  width: 24%; /* Соответствует HP_BAR_WIDTH_RATIO = 0.24 */
}

/* Прогресс-бар в точности как в StatsView.ts */
.progress-bar {
  width: 100%;
  height: 6%; /* Соответствует HP_BAR_HEIGHT_RATIO = 0.06 */
  min-height: 15px;
  background-color: v-bind(HP_BACKGROUND_COLOR);
  border: 1px solid rgba(0, 0, 0, 0.7); /* borderAlpha: 0.7 */
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}

/* Заполнение прогресс-бара точно как в StatsView.ts */
.progress-bar-fill {
  height: 100%;
  background-color: v-bind(HP_COLOR);
  transition: width 0.2s;
  border-radius: 999px;
}

/* Текст HP в точности как в StatsView.ts */
.hp-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ffffff;
  font-family: 'pixelFont', monospace;
  font-size: 11px;
  text-shadow: 1px 1px 2px #000000; /* Вместо stroke */
  text-align: center;
  z-index: 1600; /* Такой же depth как в StatsView.ts */
}

/* Currency Container (правая сторона) - позиционирование как в distributeElements() */
.currency-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3vw; /* Соответствует ELEMENTS_SPACING_RATIO = 0.1 */
  width: 50%;
  position: relative;
  left: -5%;
}

.currency-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  background: none !important;
  border: none;
  border-radius: 0;
  box-shadow: none;
  min-height: 0;
}

.currency-img, .gold-img, .emblem-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  background: none !important;
  border: none;
  border-radius: 0;
  box-shadow: none;
  display: block;
  padding: 0;
  margin: 0;
}

.gold-img {
  background: #ffd700;
}

.emblem-img {
  background: #7b68ee;
}

.currency-text {
  font-family: 'pixelFont', monospace;
  font-size: 15px;
  text-align: center;
  text-shadow: none;
  font-weight: bold;
  letter-spacing: 0.5px;
  padding-left: 0;
  padding-right: 0;
  line-height: 1;
  margin: 0;
  display: flex;
  align-items: center;
}

.gold-text {
  color: #ffd700;
}

.emblem-text {
  color: #7b68ee;
}

/* Медиа-запросы для адаптивного масштабирования (как в handleScreenResize) */
@media (max-width: 600px) {
  .currency-img {
    width: 18px;
    height: 18px;
  }
  .currency-text {
    font-size: 12px;
  }
}
</style> 
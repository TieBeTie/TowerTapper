<template>
  <div class="stats-view">
    <!-- Полупрозрачный фон -->
    <div class="stats-background"></div>
    
    <!-- Основной контейнер -->
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
          <img class="currency-img gold-img" src="/assets/images/towers/Gold.png" alt="Gold" 
               onerror="this.onerror=null; this.src='/assets/images/currency/gold_coin.png';" />
          <div class="currency-text gold-text">{{ goldCount }}</div>
        </div>
        <div class="currency-item emblem">
          <img class="currency-img emblem-img" src="/assets/images/currency/heraldic_emblem16x16.png" alt="Emblem" 
               onerror="this.onerror=null; this.src='/assets/images/emblems/emblem.png';" />
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
  
  // Update emblems from store
  emblemCount.value = gameStore.stats.emblems;
  
  // Update health from store
  healthState.current = gameStore.stats.health || 100;
  healthState.max = gameStore.stats.maxHealth || 100;
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
/* Основной контейнер */
.stats-view {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1500;
  overflow: hidden;
  pointer-events: auto;
}

/* Полупрозрачный фон */
.stats-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
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
  padding: 0 3%;
}

/* HP Container (левая сторона) */
.hp-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 24%;
  margin-left: 2%;
}

/* Прогресс-бар HP */
.progress-bar {
  width: 100%;
  height: 16px;
  min-height: 14px;
  background-color: v-bind(HP_BACKGROUND_COLOR);
  border: 1px solid rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

/* Заполнение прогресс-бара */
.progress-bar-fill {
  height: 100%;
  background-color: v-bind(HP_COLOR);
  transition: width 0.2s;
  border-radius: 3px;
}

/* Текст HP */
.hp-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ffffff;
  font-family: 'pixelFont', monospace;
  font-size: 11px;
  text-shadow: 1px 1px 2px #000000;
  text-align: center;
  z-index: 1600;
  pointer-events: none;
}

/* Currency Container (правая сторона) */
.currency-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  width: 50%;
  margin-right: 4%;
}

.currency-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
}

.currency-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  display: block;
}

.currency-text {
  font-family: 'pixelFont', monospace;
  font-size: 15px;
  text-align: center;
  font-weight: bold;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
}

.gold-text {
  color: #ffd700;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8);
}

.emblem-text {
  color: #7b68ee;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8);
}

/* Адаптивное масштабирование */
@media (max-width: 600px) {
  .currency-img {
    width: 20px;
    height: 20px;
  }
  .currency-text {
    font-size: 13px;
  }
  .hp-text {
    font-size: 10px;
  }
}
</style> 
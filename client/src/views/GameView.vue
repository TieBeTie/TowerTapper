<template>
  <div class="game-ui-container">
    <!-- Игровой UI -->
    <GameGeneralUIPanel />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import GameGeneralUIPanel from '../components/ui/GameGeneralUIPanel.vue';

console.log('[GameView] Component script executed');

onMounted(() => {
  console.log('[GameView] Component mounted');
}); 

onUnmounted(() => {
  console.log('[GameView] Component unmounted');
});
</script>

<style scoped>
.game-ui-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none; /* Позволяет кликать сквозь контейнер на игру */
  z-index: 10;
}
</style> 
<template>
  <div class="game-container">
    <iframe
      ref="gameFrame"
      :src="gameSrc"
      width="100%"
      height="100%"
      frameborder="0"
      @load="onGameLoad"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const gameSrc = '/game/index.html';
const gameFrame = ref<HTMLIFrameElement | null>(null);

function onGameLoad() {
  // Можно отправить стартовые данные в игру через postMessage
}

function onGameMessage(event: MessageEvent) {
  if (event.data.action === 'open_menu') {
    // показать Vue-меню
    // Например, emit или изменение состояния
    console.log('Открыть меню из игры!');
  }
  // Добавь другие обработчики событий по необходимости
}

onMounted(() => {
  window.addEventListener('message', onGameMessage);
});
onUnmounted(() => {
  window.removeEventListener('message', onGameMessage);
});
</script>

<style scoped>
.game-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
iframe {
  border: none;
  width: 100vw;
  height: 100vh;
}
</style> 
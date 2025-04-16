<template>
  <MenuOverlay v-if="showMenu" />
  <router-view />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import MenuOverlay from './MenuOverlay.vue';

const showMenu = ref(false);

function showMenuHandler() { showMenu.value = true; }
function hideMenuHandler() { showMenu.value = false; }

onMounted(() => {
  window.addEventListener('vue-show-menu', showMenuHandler);
  window.addEventListener('vue-hide-menu', hideMenuHandler);
});
onUnmounted(() => {
  window.removeEventListener('vue-show-menu', showMenuHandler);
  window.removeEventListener('vue-hide-menu', hideMenuHandler);
});
</script>

<style scoped>
/* Нет стилей */
</style> 
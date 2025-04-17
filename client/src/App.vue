<template>
  <MenuOverlay v-if="showMenu && !showRating" />
  <RatingView v-if="showRating" />
  <router-view />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import MenuOverlay from './MenuOverlay.vue';
import RatingView from './views/RatingView.vue';

const showMenu = ref(false);
const showRating = ref(false);

function showMenuHandler() { showMenu.value = true; }
function hideMenuHandler() { showMenu.value = false; }
function showRatingHandler() { showRating.value = true; }
function hideRatingHandler() { showRating.value = false; }

onMounted(() => {
  window.addEventListener('vue-show-menu', showMenuHandler);
  window.addEventListener('vue-hide-menu', hideMenuHandler);
  window.addEventListener('vue-show-rating', showRatingHandler);
  window.addEventListener('vue-hide-rating', hideRatingHandler);
});
onUnmounted(() => {
  window.removeEventListener('vue-show-menu', showMenuHandler);
  window.removeEventListener('vue-hide-menu', hideMenuHandler);
  window.removeEventListener('vue-show-rating', showRatingHandler);
  window.removeEventListener('vue-hide-rating', hideRatingHandler);
});
</script>

<style scoped>
/* Нет стилей */
</style> 
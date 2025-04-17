<template>
  <MenuOverlay v-if="showMenu && !showRating" />
  <RatingView v-if="showRating" />
  <router-view />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import MenuOverlay from './ui/MenuOverlay.vue';
import RatingView from './views/RatingView.vue';
import eventBus from './services/eventBus';

const showMenu = ref(false);
const showRating = ref(false);

function showMenuHandler() { showMenu.value = true; }
function hideMenuHandler() { showMenu.value = false; }
function showRatingHandler() { showRating.value = true; }
function hideRatingHandler() { showRating.value = false; }

onMounted(() => {
  eventBus.on('vue-show-menu', showMenuHandler);
  eventBus.on('vue-hide-menu', hideMenuHandler);
  eventBus.on('vue-show-rating', showRatingHandler);
  eventBus.on('vue-hide-rating', hideRatingHandler);
});
onUnmounted(() => {
  eventBus.off('vue-show-menu', showMenuHandler);
  eventBus.off('vue-hide-menu', hideMenuHandler);
  eventBus.off('vue-show-rating', showRatingHandler);
  eventBus.off('vue-hide-rating', hideRatingHandler);
});
</script>

<style scoped>
/* Нет стилей */
</style> 
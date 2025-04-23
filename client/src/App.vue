<template>
  <div class="app-container">
    <!-- Phaser container -->
    <div id="game-container"></div>
    
    <!-- Vue UI components -->
    <MenuView />
    <GameView v-if="scene.view === 'game'" />
    <RatingView v-if="scene.view === 'rating'" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useSceneStore } from './stores/scene';
import { usePhaser } from './composables/usePhaser';
import MenuView from './views/MenuView.vue';
import GameView from './views/GameView.vue';
import RatingView from './views/RatingView.vue';

// Use the scene store
const scene = useSceneStore();

// Initialize Phaser with our composable
usePhaser('game-container');
</script>

<style>
.app-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Allow clicking through to Phaser by default */
}

/* Enable pointer events for all interactive Vue components */
button, 
a, 
input, 
select, 
.interactive,
[class*="-container"],
[class*="menu-"],
[class*="button"],
[class*="btn"] {
  pointer-events: auto !important;
}

/* Add any additional global styles here */
</style> 
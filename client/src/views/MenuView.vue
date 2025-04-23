<template>
  <div class="menu-container" v-if="scene.view === 'menu'">
    <div class="menu-overlay">
      <button 
        v-for="item in menuItems" 
        :key="item.id"
        :class="['menu-btn', item.id]" 
        @click="navigate(item.route)"
      >
        {{ item.text }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSceneStore } from '../stores/scene';
import { playUiSound } from '../services/UIAudioService';

const scene = useSceneStore();

// Пункты меню
const menuItems = [
  { id: 'play', text: 'Play', route: 'game' },
  { id: 'upgrades', text: 'Initial Upgrades', route: 'upgrades' },
  { id: 'emblems', text: 'Replenish Emblems', route: 'emblems' },
  { id: 'rating', text: 'Rating', route: 'rating' }
];

// Helper function to call methods on MenuScene
function callMenuSceneMethod(methodName: string) {
  // Get the Phaser game instance from window
  const game = (window as any).PhaserGame;
  if (game && game.scene) {
    // Find the MenuScene instance
    const menuScene = game.scene.getScene('MenuScene');
    if (menuScene && typeof menuScene[methodName] === 'function') {
      // Call the method directly on the MenuScene
      menuScene[methodName]();
      return true;
    } else {
      console.error(`[MenuView] MenuScene or its ${methodName} method not found`);
    }
  } else {
    console.error('[MenuView] PhaserGame not found');
  }
  return false;
}

// Навигация при клике на пункт меню
function navigate(route: string) {
  playUiSound('button');
  
  // Handle different navigation routes
  if (route === 'game') {
    callMenuSceneMethod('startGame');
  } else if (route === 'rating') {
    // Rating is handled by Vue
    scene.setView('rating');
  } else if (route === 'upgrades') {
    callMenuSceneMethod('openInitialUpgradesShop');
  } else if (route === 'emblems') {
    callMenuSceneMethod('openEmblemsShop');
  } else {
    // Fallback for other routes
    scene.go(route as any);
  }
}
</script>

<style scoped>
.menu-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10;
  pointer-events: none; /* Allow clicking through to Phaser by default */
}

/* Стили для главного меню */
.menu-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 3vh;
  padding-bottom: 20vh;
  pointer-events: none;
  z-index: 1000;
}

.menu-btn {
  pointer-events: auto; /* Ensure buttons are clickable */
  background: none;
  border: none;
  font-size: 2.2rem;
  font-family: 'pixelFont', 'Arial', sans-serif;
  color: #ffcc00;
  font-weight: normal;
  letter-spacing: 1px;
  padding: 0;
  margin: 0;
  outline: none;
  box-shadow: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
  /* Phaser-like stroke for text, 1px */
  text-shadow:
    -1px -1px 0 #000,
     1px -1px 0 #000,
    -1px  1px 0 #000,
     1px  1px 0 #000,
     0px  1px 0 #000,
     1px  0px 0 #000,
     0px -1px 0 #000,
    -1px  0px 0 #000;
  transition: transform 0.1s;
  cursor: pointer;
}

.menu-btn:focus,
.menu-btn:active,
.menu-btn:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

.menu-btn.play {
  color: #fff;
}

.menu-btn:hover {
  transform: scale(1.07);
  filter: brightness(1.08);
}

.menu-btn:active {
  transform: none;
  filter: none;
}
</style> 
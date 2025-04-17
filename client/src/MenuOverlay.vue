<template>
  <div v-if="visible" class="menu-overlay">
    <button class="menu-btn play" @click="onPlay">Play</button>
    <button class="menu-btn upgrades" @click="onUpgrades">Initial Upgrades</button>
    <button class="menu-btn emblems" @click="onEmblems">Replenish Emblems</button>
    <button class="menu-btn rating" @click="onRating">Rating</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { playUiSound } from './services/UIAudioService';
import eventBus from './services/eventBus';

const visible = ref(true);

function showMenu() {
  visible.value = true;
}
function hideMenu() {
  visible.value = false;
}

onMounted(() => {
  eventBus.on('vue-show-menu', showMenu);
  eventBus.on('vue-hide-menu', hideMenu);
  showMenu();
});
onUnmounted(() => {
  eventBus.off('vue-show-menu', showMenu);
  eventBus.off('vue-hide-menu', hideMenu);
});

function onPlay() {
  playUiSound('button');
  eventBus.emit('vue-menu-play');
}
function onUpgrades() {
  playUiSound('button');
  eventBus.emit('vue-menu-upgrades');
}
function onEmblems() {
  playUiSound('button');
  eventBus.emit('vue-menu-emblems');
}
function onRating() {
  playUiSound('button');
  eventBus.emit('vue-show-rating');
}
</script>

<style scoped>
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
  pointer-events: auto;
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
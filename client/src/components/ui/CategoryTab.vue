<template>
  <div class="category-switcher">
    <div 
      v-for="(category, index) in categories" 
      :key="index" 
      class="tab-item" 
      :class="{ 'active': activeCategory === index }"
      @click="selectCategory(index)"
    >
      {{ category }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps<{
  categories: string[];
  activeCategory: number;
}>();

const emit = defineEmits<{
  (e: 'change-category', index: number): void;
}>();

function selectCategory(index: number) {
  emit('change-category', index);
}
</script>

<style scoped>
.category-switcher {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: rgba(30, 30, 30, 0.9);
  border-top: 1px solid #444;
}

.tab-item {
  flex: 1;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px;
  text-align: center;
  font-family: 'pixelFont', monospace;
  font-size: 14px;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
  user-select: none;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
  background-color: rgba(40, 40, 40, 0.9);
}

.tab-item:hover {
  background-color: rgba(60, 60, 60, 0.9);
}

.tab-item.active {
  background-color: rgba(70, 70, 70, 0.9);
  box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.1);
  border-bottom: 2px solid #ffcc00;
  color: #ffcc00;
}

.tab-item:not(:last-child) {
  border-right: 1px solid #444;
}
</style> 
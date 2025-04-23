<template>
  <div class="category-tabs">
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
.category-tabs {
  display: flex;
  justify-content: space-between;
  background-color: rgba(255, 0, 0, 0.5); /* яркий красный фон для отладки */
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  border: 3px solid yellow; /* яркая рамка для отладки */
  margin-bottom: 15px;
  min-height: 50px;
}

.tab-item {
  flex: 1;
  padding: 10px 5px;
  text-align: center;
  font-family: 'pixelFont', monospace;
  font-size: 14px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
  user-select: none;
  text-shadow: 1px 1px 2px black; /* для лучшей видимости */
}

.tab-item:hover {
  background-color: rgba(255, 165, 0, 0.8); /* яркий оранжевый для отладки */
  color: #fff;
}

.tab-item.active {
  background-color: rgba(0, 255, 0, 0.8); /* яркий зеленый для отладки */
  color: #000;
  border-bottom: 2px solid #ffff00;
  font-weight: bold;
}

/* Разделительные линии между вкладками */
.tab-item:not(:last-child) {
  border-right: 2px solid yellow;
}

@media (max-width: 768px) {
  .tab-item {
    font-size: 12px;
    padding: 8px 4px;
  }
}
</style> 
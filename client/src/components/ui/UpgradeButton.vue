<template>
  <div class="upgrade-button" :class="{ 'can-afford': canAfford, 'max-level': level >= maxLevel }">
    <div class="button-header">
      <div class="name">{{ name }}</div>
      <div class="level">Lvl {{ level }}/{{ maxLevel }}</div>
    </div>
    <div class="description">{{ description }}</div>
    <div class="button-footer">
      <div class="cost">
        <img class="gold-icon" src="/assets/images/towers/Gold.png" alt="Gold" />
        <span>{{ cost }}</span>
      </div>
      <button class="upgrade-btn" @click="onUpgrade" :disabled="!canAfford || level >= maxLevel">
        {{ level >= maxLevel ? 'MAX' : 'UPGRADE' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps<{
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  canAfford: boolean;
}>();

const emit = defineEmits<{
  (e: 'upgrade'): void;
}>();

function onUpgrade() {
  if (props.canAfford && props.level < props.maxLevel) {
    emit('upgrade');
  }
}
</script>

<style scoped>
.upgrade-button {
  background-color: rgba(30, 30, 30, 0.9);
  border: 1px solid #555;
  border-radius: 5px;
  padding: 10px;
  width: 160px;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.upgrade-button.can-afford {
  border-color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}

.upgrade-button.max-level {
  border-color: #b9b9b9;
  opacity: 0.8;
}

.button-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name {
  font-family: 'pixelFont', monospace;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}

.level {
  font-family: 'pixelFont', monospace;
  font-size: 12px;
  color: #aaa;
}

.description {
  font-family: 'pixelFont', monospace;
  font-size: 11px;
  color: #ddd;
  min-height: 30px;
}

.button-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cost {
  display: flex;
  align-items: center;
  gap: 4px;
}

.gold-icon {
  width: 16px;
  height: 16px;
}

.cost span {
  font-family: 'pixelFont', monospace;
  font-size: 12px;
  color: #ffd700;
}

.upgrade-btn {
  font-family: 'pixelFont', monospace;
  font-size: 12px;
  background-color: #3d6aaf;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 4px 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.upgrade-btn:hover:not(:disabled) {
  background-color: #4a7ecf;
}

.upgrade-btn:disabled {
  background-color: #555;
  color: #999;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .upgrade-button {
    width: 140px;
    padding: 8px;
  }
  
  .name, .cost span {
    font-size: 11px;
  }
  
  .description, .level {
    font-size: 10px;
  }
  
  .upgrade-btn {
    font-size: 10px;
    padding: 3px 6px;
  }
  
  .gold-icon {
    width: 14px;
    height: 14px;
  }
}
</style> 
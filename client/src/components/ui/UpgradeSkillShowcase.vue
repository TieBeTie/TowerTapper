<template>
  <div class="upgrade-showcase">
    <div class="skills-grid">
      <UpgradeButton 
        v-for="skill in skills" 
        :key="skill.id"
        :name="skill.name"
        :description="skill.description"
        :cost="skill.cost"
        :level="skill.level"
        :maxLevel="skill.maxLevel"
        :canAfford="goldCount >= skill.cost"
        @upgrade="onUpgrade(skill.id)"
      />
    </div>
    
    <div v-if="skills.length === 0" class="no-skills">
      <p>Нет доступных навыков в этой категории</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import UpgradeButton from './UpgradeButton.vue';

// Тип для навыка
interface Skill {
  id: string;
  category: number;
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
}

const props = defineProps<{
  skills: Skill[];
  goldCount: number;
}>();

const emit = defineEmits<{
  (e: 'upgrade', id: string): void;
}>();

function onUpgrade(id: string) {
  emit('upgrade', id);
}
</script>

<style scoped>
.upgrade-showcase {
  padding: 10px;
  background-color: rgba(30, 30, 30, 0.5);
  border-radius: 5px;
  min-height: 200px;
}

.skills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
}

.no-skills {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'pixelFont', monospace;
  font-size: 16px;
  color: #aaa;
  text-align: center;
}

@media (max-width: 768px) {
  .upgrade-showcase {
    padding: 5px;
    min-height: 150px;
  }
  
  .skills-grid {
    gap: 8px;
  }
  
  .no-skills {
    height: 150px;
    font-size: 14px;
  }
}
</style> 
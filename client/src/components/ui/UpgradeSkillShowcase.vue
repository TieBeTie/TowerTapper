<template>
  <div class="skills-panel">
    <div class="skills-container">
      <UpgradeButton 
        v-for="skill in skills" 
        :key="skill.id"
        :name="skill.name"
        :cost="skill.cost"
        :level="skill.level"
        :maxLevel="skill.maxLevel"
        :canAfford="canAffordUpgrade(skill.skillType)"
        :skillType="skill.skillType"
        @upgrade="onUpgrade(skill.id)"
        @purchase-success="handlePurchaseSuccess"
      />
    </div>
    
    <div v-if="skills.length === 0" class="no-skills">
      <p>No skills available in this category</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, onMounted } from 'vue';
import UpgradeButton from './UpgradeButton.vue';
import { SkillType, CurrencyType } from '../../game/types/SkillType';

// Тип для навыка
interface Skill {
  id: string;
  category: number;
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  skillType: SkillType;
}

// Объявление для TypeScript, что window.game существует
declare global {
  interface Window {
    game?: any;
  }
}

const props = defineProps<{
  skills: Skill[];
  goldCount: number;
}>();

const emit = defineEmits<{
  (e: 'upgrade', id: string): void;
  (e: 'refresh-skills'): void;
}>();

let upgradeManager: any = null;
let gameScene: any = null;

// Инициализация при монтировании
onMounted(() => {
  // Попытаться найти GameScene и UpgradeManager
  if (window.game?.scene?.scenes) {
    gameScene = window.game.scene.scenes.find((scene: any) => scene.key === 'GameScene');
    if (gameScene) {
      upgradeManager = gameScene.upgradeManager;
    }
  }
});

// Проверка, может ли игрок позволить себе улучшение
function canAffordUpgrade(skillType: SkillType): boolean {
  if (!upgradeManager) {
    // Если UpgradeManager не найден, используем обычную проверку на золото
    const skill = props.skills.find(s => s.skillType === skillType);
    return skill ? props.goldCount >= skill.cost : false;
  }
  
  // Иначе используем метод из UpgradeManager
  try {
    return upgradeManager.canAffordUpgrade(skillType, CurrencyType.GOLD);
  } catch (error) {
    console.error('Error checking if player can afford upgrade:', error);
    return false;
  }
}

// Оригинальный обработчик улучшения (для совместимости)
function onUpgrade(id: string) {
  emit('upgrade', id);
}

// Обработчик успешной покупки через UpgradeManager
function handlePurchaseSuccess(skillType: SkillType) {
  // Запросить обновление списка навыков
  emit('refresh-skills');
}
</script>

<style scoped>
.skills-panel {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px;
}

.skills-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, auto);
  justify-content: center;
  gap: 5px;
  padding: 0px;
  width: 100%;
  max-width: 320px;
  margin-bottom: 5px;
}

.no-skills {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'pixelFont', monospace;
  font-size: 16px;
  color: #aaa;
  text-align: center;
}
</style> 
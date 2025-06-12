<template>
  <div class="skills-panel">
    <div class="skills-container">
      <UpgradeButton 
        v-for="skill in filteredSkills" 
        :key="skill.type"
        :skill="skill"
      />
    </div>
    
    <div v-if="filteredSkills.length === 0" class="no-skills">
      <p>No skills available in this category</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, computed, onMounted, watch, onUnmounted } from 'vue';
import UpgradeButton from './UpgradeButton.vue';
import { SkillType, CurrencyType } from '../../game/types/SkillType';

// Объявление для TypeScript, что window.PhaserGame существует
declare global {
  interface Window {
    PhaserGame?: any;
  }
}

const props = defineProps<{
  categoryId: number;
}>();

// Карта категорий на типы навыков
const SKILL_CATEGORIES: Record<number, SkillType[]> = {
  0: [ // Attack Upgrades
    SkillType.DAMAGE,
    SkillType.ATTACK_SPEED,
    SkillType.ATTACK_RANGE,
    SkillType.MULTISHOT,
    SkillType.CRIT_CHANCE,
    SkillType.CRIT_MULTIPLIER
  ],
  1: [ // Defense Upgrades
    SkillType.MAX_HEALTH,
    SkillType.HEALTH_REGEN,
    SkillType.DEFENSE,
    SkillType.KNOCKBACK,
    SkillType.LIFESTEAL_CHANCE,
    SkillType.LIFESTEAL_AMOUNT
  ],
  2: [ // Utility Upgrades
    SkillType.WAVE_BONUS,
    SkillType.COIN_REWARD,
    SkillType.EMBLEM_BONUS,
    SkillType.FREE_UPGRADE,
    SkillType.SUPPLY_DROP,
    SkillType.GAME_SPEED
  ]
};

const allSkills = ref<any[]>([]);
const upgradeManager = ref<any>(null);
const gameScene = ref<any>(null);

// Получение доступных навыков из UpgradeManager
const loadAvailableSkills = () => {
  if (!gameScene.value || !upgradeManager.value) return;
  
  try {
    allSkills.value = upgradeManager.value.getAvailableSkills();
  } catch (error) {
    console.error('Error loading skills:', error);
  }
};

// Инициализация при монтировании
onMounted(() => {
  // Получаем доступ к экземпляру игры
  if (window.PhaserGame?.scene) {
    // Находим GameScene
    gameScene.value = window.PhaserGame.scene.getScene ? 
      window.PhaserGame.scene.getScene('GameScene') : 
      (window.PhaserGame.scene.scenes?.find((scene: any) => scene.key === 'GameScene'));
      
    if (gameScene.value) {
      // Получаем UpgradeManager из GameScene
      upgradeManager.value = gameScene.value.upgradeManager;
      
      if (upgradeManager.value) {
        // Загружаем доступные навыки
        loadAvailableSkills();
        
        // Добавляем слушатель события обновления золота
        gameScene.value.events.on('updateGold', loadAvailableSkills);
      }
    }
  }
});

// Фильтрация навыков по категории
const filteredSkills = computed(() => {
  if (!allSkills.value || allSkills.value.length === 0) return [];
  
  const categorySkillTypes = SKILL_CATEGORIES[props.categoryId] || [];
  return allSkills.value.filter(skill => categorySkillTypes.includes(skill.type));
});

// Очистка при размонтировании
onUnmounted(() => {
  if (gameScene.value) {
    gameScene.value.events.off('updateGold', loadAvailableSkills);
  }
});

// Следим за изменением категории
watch(() => props.categoryId, () => {
  console.log('Category changed to:', props.categoryId);
});
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
  background-color: transparent;
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
  background-color: transparent;
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
  background-color: transparent;
}
</style> 
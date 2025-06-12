<template>
  <button 
    class="upgrade-button" 
    :class="{ 'can-afford': canAfford, 'cannot-afford': !canAfford, 'max-level': skillLevel >= maxLevel }"
    @click="onUpgrade" 
    :disabled="skillLevel >= maxLevel"
    :title="skillLevel >= maxLevel ? 'Max level reached' : (!canAfford ? 'Not enough gold' : '')"
  >
    <div class="button-content">
      <div class="name-container">
        <div class="button-text">{{ skill.name }}</div>
      </div>
      <div class="info-container">
        <div class="level-text">{{ formatSkillValue(props.skill.type, skillValue || 0) }}</div>
        <div class="cost-container">
          <img class="currency-img gold-img" src="/assets/images/currency/gold/gold.png" alt="Gold" 
               onerror="this.onerror=null; this.src='/assets/images/currency/gold_coin.png';" />
          <div class="cost-text" :class="{ 'cost-unavailable': !canAfford }">{{ skillCost }}</div>
        </div>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { SkillType, CurrencyType } from '../../game/types/SkillType';

// Объявление для TypeScript, что window.PhaserGame существует
declare global {
  interface Window {
    PhaserGame?: any;
  }
}

const props = defineProps<{
  skill: any;
}>();

const emit = defineEmits<{
  (e: 'upgrade', skillType: SkillType): void;
  (e: 'purchase-success', skillType: SkillType): void;
}>();

const upgradeManager = ref<any>(null);
const gameScene = ref<any>(null);
const skillLevel = ref<number>(0);
const skillValue = ref<number>(0);
const skillCost = ref<number>(0);
const canAfford = ref<boolean>(false);
const maxLevel = computed(() => props.skill.maxLevel);

// Function to format skill value based on skill type
const formatSkillValue = (skillType: SkillType, value: number) => {
  // Check if skill type is related to chance/probability
  if (skillType === SkillType.CRIT_CHANCE || skillType === SkillType.LIFESTEAL_CHANCE || 
    skillType === SkillType.FREE_UPGRADE || skillType === SkillType.MULTISHOT || 
    skillType === SkillType.SUPPLY_DROP) {
    // Multiply by 100 and add % sign
    return `${(value).toFixed(1)}%`;
  }
  // For other skills, just return the value
  return value.toString();
};

// Получение данных из UpgradeManager
const loadSkillData = () => {
  if (!upgradeManager.value) return;
  
  try {
    // Получаем актуальный уровень навыка
    skillLevel.value = upgradeManager.value.getSkillLevel(props.skill.type);
    
    // Получаем актуальное значение навыка
    skillValue.value = upgradeManager.value.getSkillValue(props.skill.type);
    
    // Получаем актуальную стоимость навыка
    skillCost.value = upgradeManager.value.getSkillCost(props.skill.type, CurrencyType.GOLD);
    
    // Проверяем, можем ли позволить себе улучшение
    canAfford.value = upgradeManager.value.canAffordUpgrade(props.skill.type, CurrencyType.GOLD);
  } catch (error) {
    console.error('Error loading skill data:', error);
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
        // Загружаем данные навыка
        loadSkillData();
        
        // Добавляем слушатель события обновления золота
        gameScene.value.events.on('updateGold', loadSkillData);
      }
    }
  }
});

// Обработчик нажатия на кнопку улучшения
function onUpgrade() {
  try {
    // Если достигнут максимальный уровень, ничего не делаем
    if (skillLevel.value >= maxLevel.value) return;
    
    // Отправка события для совместимости
    emit('upgrade', props.skill.type);
    
    // Получаем доступ к экземпляру игры, который установлен в index.ts
    if (!gameScene.value || !upgradeManager.value) {
      console.warn('UpgradeButton: gameScene или upgradeManager не существует');
      return;
    }
    
    console.log(`UpgradeButton: Попытка покупки ${props.skill.type} за GOLD`);
    
    // Теперь явно указываем, что покупаем за золото
    const success = upgradeManager.value.purchaseUpgrade(props.skill.type, CurrencyType.GOLD);
    
    console.log(`UpgradeButton: Результат покупки: ${success ? 'успешно' : 'неудачно'}`);
    
    if (success) {
      // Воспроизвести звук покупки через audioManager
      const audioManager = gameScene.value.audioManager;
      if (audioManager && audioManager.playSound) {
        audioManager.playSound('upgradeButton');
      } else if (gameScene.value.sound && gameScene.value.sound.play) {
        gameScene.value.sound.play('upgrade');
      }
      
      // Обновить башню
      if (gameScene.value.tower && gameScene.value.tower.upgrade) {
        gameScene.value.tower.upgrade();
      }
      
      // Обновить данные навыка
      loadSkillData();
      
      // Сообщить об успешной покупке
      emit('purchase-success', props.skill.type);
    }
  } catch (error) {
    console.warn('Error in onUpgrade:', error);
  }
}

// Следим за изменением типа навыка
watch(() => props.skill.type, () => {
  loadSkillData();
});

// Очистка при размонтировании
onUnmounted(() => {
  if (gameScene.value) {
    gameScene.value.events.off('updateGold', loadSkillData);
  }
});
</script>

<style scoped>
.upgrade-button {
  width: 160px;
  height: 45px;
  background-color: rgba(68, 68, 68, 0.6); /* Серый фон по умолчанию */
  border: 1px solid #666;
  border-radius: 6px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 2px;
  padding: 4px;
}

.button-content {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
}

.name-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60%;
  height: 100%;
  margin-right: 0px;
}

.info-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 3px;
  height: 100%;
  width: 45%;
  margin-left: 10px;
}

.upgrade-button.can-afford {
  background-color: rgba(69, 160, 73, 0.5);
  border-color: #45a049;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
}

.upgrade-button.cannot-afford {
  background-color: rgba(68, 68, 68, 0.6);
  border-color: #666;
  cursor: not-allowed;
}

.upgrade-button:hover {
  background-color: rgba(56, 120, 56, 0.8);
  transform: scale(1.03);
}

.upgrade-button.can-afford:hover {
  background-color: rgba(76, 175, 80, 0.7);
}

.upgrade-button.cannot-afford:hover {
  background-color: rgba(80, 80, 80, 0.7);
  transform: scale(1.01);
}

.button-text {
  font-family: 'pixelFont', monospace;
  font-size: 16px;
  color: white;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  white-space: normal;
  overflow: hidden;
  word-wrap: break-word;
  word-break: break-word;
  line-height: 1.1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.level-text {
  font-family: 'pixelFont', monospace;
  font-size: 16px;
  color: #ccc;
  margin-bottom: 0px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  text-align: center;
}

.cost-container {
  display: flex;
  align-items: center;
  gap: 3px;
}

.currency-img {
  width: 10px;
  height: 10px;
  object-fit: contain;
  display: block;
}

.cost-text {
  font-family: 'pixelFont', monospace;
  font-size: 16px;
  color: #FFD700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.cost-text.cost-unavailable {
  color: #aaaaaa; /* Серый цвет вместо красного */
}

.upgrade-button.max-level {
  background-color: rgba(68, 68, 68, 0.3);
  border-color: #888;
  cursor: not-allowed;
  opacity: 0.7;
}
</style> 
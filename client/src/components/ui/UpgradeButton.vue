<template>
  <button 
    class="upgrade-button" 
    :class="{ 'can-afford': canAfford, 'max-level': level >= maxLevel }"
    @click="onUpgrade" 
    :disabled="level >= maxLevel"
    :title="level >= maxLevel ? 'Max level reached' : ''"
  >
    <div class="button-content">
      <div class="name-container">
        <div class="button-text">{{ name }}</div>
      </div>
      <div class="info-container">
        <div class="level-text">Amount {{ level }}</div>
        <div class="cost-container">
          <img class="currency-img gold-img" src="/assets/images/towers/Gold.png" alt="Gold" 
               onerror="this.onerror=null; this.src='/assets/images/currency/gold_coin.png';" />
          <div class="cost-text">{{ cost }}</div>
        </div>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
import { SkillType, CurrencyType } from '../../game/types/SkillType';

// Объявление для TypeScript, что window.game существует
declare global {
  interface Window {
    game?: any;
  }
}

const props = defineProps<{
  name: string;
  cost: number;
  level: number;
  maxLevel: number;
  canAfford: boolean;
  skillType: SkillType;
}>();

const emit = defineEmits<{
  (e: 'upgrade', skillType: SkillType): void;
  (e: 'purchase-success', skillType: SkillType): void;
}>();

// Обработчик нажатия на кнопку улучшения
function onUpgrade() {
  // Если достигнут максимальный уровень, ничего не делаем
  if (props.level >= props.maxLevel) return;
  
  // Отправка оригинального события для совместимости
  emit('upgrade', props.skillType);
  
  // Найти GameScene и UpgradeManager
  if (window.game?.scene?.scenes) {
    const gameScene = window.game.scene.scenes.find((scene: any) => scene.key === 'GameScene');
    if (gameScene && gameScene.upgradeManager) {
      const upgradeManager = gameScene.upgradeManager;
      
      try {
        console.log(`UpgradeButton: Попытка покупки ${props.skillType} за GOLD`);
        
        // Попытка купить улучшение через UpgradeManager (явно указываем GOLD)
        const success = upgradeManager.purchaseUpgrade(props.skillType, CurrencyType.GOLD);
        
        console.log(`UpgradeButton: Результат покупки: ${success ? 'успешно' : 'неудачно'}`);
        
        if (success) {
          // Воспроизвести звук покупки через audioManager (как в UIManager)
          const audioManager = gameScene.audioManager;
          if (audioManager && audioManager.playSound) {
            audioManager.playSound('upgradeButton');
          } else if (gameScene.sound && gameScene.sound.play) {
            gameScene.sound.play('upgrade');
          }
          
          // Обновить башню
          if (gameScene.tower && gameScene.tower.upgrade) {
            gameScene.tower.upgrade();
          }
          
          // Обновить UI через uiManager
          if (gameScene.uiManager && gameScene.uiManager.updateGoldCount) {
            const currentGold = gameScene.goldManager?.gold_count || 0;
            gameScene.uiManager.updateGoldCount(currentGold);
            console.log(`UpgradeButton: UI обновлен, текущее количество монет: ${currentGold}`);
          }
          
          // Сообщить об успешной покупке
          emit('purchase-success', props.skillType);
        }
      } catch (error) {
        console.error('Error purchasing upgrade:', error);
      }
    }
  }
}
</script>

<style scoped>
.upgrade-button {
  width: 160px;
  height: 45px;
  background-color: rgba(34, 102, 34, 0.8);
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
  justify-content: space-between;
  align-items: center;
}

.name-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 55%;
  height: 100%;
}

.info-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  height: 100%;
  width: 45%;
}

.upgrade-button.can-afford {
  background-color: rgba(69, 160, 73, 0.5);
  border-color: #45a049;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
}

.upgrade-button:hover {
  background-color: rgba(56, 120, 56, 0.8);
  transform: scale(1.03);
}

.upgrade-button.can-afford:hover {
  background-color: rgba(76, 175, 80, 0.7);
}

.button-text {
  font-family: 'pixelFont', monospace;
  font-size: 15px;
  color: white;
  text-align: left;
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
  font-size: 13px;
  color: #ccc;
  margin-bottom: 3px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  text-align: right;
}

.cost-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.currency-img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  display: block;
}

.cost-text {
  font-family: 'pixelFont', monospace;
  font-size: 13px;
  color: #FFD700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.upgrade-button.max-level {
  background-color: rgba(68, 68, 68, 0.3);
  border-color: #888;
  cursor: not-allowed;
  opacity: 0.7;
}
</style> 
<template>
  <div class="upgrade-panel">
    <!-- Прокручиваемая витрина улучшений (верхние 85%) -->
    <div class="skills-showcase">
      <UpgradeSkillShowcase 
        :categoryId="activeCategory" 
      />
    </div>
    
    <!-- Фиксированные категории внизу (15%) -->
    <div class="category-tabs">
      <CategoryTab 
        :categories="CATEGORIES" 
        :activeCategory="activeCategory" 
        @change-category="setActiveCategory"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CategoryTab from './CategoryTab.vue';
import UpgradeSkillShowcase from './UpgradeSkillShowcase.vue';

// Категории улучшений
const CATEGORIES = ["Attack Upgrades", "Defense Upgrades", "Utility Upgrades"];

// Активная категория (индекс)
const activeCategory = ref(0);

// Функция для смены активной категории
const setActiveCategory = (index: number) => {
  activeCategory.value = index;
};

// При монтировании выбираем первую категорию
onMounted(() => {
  setActiveCategory(0);
});
</script>

<style scoped>
.upgrade-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* Верхняя часть с кнопками улучшений (85% высоты) */
.skills-showcase {
  width: 100%;
  flex: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 40px; /* Оставляем место для вкладок снизу */
  overflow-y: auto;
  background-color: rgba(20, 20, 20, 0.6);
}

/* Нижняя часть с категориями (фиксированная высота) */
.category-tabs {
  width: 100%;
  height: 40px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
}
</style> 
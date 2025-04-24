import { defineStore } from 'pinia';

// Game UI state types
export type GameUIState = {
  gameUIVisible: boolean;
  upgradesPanelVisible: boolean;
  statsUpdateCounter: number;
  isTowerAlive: boolean;
  stats: {
    gold: number;
    emblems: number;
    health: number;
    maxHealth: number;
  }
};

export const useGameStore = defineStore('game', {
  state: (): GameUIState => ({
    gameUIVisible: false,
    upgradesPanelVisible: false,
    statsUpdateCounter: 0,
    isTowerAlive: false,
    stats: {
      gold: 0,
      emblems: 0,
      health: 100,
      maxHealth: 100
    }
  }),
  
  actions: {
    // Tower alive state actions
    setTowerAlive(isAlive: boolean) {
      this.isTowerAlive = isAlive;
    },
    
    // UI visibility actions
    showGameUI() {
      this.gameUIVisible = true;
    },
    
    hideGameUI() {
      this.gameUIVisible = false;
    },
    
    showUpgradesPanel() {
      this.upgradesPanelVisible = true;
    },
    
    hideUpgradesPanel() {
      this.upgradesPanelVisible = false;
    },
    
    // Stats update actions
    updateStats(stats: Partial<GameUIState['stats']>) {
      this.stats = { ...this.stats, ...stats };
      this.statsUpdateCounter++; // Trigger reactivity
    },
    
    updateGold(gold: number) {
      this.stats.gold = gold;
      this.statsUpdateCounter++;
    },
    
    updateEmblems(emblems: number) {
      this.stats.emblems = emblems;
      this.statsUpdateCounter++;
    },
    
    updateHealth(health: number, maxHealth?: number) {
      this.stats.health = health;
      if (maxHealth !== undefined) {
        this.stats.maxHealth = maxHealth;
      }
      this.statsUpdateCounter++;
    }
  }
}); 
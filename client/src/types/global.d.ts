import EventBus from '../services/eventBus';

declare global {
  interface Window {
    vueEventBus: typeof EventBus;
    upgradeManager: any; // Add proper type if available
  }
}

export {}; 
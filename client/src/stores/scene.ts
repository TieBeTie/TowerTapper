import { defineStore } from 'pinia';
import { ref } from 'vue';

// Define types for scenes
export type PhaseScene = 'boot' | 'menu' | 'game' | 'upgrades' | 'emblems' | 'rating';
export type VueView = 'none' | 'menu' | 'game' | 'upgrades' | 'emblems' | 'rating';

export const useSceneStore = defineStore('scene', {
  state: () => ({
    phaser: 'boot' as PhaseScene,  // Current Phaser scene
    view: 'none' as VueView        // Current Vue view
  }),
  
  actions: {
    // Set the current Phaser scene
    setPhaser(scene: PhaseScene) {
      this.phaser = scene;
    },
    
    // Set the current Vue view
    setView(view: VueView) {
      this.view = view;
    },
    
    // Shorthand for navigating to a scene (updates both Phaser and Vue)
    go(scene: PhaseScene, view?: VueView) {
      console.log(`[SceneStore] go called with scene: ${scene}, view: ${view || 'undefined'}`);
      
      this.phaser = scene;
      this.view = view || (scene as VueView);
    }
  }
}); 
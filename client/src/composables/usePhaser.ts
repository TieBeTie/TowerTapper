import { onMounted, onUnmounted, watch } from 'vue';
import Phaser from 'phaser';
import { useSceneStore } from '../stores/scene';
import BootScene from '../game/scenes/BootScene';
import MenuScene from '../game/scenes/MenuScene';
import GameScene from '../game/scenes/GameScene';
import InitialUpgradesShopScene from '../game/scenes/InitialUpgradesShopScene';
import EmblemsShopScene from '../game/scenes/EmblemsShopScene';
import BackgroundScene from '../game/scenes/BackgroundScene';

export function usePhaser(containerId: string = 'game-container') {
  let game: Phaser.Game | null = null;
  const sceneStore = useSceneStore();
  
  // Initialize the game
  onMounted(() => {
    // Basic game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: containerId,
        width: window.innerWidth,
        height: window.innerHeight
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 }
        }
      },
      scene: [
        BootScene,
        MenuScene, 
        GameScene, 
        InitialUpgradesShopScene, 
        EmblemsShopScene,
        BackgroundScene
      ],
      render: {
        pixelArt: true
      }
    };
    
    // Create the game instance
    game = new Phaser.Game(config);
    
    // Watch for Pinia store changes to start the appropriate scene
    const stopWatch = watch(() => sceneStore.phaser, (newScene) => {
      if (!game) return;
      
      const sceneName = `${newScene.charAt(0).toUpperCase() + newScene.slice(1)}Scene`;
      if (game.scene.getScene(sceneName) && !game.scene.isActive(sceneName)) {
        console.log(`[usePhaser] Starting scene: ${sceneName}`);
        game.scene.start(sceneName);
      }
    });
    
    // Clean up on unmount
    onUnmounted(() => {
      stopWatch();
      if (game) {
        game.destroy(true);
        game = null;
      }
    });
  });
  
  return {
    getGame: () => game
  };
} 
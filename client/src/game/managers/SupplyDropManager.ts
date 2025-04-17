import Phaser from 'phaser';
import { SupplyDrop } from '../objects/collectibles/SupplyDrop';
import { ScreenManager } from './ScreenManager';
import { IGameScene } from '../types/IGameScene';

export class SupplyDropManager {
    private scene: Phaser.Scene;
    private screenManager: ScreenManager;
    private activeSupplyDrops: SupplyDrop[] = [];
    private readonly MAX_ACTIVE_DROPS = 3; // Maximum number of active supply drops at once
    
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.screenManager = new ScreenManager(scene);
        
        // Initialize the supply drop texture
        SupplyDrop.createTexture(scene);
        
        // Listen for supply drop trigger events
        this.scene.events.on('triggerSupplyDrop', this.createSupplyDrop, this);
        
        // Listen for screen resize events
        this.scene.events.on('screenResize', this.handleScreenResize, this);
        
        // Clean up when scene is shut down
        this.scene.events.on('shutdown', this.cleanUp, this);
    }
    
    createSupplyDrop(): void {
        // Check if we've reached the maximum number of drops
        if (this.activeSupplyDrops.length >= this.MAX_ACTIVE_DROPS) {
            // Remove the oldest supply drop if we've reached the limit
            const oldestDrop = this.activeSupplyDrops.shift();
            if (oldestDrop && oldestDrop.active) {
                oldestDrop.destroy();
            }
        }
        
        // Get the playable area based on screen size
        const { width, height } = this.screenManager.getScreenSize();
        const gameViewHeight = height * this.screenManager.getGameViewHeightRatio();
        
        // Calculate a random position within the game area
        // Avoid edges and UI elements
        const padding = width * 0.1; // 10% padding from edges
        const x = Phaser.Math.Between(padding, width - padding);
        const y = Phaser.Math.Between(padding, gameViewHeight - padding);
        
        // Calculate the gold reward based on player progress
        const gameScene = this.scene.scene.get('GameScene') as IGameScene;
        let goldValue = 20; // Base value
        
        // If we can access the wave manager, scale the reward with the wave number
        if (gameScene && (gameScene as any).waveManager) {
            const currentWave = (gameScene as any).waveManager.getCurrentWave() || 1;
            goldValue = Math.floor(20 * (1 + currentWave * 0.1)); // 10% increase per wave
        }
        
        // Create the supply drop
        const supplyDrop = new SupplyDrop(this.scene, x, y, goldValue);
        
        // Start with a scale of 0 and animate to full size
        supplyDrop.setScale(0);
        this.scene.tweens.add({
            targets: supplyDrop,
            scale: supplyDrop.scale * 0.4 * this.screenManager.getGameScale(),
            duration: 500,
            ease: 'Back.easeOut'
        });
        
        // Add to our tracking array
        this.activeSupplyDrops.push(supplyDrop);
        
        // Play sound effect if available
        const audioManager = (gameScene as any).audioManager;
        if (audioManager) {
            audioManager.playSound('supply_drop');
        }
    }
    
    handleScreenResize(): void {
        // Update positions of all active supply drops if needed
        // This would be important if the layout changes significantly
        
        // For now, we'll just ensure they remain within bounds
        const { width, height } = this.screenManager.getScreenSize();
        const gameViewHeight = height * this.screenManager.getGameViewHeightRatio();
        const padding = width * 0.1;
        
        this.activeSupplyDrops.forEach(drop => {
            if (drop.active) {
                // Keep within horizontal bounds
                if (drop.x < padding) drop.x = padding;
                if (drop.x > width - padding) drop.x = width - padding;
                
                // Keep within vertical bounds
                if (drop.y < padding) drop.y = padding;
                if (drop.y > gameViewHeight - padding) drop.y = gameViewHeight - padding;
            }
        });
    }
    
    cleanUp(): void {
        // Remove all event listeners
        this.scene.events.off('triggerSupplyDrop', this.createSupplyDrop, this);
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        
        // Destroy all active supply drops
        this.activeSupplyDrops.forEach(drop => {
            if (drop.active) {
                drop.destroy();
            }
        });
        
        // Clear the array
        this.activeSupplyDrops = [];
    }
} 
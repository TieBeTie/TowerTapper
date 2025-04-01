import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';

export class SupplyDrop extends Phaser.GameObjects.Sprite {
    private screenManager: ScreenManager;
    private goldValue: number;
    private lifespan: number;
    private lifespanTimer?: Phaser.Time.TimerEvent;
    private pulseEffect?: Phaser.Tweens.Tween;
    private hasBeenCollected: boolean = false;

    // Static method to create the texture once
    public static createTexture(scene: Phaser.Scene): void {
        // Check if texture already exists to avoid recreating it
        if (scene.textures.exists('supply_drop')) return;
        
        // Create a simple supply drop texture (gold box)
        const supplyDropGraphics = scene.add.graphics();
        
        // Box body (gold color)
        supplyDropGraphics.fillStyle(0xFFD700, 1);
        supplyDropGraphics.fillRect(4, 4, 56, 56);
        
        // Box outline
        supplyDropGraphics.lineStyle(4, 0x8B4513, 1);
        supplyDropGraphics.strokeRect(4, 4, 56, 56);
        
        // Details (lock, hinges, etc.)
        supplyDropGraphics.fillStyle(0x8B4513, 1);
        // Lock
        supplyDropGraphics.fillRect(28, 24, 8, 16);
        // Hinges
        supplyDropGraphics.fillRect(8, 14, 4, 10);
        supplyDropGraphics.fillRect(52, 14, 4, 10);
        
        // Generate the texture
        supplyDropGraphics.generateTexture('supply_drop', 64, 64);
        supplyDropGraphics.destroy();
    }

    constructor(scene: Phaser.Scene, x: number, y: number, goldValue: number = 20) {
        // Make sure the texture exists
        SupplyDrop.createTexture(scene);
        
        super(scene, x, y, 'supply_drop');
        
        // Get screen manager
        this.screenManager = new ScreenManager(scene);
        
        // Adjust scale based on screen size
        const gameScale = this.screenManager.getGameScale();
        this.setScale(0.4 * gameScale);
        
        this.goldValue = goldValue;
        this.lifespan = 8000; // 8 seconds lifespan
        
        // Set up interactivity
        this.setInteractive({ useHandCursor: true });
        
        // Add tap/click handler
        this.on('pointerdown', this.onTap, this);
        
        // Set depth to ensure it's visible
        this.setDepth(50);
        
        // Add to scene
        scene.add.existing(this);
        
        // Set up animation
        this.setupAnimation();
        
        // Set up lifespan timer
        this.setupLifespan();
    }
    
    private setupAnimation(): void {
        // Create a pulse animation
        this.pulseEffect = this.scene.tweens.add({
            targets: this,
            scale: this.scale * 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Add a slight rotation effect
        this.scene.tweens.add({
            targets: this,
            angle: { from: -5, to: 5 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    private setupLifespan(): void {
        // Create a timer that will remove the supply drop if not collected
        this.lifespanTimer = this.scene.time.delayedCall(this.lifespan, this.onLifespanEnd, [], this);
        
        // Create a visual indicator of remaining time (simple alpha fade)
        this.scene.tweens.add({
            targets: this,
            alpha: { from: 1, to: 0.3 },
            duration: this.lifespan,
            ease: 'Linear',
            onComplete: () => {
                // This is a backup in case the timer doesn't trigger
                if (!this.hasBeenCollected) {
                    this.onLifespanEnd();
                }
            }
        });
    }
    
    private onTap(): void {
        if (this.hasBeenCollected) return;
        
        this.hasBeenCollected = true;
        
        // Stop animations
        if (this.pulseEffect) {
            this.pulseEffect.stop();
        }
        
        // Play collection animation
        this.scene.tweens.add({
            targets: this,
            scale: this.scale * 1.5,
            alpha: 0,
            y: this.y - 50,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => {
                // Give gold to player
                this.collectReward();
                
                // Destroy this object
                this.destroy();
            }
        });
        
        // Play sound effect if available
        const gameScene = this.scene.scene.get('GameScene');
        if ((gameScene as any).audioManager) {
            (gameScene as any).audioManager.playSound('gold_collect');
        }
    }
    
    private onLifespanEnd(): void {
        if (this.hasBeenCollected) return;
        
        this.hasBeenCollected = true;
        
        // Play disappear animation
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            y: this.y + 20,
            duration: 200,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.destroy();
            }
        });
    }
    
    private collectReward(): void {
        // Get the game scene
        const gameScene = this.scene.scene.get('GameScene');
        
        // Add gold to player's account
        if ((gameScene as any).goldManager) {
            const currentGold = (gameScene as any).goldManager.getGoldCount();
            (gameScene as any).goldManager.updateGoldDirectly(currentGold + this.goldValue);
            
            // Show notification of gold collected
            if ((gameScene as any).uiManager && (gameScene as any).uiManager.showNotification) {
                (gameScene as any).uiManager.showNotification(`+${this.goldValue} Gold!`, 0xFFD700);
            }
        }
    }
    
    destroy(fromScene?: boolean): void {
        // Clean up
        if (this.lifespanTimer) {
            this.lifespanTimer.remove();
        }
        
        // Remove event listeners
        this.off('pointerdown', this.onTap, this);
        
        super.destroy(fromScene);
    }
} 
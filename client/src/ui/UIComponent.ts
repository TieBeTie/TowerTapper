import Phaser from 'phaser';
import { ScreenManager } from '../managers/ScreenManager';

export interface UIComponentConfig {
    scene: Phaser.Scene;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    scale?: number;
    alpha?: number;
    padding?: number;
    fontSize?: number;
    responsive?: boolean;
    screenManager?: ScreenManager;
}

export abstract class UIComponent extends Phaser.GameObjects.Container {
    public width: number;
    public height: number;
    public scale: number;
    public alpha: number;
    protected padding: number;
    protected fontSize: number;
    protected responsive: boolean;
    protected screenManager: ScreenManager;

    constructor(config: UIComponentConfig) {
        super(config.scene, config.x || 0, config.y || 0);
        this.width = config.width || 0;
        this.height = config.height || 0;
        this.scale = config.scale || 1;
        this.alpha = config.alpha || 1;
        this.padding = config.padding || 10;
        this.fontSize = config.fontSize || 16;
        this.responsive = config.responsive || false;
        this.screenManager = config.screenManager || new ScreenManager(config.scene);
        
        this.setScale(this.scale);
        this.setAlpha(this.alpha);

        if (this.responsive) {
            // Use ScreenManager's screen resize event
            this.scene.events.on('screenResize', this.handleScreenResize, this);
        }
    }

    abstract init(): void;

    getCustomScale(): number {
        return this.responsive ? this.getResponsiveScale() : this.scale;
    }

    getCustomAlpha(): number {
        return this.alpha;
    }

    getPadding(): number {
        return this.responsive ? this.getResponsivePadding() : this.padding;
    }

    getFontSize(): number {
        return this.responsive ? this.getResponsiveFontSize() : this.fontSize;
    }

    protected getResponsiveScale(): number {
        return this.screenManager.getGameScale() * this.scale;
    }

    protected getResponsivePadding(): number {
        return this.screenManager.getResponsivePadding(this.padding);
    }

    protected getResponsiveFontSize(): number {
        return this.screenManager.getResponsiveFontSize(this.fontSize);
    }

    protected handleScreenResize(gameScale: number): void {
        if (this.responsive) {
            try {
                // Update scale
                this.setScale(this.getResponsiveScale());
                
                // Update position based on new screen dimensions
                if (this.x !== undefined || this.y !== undefined) {
                    const { width, height } = this.screenManager.getScreenSize();
                    
                    // If position was defined as percentage (values between 0 and 1)
                    if (this.x > 0 && this.x < 1) {
                        this.x = width * this.x;
                    }
                    
                    if (this.y > 0 && this.y < 1) {
                        this.y = height * this.y;
                    }
                    
                    // Force position update with integer values to avoid blurry rendering
                    this.setPosition(Math.round(this.x), Math.round(this.y));
                }
                
                // Make sure component and all children are visible
                this.setVisible(true);
                this.setAlpha(this.alpha);
                
                // Ensure all children are visible too
                this.list.forEach(child => {
                    if (child) {
                        if ('setVisible' in child) {
                            (child as any).setVisible(true);
                        }
                        if ('setAlpha' in child) {
                            (child as any).setAlpha(1);
                        }
                    }
                });
                
                // Force component to re-layout
                if (this.layout) {
                    this.layout();
                }
                
                // Add a delayed update to ensure visibility after browser has finished resizing
                if (this.scene && this.scene.time) {
                    this.scene.time.delayedCall(200, () => {
                        if (this.active && this.visible) {
                            this.setVisible(true);
                            this.setAlpha(this.alpha);
                            
                            // Ensure all children are visible again
                            this.list.forEach(child => {
                                if (child) {
                                    if ('setVisible' in child) {
                                        (child as any).setVisible(true);
                                    }
                                    if ('setAlpha' in child) {
                                        (child as any).setAlpha(1);
                                    }
                                }
                            });
                        }
                    });
                }
            } catch (e) {
                console.warn('Error in UIComponent.handleScreenResize:', e);
            }
        }
    }

    layout(): void {
        // Base layout implementation
        this.setSize(this.width, this.height);
    }

    destroy(fromScene?: boolean): void {
        if (this.responsive) {
            this.scene.events.off('screenResize', this.handleScreenResize, this);
        }
        super.destroy(fromScene);
    }
} 
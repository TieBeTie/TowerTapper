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
            this.setScale(this.getResponsiveScale());
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
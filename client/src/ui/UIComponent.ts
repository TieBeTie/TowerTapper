import Phaser from 'phaser';

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
}

export abstract class UIComponent extends Phaser.GameObjects.Container {
    public width: number;
    public height: number;
    public scale: number;
    public alpha: number;
    protected padding: number;
    protected fontSize: number;

    constructor(config: UIComponentConfig) {
        super(config.scene, config.x || 0, config.y || 0);
        this.width = config.width || 0;
        this.height = config.height || 0;
        this.scale = config.scale || 1;
        this.alpha = config.alpha || 1;
        this.padding = config.padding || 10;
        this.fontSize = config.fontSize || 16;
        this.setScale(this.scale);
        this.setAlpha(this.alpha);
    }

    abstract init(): void;

    getCustomScale(): number {
        return this.scale;
    }

    getCustomAlpha(): number {
        return this.alpha;
    }

    getPadding(): number {
        return this.padding;
    }

    getFontSize(): number {
        return this.fontSize;
    }

    layout(): void {
        // Base layout implementation
        this.setSize(this.width, this.height);
    }

    destroy(fromScene?: boolean): void {
        super.destroy(fromScene);
    }
} 
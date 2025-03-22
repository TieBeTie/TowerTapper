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
    responsive?: boolean;
}

export abstract class UIComponent extends Phaser.GameObjects.Container {
    public width: number;
    public height: number;
    public scale: number;
    public alpha: number;
    protected padding: number;
    protected fontSize: number;
    protected responsive: boolean;

    constructor(config: UIComponentConfig) {
        super(config.scene, config.x || 0, config.y || 0);
        this.width = config.width || 0;
        this.height = config.height || 0;
        this.scale = config.scale || 1;
        this.alpha = config.alpha || 1;
        this.padding = config.padding || 10;
        this.fontSize = config.fontSize || 16;
        this.responsive = config.responsive || false;
        this.setScale(this.scale);
        this.setAlpha(this.alpha);

        if (this.responsive) {
            this.scene.scale.on('resize', this.handleResize, this);
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
        const { width, height } = this.scene.scale;
        const baseWidth = this.scene.scale.baseSize.width;
        const baseHeight = this.scene.scale.baseSize.height;
        const scaleX = width / baseWidth;
        const scaleY = height / baseHeight;
        return Math.min(scaleX, scaleY) * this.scale;
    }

    protected getResponsivePadding(): number {
        const { width } = this.scene.scale;
        const baseWidth = this.scene.scale.baseSize.width;
        return (width / baseWidth) * this.padding;
    }

    protected getResponsiveFontSize(): number {
        const { width } = this.scene.scale;
        const baseWidth = this.scene.scale.baseSize.width;
        return (width / baseWidth) * this.fontSize;
    }

    protected handleResize(gameSize: Phaser.Structs.Size): void {
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
            this.scene.scale.removeListener('resize', this.handleResize, this);
        }
        super.destroy(fromScene);
    }
} 
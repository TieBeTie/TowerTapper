export interface UIComponentConfig {
    x: number;
    y: number;
    width: number;
    height: number;
    alpha?: number;
    scale?: number;
}

export abstract class UIComponent extends Phaser.GameObjects.Container {
    public width: number;
    public height: number;
    public alpha: number;
    private _customScale: number;

    constructor(scene: Phaser.Scene, config: UIComponentConfig) {
        super(scene, config.x, config.y);
        
        this.width = config.width;
        this.height = config.height;
        this.alpha = config.alpha ?? 1;
        this._customScale = config.scale ?? 1;
        this.scale = this._customScale;

        scene.add.existing(this);
        this.init();
    }

    protected abstract init(): void;

    public setDisplaySize(width: number, height: number): this {
        this.width = width;
        this.height = height;
        return this;
    }

    public setScale(x?: number, y?: number): this {
        const scaleX = x ?? 1;
        const scaleY = y ?? x ?? 1;
        this._customScale = scaleX;
        super.setScale(scaleX, scaleY);
        return this;
    }

    public setAlpha(value?: number): this {
        this.alpha = value ?? 1;
        super.setAlpha(this.alpha);
        return this;
    }

    protected getCustomScale(): number {
        return this._customScale;
    }

    protected getScaledValue(value: number): number {
        return value * this._customScale;
    }

    protected createBackground(color: number = 0x000000, alpha: number = 0.5): Phaser.GameObjects.Rectangle {
        const background = this.scene.add.rectangle(
            0,
            0,
            this.width,
            this.height,
            color,
            alpha
        );
        background.setOrigin(0);
        this.add(background);
        return background;
    }
} 
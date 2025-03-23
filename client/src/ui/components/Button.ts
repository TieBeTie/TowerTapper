import Phaser from 'phaser';
import { UIComponent, UIComponentConfig } from '../UIComponent';

interface ButtonConfig extends UIComponentConfig {
    text: string;
    onClick: () => void;
    backgroundColor?: number;
    textColor?: number;
}

export class Button extends UIComponent {
    private text: string;
    private onClick: () => void;
    private backgroundColor: number;
    private textColor: number;
    private background!: Phaser.GameObjects.Rectangle;
    private label!: Phaser.GameObjects.Text;

    constructor(config: ButtonConfig) {
        super(config);
        this.text = config.text;
        this.onClick = config.onClick;
        this.backgroundColor = config.backgroundColor || 0x4a4a4a;
        this.textColor = config.textColor || 0xffffff;
        this.init();
    }

    init(): void {
        // Create background
        this.background = this.scene.add.rectangle(0, 0, this.width, this.height, this.backgroundColor);
        this.add(this.background);

        // Create text
        this.label = this.scene.add.text(0, 0, this.text, {
            fontSize: '24px',
            color: `#${this.textColor.toString(16).padStart(6, '0')}`,
            fontFamily: 'pixelFont',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.add(this.label);

        // Make interactive
        this.background.setInteractive();
        this.background.on('pointerdown', this.onClick);

        // Layout
        this.layout();
    }

    layout(): void {
        super.layout();
        this.background.setSize(this.width, this.height);
        this.label.setPosition(0, 0);
    }

    destroy(fromScene?: boolean): void {
        if (this.background) {
            this.background.destroy();
        }
        if (this.label) {
            this.label.destroy();
        }
        super.destroy(fromScene);
    }
} 
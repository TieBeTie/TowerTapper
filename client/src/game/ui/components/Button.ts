import Phaser from 'phaser';
import { UIComponent, UIComponentConfig } from '../UIComponent';
import { ScreenManager } from '../../managers/ScreenManager';

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
        
        // Listen for screen resize events
        this.scene.events.on('screenResize', this.handleScreenResize, this);
    }

    init(): void {
        // Get responsive font size
        const fontSize = this.getFontSize();
        const strokeThickness = Math.max(2, Math.round(3 * this.screenManager.getGameScale()));
        
        // Create background
        this.background = this.scene.add.rectangle(0, 0, this.width, this.height, this.backgroundColor);
        this.add(this.background);

        // Create text
        this.label = this.scene.add.text(0, 0, this.text, {
            fontSize: `${fontSize}px`,
            color: `#${this.textColor.toString(16).padStart(6, '0')}`,
            fontFamily: 'pixelFont',
            stroke: '#000000',
            strokeThickness: strokeThickness,
            resolution: 3,
            align: 'center',
            padding: { x: 1, y: 1 }
        }).setOrigin(0.5);
        this.add(this.label);

        // Set the text position to integer coordinates for sharper rendering
        this.label.setPosition(Math.floor(this.label.x), Math.floor(this.label.y));

        // Make interactive
        this.background.setInteractive();
        this.background.on('pointerdown', this.onClick);

        // Layout
        this.layout();
    }
    
    handleScreenResize(gameScale: number): void {
        super.handleScreenResize(gameScale);
        
        // Update font size
        const fontSize = this.getFontSize();
        const strokeThickness = Math.max(2, Math.round(3 * gameScale));
        
        this.label.setFontSize(fontSize);
        this.label.setStroke('#000000', strokeThickness);
        this.label.setResolution(3);
        
        // Update layout
        this.layout();
    }

    layout(): void {
        super.layout();
        this.background.setSize(this.width, this.height);
        
        // Set to integer position for sharp rendering
        this.label.setPosition(Math.floor(0), Math.floor(0));
    }

    destroy(fromScene?: boolean): void {
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        
        if (this.background) {
            this.background.destroy();
        }
        if (this.label) {
            this.label.destroy();
        }
        super.destroy(fromScene);
    }
} 
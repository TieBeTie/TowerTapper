import Phaser from 'phaser';

export interface ProgressBarColors {
    background?: number;
    fill?: number;
    border?: number;
    borderAlpha?: number;
}

export class ProgressBar extends Phaser.GameObjects.Graphics {
    width: number;
    height: number;
    value: number;
    private colors: Required<ProgressBarColors>; // Use Required to ensure all colors have defaults
    private cornerRadius: number;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        width: number,
        height: number,
        colors: ProgressBarColors = {}, // Optional colors object
        cornerRadius: number = 8 // Default corner radius increased for better button-like style
    ) {
        super(scene);
        this.setPosition(x, y);
        this.width = width;
        this.height = height;
        this.value = 0; // Start with 0 value
        this.cornerRadius = Math.min(cornerRadius, height / 2); // Ensure radius isn't too large

        // Set default colors to match button styling
        this.colors = {
            background: colors.background ?? 0x2a2a2a, // Darker background like buttons
            fill: colors.fill ?? 0x4285f4,           // Blue fill (more modern look)
            border: colors.border ?? 0xffffff,         // White border
            borderAlpha: colors.borderAlpha ?? 0.3       // Semi-transparent border
        };

        scene.add.existing(this);
        this.draw();
    }

    setValue(value: number): void {
        // Ensure value stays between 0 and 100
        this.value = Phaser.Math.Clamp(value, 0, 100);
        this.draw();
    }

    // Method to update colors dynamically if needed
    setColors(colors: ProgressBarColors): void {
        this.colors = { ...this.colors, ...colors };
        this.draw();
    }

    draw(): void {
        this.clear();

        const w = this.width;
        const h = this.height;
        const r = this.cornerRadius;
        const progressWidth = (this.value / 100) * w;

        // Draw border (slightly larger than the bar)
        this.fillStyle(this.colors.border, this.colors.borderAlpha);
        this.fillRoundedRect(-2, -2, w + 4, h + 4, r + 1); // Slightly larger border for button-like effect

        // Draw background
        this.fillStyle(this.colors.background, 1);
        this.fillRoundedRect(0, 0, w, h, r);

        // Draw progress fill only if value > 0
        if (progressWidth > 0) {
            this.fillStyle(this.colors.fill, 1);
            
            // For properly rounded corners on both sides
            if (progressWidth < r) {
                // Special case for very small progress
                this.fillCircle(r, h/2, progressWidth);
            } else if (progressWidth >= w - r) {
                // If fill is near full, draw full rounded rect
                this.fillRoundedRect(0, 0, progressWidth, h, r);
            } else {
                // Custom rounded shape for progress
                this.beginPath();
                this.moveTo(r, 0);
                this.lineTo(progressWidth, 0);
                this.lineTo(progressWidth, h);
                this.lineTo(r, h);
                this.arc(r, r, r, Math.PI/2, Math.PI*1.5, true);
                this.closePath();
                this.fillPath();
            }
        }
    }
}

export default ProgressBar;

// Add fillRoundedRect to Graphics prototype if it doesn't exist (Phaser 3 might need this)
// Ensure this polyfill doesn't conflict if Phaser updates include it natively.
if (!Phaser.GameObjects.Graphics.prototype.fillRoundedRect) {
    Phaser.GameObjects.Graphics.prototype.fillRoundedRect = function(x: number, y: number, width: number, height: number, radius: number | Phaser.Types.GameObjects.Graphics.RoundedRectRadius): Phaser.GameObjects.Graphics {
        let tl = 0, tr = 0, bl = 0, br = 0;

        if (typeof radius === 'number') {
            tl = tr = bl = br = radius;
        } else if (radius) {
            tl = radius.tl ?? 0;
            tr = radius.tr ?? 0;
            bl = radius.bl ?? 0;
            br = radius.br ?? 0;
        }
        // Clamp radius values
        tl = Math.min(tl, width / 2, height / 2);
        tr = Math.min(tr, width / 2, height / 2);
        bl = Math.min(bl, width / 2, height / 2);
        br = Math.min(br, width / 2, height / 2);

        this.beginPath();
        this.moveTo(x + tl, y);
        this.lineTo(x + width - tr, y);
        this.arc(x + width - tr, y + tr, tr, Phaser.Math.DegToRad(270), Phaser.Math.DegToRad(360));
        this.lineTo(x + width, y + height - br);
        this.arc(x + width - br, y + height - br, br, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(90));
        this.lineTo(x + bl, y + height);
        this.arc(x + bl, y + height - bl, bl, Phaser.Math.DegToRad(90), Phaser.Math.DegToRad(180));
        this.lineTo(x, y + tl);
        this.arc(x + tl, y + tl, tl, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(270));
        this.closePath();
        this.fillPath();
        return this;
    };
}
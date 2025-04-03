import { ScreenManager } from '../../managers/ScreenManager';
import { EmblemManager } from '../../managers/EmblemManager';

export class InitialShopHeader {
    private emblemCountText!: Phaser.GameObjects.Text;
    private emblemIcon!: Phaser.GameObjects.Image;
    private titleText!: Phaser.GameObjects.Text;
    
    constructor(
        private scene: Phaser.Scene,
        private screenManager: ScreenManager,
        private emblemManager: EmblemManager
    ) {}
    
    public create(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        
        // Создаем заголовок магазина с еще меньшим размером шрифта
        const titleFontSize = this.screenManager.getResponsiveFontSize(34);
        this.titleText = this.screenManager.createText(
            center.x, 
            height * 0.1, 
            'Initial Upgrades Shop', 
            titleFontSize,
            '#f8d848',
            {
                stroke: '#000000',
                strokeThickness: 3,
                fontFamily: 'pixelFont',
                shadow: { color: '#000000', blur: 5, offsetX: 1, offsetY: 1, fill: true }
            }
        );
        
        // Добавляем эффект пульсации для заголовка
        this.scene.tweens.add({
            targets: this.titleText,
            scale: { from: 1, to: 1.05 },
            duration: 1200,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Добавляем эффект свечения для заголовка
        this.scene.tweens.add({
            targets: this.titleText,
            alpha: { from: 1, to: 0.85 },
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Создаем отображение эмблем
        this.createEmblemDisplay();
    }
    
    private createEmblemDisplay(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const padding = this.screenManager.getResponsivePadding(20);
        const iconSize = this.screenManager.getResponsiveFontSize(28);
        const fontSize = this.screenManager.getResponsiveFontSize(26);
        
        // Создать иконку эмблемы (в левом углу) с высоким значением depth
        this.emblemIcon = this.scene.add.image(padding + iconSize/2, padding + iconSize/2, 'emblem_icon')
            .setDisplaySize(iconSize, iconSize)
            .setDepth(1000); // Увеличиваем depth
            
        // Создать текст с количеством эмблем напрямую через scene.add
        // Вместо использования screenManager.createText
        this.emblemCountText = this.scene.add.text(
            padding + iconSize + 10, 
            padding + iconSize/2, 
            this.emblemManager.getEmblemCount().toString(),
            {
                fontFamily: 'pixelFont',
                fontSize: `${fontSize}px`,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0, 0.5)
         .setDepth(1000); // Установка depth напрямую
        
        console.log("Emblem count created: ", this.emblemManager.getEmblemCount(), "at depth", this.emblemCountText.depth);
    }
    
    public updateEmblemCount(): void {
        if (this.emblemCountText) {
            this.emblemCountText.setText(this.emblemManager.getEmblemCount().toString());
            console.log("Emblem count updated: ", this.emblemManager.getEmblemCount());
        }
    }
    
    public handleResize(gameScale: number): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        
        // Обновляем позицию и размер заголовка
        if (this.titleText) {
            const titleFontSize = this.screenManager.getResponsiveFontSize(34);
            this.titleText.setFontSize(titleFontSize);
            this.titleText.setPosition(center.x, height * 0.1);
        }
        
        // Обновляем отображение эмблем (в левом углу)
        if (this.emblemIcon && this.emblemCountText) {
            const padding = this.screenManager.getResponsivePadding(20);
            const iconSize = this.screenManager.getResponsiveFontSize(28);
            
            this.emblemIcon.setPosition(padding + iconSize/2, padding + iconSize/2);
            this.emblemIcon.setDisplaySize(iconSize, iconSize);
            
            const fontSize = this.screenManager.getResponsiveFontSize(26);
            this.emblemCountText.setPosition(padding + iconSize + 10, padding + iconSize/2);
            this.emblemCountText.setFontSize(fontSize);
        }
    }
    
    public destroy(): void {
        if (this.emblemIcon && this.emblemIcon.active) {
            this.emblemIcon.destroy();
        }
        
        if (this.emblemCountText && this.emblemCountText.active) {
            this.emblemCountText.destroy();
        }
        
        if (this.titleText && this.titleText.active) {
            this.titleText.destroy();
        }
    }
} 
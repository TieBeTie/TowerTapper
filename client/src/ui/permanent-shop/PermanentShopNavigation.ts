import { ScreenManager } from '../../managers/ScreenManager';
import AudioManager from '../../managers/AudioManager';
import { PermanentUpgradeCategory, PermanentShopFilterService } from '../../services/PermanentShopFilterService';

export class PermanentShopNavigation {
    private categoryTitleText!: Phaser.GameObjects.Text;
    private leftButton!: Phaser.GameObjects.Container;
    private rightButton!: Phaser.GameObjects.Container;
    
    // Колбэк для оповещения об изменении категории
    private onCategoryChange: (() => void) | null = null;
    
    constructor(
        private scene: Phaser.Scene,
        private screenManager: ScreenManager,
        private audioManager: AudioManager,
        private shopFilterService: PermanentShopFilterService
    ) {}
    
    public create(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        
        // Создать заголовок категории
        this.createCategoryTitle();
        
        // Создать кнопки навигации
        this.createNavigationButtons(center.x, height * 0.18);
    }
    
    public setOnCategoryChangeCallback(callback: () => void): void {
        this.onCategoryChange = callback;
    }
    
    private createCategoryTitle(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        const categoryFontSize = this.screenManager.getResponsiveFontSize(36);
        
        this.categoryTitleText = this.screenManager.createText(
            center.x,
            height * 0.18,
            this.shopFilterService.getCurrentCategory(),
            categoryFontSize,
            '#FFC107', // Золотой цвет для заголовка категории
            {
                fontFamily: 'pixelFont',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
    }
    
    private createNavigationButtons(x: number, y: number): void {
        const { width } = this.screenManager.getScreenSize();
        
        // Определяем позицию кнопок
        const leftButtonX = x - width * 0.4;
        const rightButtonX = x + width * 0.4;
        
        // Создаем кнопку "влево"
        this.leftButton = this.createNavigationButton(leftButtonX, y, "◀", () => {
            if (this.shopFilterService.previousCategory()) {
                this.updateCategoryTitle();
                if (this.onCategoryChange) {
                    this.onCategoryChange();
                }
            }
        });
        
        // Создаем кнопку "вправо"
        this.rightButton = this.createNavigationButton(rightButtonX, y, "▶", () => {
            if (this.shopFilterService.nextCategory()) {
                this.updateCategoryTitle();
                if (this.onCategoryChange) {
                    this.onCategoryChange();
                }
            }
        });
        
        // Обновляем состояние кнопок
        this.updateNavigationButtonsState();
    }
    
    private createNavigationButton(x: number, y: number, text: string, callback: Function): Phaser.GameObjects.Container {
        const buttonWidth = this.screenManager.getResponsivePadding(50);
        const buttonHeight = this.screenManager.getResponsivePadding(40);
        
        const button = this.scene.add.container(x, y);
        
        const bg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x333333, 0.9);
        bg.setStrokeStyle(2, 0xFFFFFF, 0.8);
        button.add(bg);
        
        const textObj = this.scene.add.text(
            0, 
            0, 
            text, 
            {
                fontFamily: 'pixelFont',
                fontSize: `${this.screenManager.getMediumFontSize() * 0.9}px`,
                color: '#ffffff'
            }
        ).setOrigin(0.5);
        button.add(textObj);
        
        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                bg.fillColor = 0x555555;
            })
            .on('pointerout', () => {
                bg.fillColor = 0x333333;
            })
            .on('pointerdown', () => {
                callback();
                try {
                    if (this.audioManager.hasSoundCached('clickSound')) {
                        this.audioManager.playSound('clickSound');
                    }
                } catch (err) {
                    console.error('Error playing audio on button click:', err);
                }
            });
            
        return button;
    }
    
    private updateNavigationButtonsState(): void {
        if (!this.leftButton || !this.rightButton) {
            return;
        }
        
        // Включаем/отключаем кнопку влево
        const canGoLeft = this.shopFilterService.canGoPrevious();
        const leftButtonBg = this.leftButton.getAt(0) as Phaser.GameObjects.Rectangle;
        if (canGoLeft) {
            leftButtonBg.fillColor = 0x333333;
            (leftButtonBg as any).input.enabled = true;
        } else {
            leftButtonBg.fillColor = 0x222222;
            (leftButtonBg as any).input.enabled = false;
        }
        
        // Включаем/отключаем кнопку вправо
        const canGoRight = this.shopFilterService.canGoNext();
        const rightButtonBg = this.rightButton.getAt(0) as Phaser.GameObjects.Rectangle;
        if (canGoRight) {
            rightButtonBg.fillColor = 0x333333;
            (rightButtonBg as any).input.enabled = true;
        } else {
            rightButtonBg.fillColor = 0x222222;
            (rightButtonBg as any).input.enabled = false;
        }
    }
    
    private updateCategoryTitle(): void {
        if (this.categoryTitleText) {
            this.categoryTitleText.setText(this.shopFilterService.getCurrentCategory());
        }
        this.updateNavigationButtonsState();
    }
    
    public handleResize(gameScale: number): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        
        // Обновляем позицию и размер заголовка категории
        if (this.categoryTitleText) {
            const categoryFontSize = this.screenManager.getResponsiveFontSize(36);
            this.categoryTitleText.setFontSize(categoryFontSize);
            this.categoryTitleText.setPosition(center.x, height * 0.18);
        }
        
        // Обновляем позицию кнопок навигации
        if (this.leftButton && this.rightButton) {
            const leftButtonX = center.x - width * 0.4;
            const rightButtonX = center.x + width * 0.4;
            
            this.leftButton.setPosition(leftButtonX, height * 0.18);
            this.rightButton.setPosition(rightButtonX, height * 0.18);
        }
    }
    
    public destroy(): void {
        if (this.categoryTitleText && this.categoryTitleText.active) {
            this.categoryTitleText.destroy();
        }
        
        if (this.leftButton && this.leftButton.active) {
            this.leftButton.destroy();
        }
        
        if (this.rightButton && this.rightButton.active) {
            this.rightButton.destroy();
        }
    }
} 
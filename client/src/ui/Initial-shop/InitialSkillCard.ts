import { ScreenManager } from '../../managers/ScreenManager';
import { SkillInfo, SkillType, CurrencyType } from '../../types/SkillType';
import { InitialSkillPurchaseService } from '../../services/InitialSkillPurchaseService';

export class InitialSkillCard {
    private gameObjects: Phaser.GameObjects.GameObject[] = [];
    private emblemButtonBg: Phaser.GameObjects.Rectangle | null = null;
    
    constructor(
        private scene: Phaser.Scene,
        private screenManager: ScreenManager,
        private skill: SkillInfo,
        private x: number,
        private y: number,
        private purchaseService: InitialSkillPurchaseService,
        private onPurchase: (skillType: SkillType) => void
    ) {}
    
    public create(): Phaser.GameObjects.GameObject[] {
        const { width } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        const containerWidth = width * 0.85;
        const buttonHeight = this.screenManager.getResponsivePadding(65);
        
        // Create button background
        const buttonBg = this.scene.add.rectangle(this.x, this.y, containerWidth, buttonHeight, 0x333333, 0.9);
        buttonBg.setStrokeStyle(2, 0xFFFFFF, 0.8);
        this.gameObjects.push(buttonBg);
        
        // Add skill name
        const nameText = this.scene.add.text(
            this.x - containerWidth * 0.45, 
            this.y - buttonHeight * 0.3, 
            this.skill.name, 
            {
                fontFamily: 'pixelFont',
                fontSize: `${this.screenManager.getLargeFontSize() * 0.85}px`,
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0, 0.5);
        this.gameObjects.push(nameText);
        
        // Add skill description
        let description = this.skill.description;
        if (description.length > 35) {
            description = description.substring(0, 33) + '...';
        }
        
        const descriptionText = this.scene.add.text(
            this.x - containerWidth * 0.45, 
            this.y, 
            description,
            {
                fontFamily: 'pixelFont',
                fontSize: `${this.screenManager.getSmallFontSize() * 0.85}px`,
                color: '#aaaaaa'
            }
        ).setOrigin(0, 0.5);
        this.gameObjects.push(descriptionText);
        
        // Add level text
        const levelText = this.scene.add.text(
            this.x - containerWidth * 0.45, 
            this.y + buttonHeight * 0.3, 
            `Level: ${this.skill.currentLevel}/${this.skill.maxLevel}`, 
            {
                fontFamily: 'pixelFont',
                fontSize: `${this.screenManager.getSmallFontSize() * 0.85}px`,
                color: '#cccccc'
            }
        ).setOrigin(0, 0.5);
        this.gameObjects.push(levelText);
        
        // Add value text
        const currentValue = this.purchaseService.getSkillValue(this.skill.type);
        const valueText = this.scene.add.text(
            this.x, 
            this.y + buttonHeight * 0.3, 
            `Value: ${currentValue}`, 
            {
                fontFamily: 'pixelFont',
                fontSize: `${this.screenManager.getSmallFontSize() * 0.85}px`,
                color: '#cccccc'
            }
        ).setOrigin(0, 0.5);
        this.gameObjects.push(valueText);
        
        // Create purchase button
        this.createPurchaseButton(containerWidth);
        
        return this.gameObjects;
    }
    
    private createPurchaseButton(containerWidth: number): void {
        const buttonHeight = this.screenManager.getResponsivePadding(45);
        const buttonWidth = containerWidth * 0.28;
        const x = this.x + containerWidth * 0.32;
        
        // Get emblem cost
        const emblemsCost = this.purchaseService.getSkillCost(this.skill.type);
        
        // Check if we can afford the upgrade
        const canAfford = this.purchaseService.canAffordSkill(this.skill.type);
        
        // Create emblem purchase button background
        this.emblemButtonBg = this.scene.add.rectangle(x, this.y, buttonWidth, buttonHeight, 
            canAfford ? 0x2196F3 : 0x757575, 0.9);
        this.emblemButtonBg.setStrokeStyle(2, canAfford ? 0xB19CD9 : 0x555555, 0.8);
        this.gameObjects.push(this.emblemButtonBg);
        
        // Create emblem icon
        const emblemIcon = this.scene.add.sprite(x - buttonWidth/3.5, this.y, 'emblem_icon');
        emblemIcon.setDisplaySize(buttonHeight * 0.65, buttonHeight * 0.65);
        this.gameObjects.push(emblemIcon);
        
        // Create cost text
        const costText = this.scene.add.text(
            x + buttonWidth/10, 
            this.y, 
            `${emblemsCost}`, 
            {
                fontFamily: 'pixelFont',
                fontSize: `${this.screenManager.getMediumFontSize() * 0.85}px`,
                color: '#ffffff'
            }
        ).setOrigin(0, 0.5);
        this.gameObjects.push(costText);
        
        // Add interactivity to the button
        if (canAfford) {
            this.emblemButtonBg.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    this.onPurchase(this.skill.type);
                })
                .on('pointerover', () => {
                    if (this.emblemButtonBg) {
                        this.emblemButtonBg.fillColor = 0x64B5F6;
                    }
                })
                .on('pointerout', () => {
                    if (this.emblemButtonBg) {
                        this.emblemButtonBg.fillColor = 0x2196F3;
                    }
                });
        }
    }
    
    public update(): void {
        // Обновление состояния карточки (например, после покупки)
    }
    
    public updateAfterPurchase(): void {
        // Destroy existing objects
        this.destroy();
        
        // Get updated skill info
        this.skill = this.purchaseService.getUpdatedSkillList()
            .find(skill => skill.type === this.skill.type) || this.skill;
        
        // Re-create the card
        this.create();
    }
    
    /**
     * Обновляет состояние кнопки покупки без пересоздания карточки
     * Используется при изменении количества эмблем
     */
    public updateButtonState(): void {
        if (!this.emblemButtonBg) return;
        
        // Check if we can afford the upgrade
        const canAfford = this.purchaseService.canAffordSkill(this.skill.type);
        
        // Update button appearance
        this.emblemButtonBg.fillColor = canAfford ? 0x2196F3 : 0x757575;
        this.emblemButtonBg.strokeColor = canAfford ? 0xB19CD9 : 0x555555;
        
        // Update interactivity
        if (canAfford && !this.emblemButtonBg.input) {
            this.emblemButtonBg.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    this.onPurchase(this.skill.type);
                })
                .on('pointerover', () => {
                    if (this.emblemButtonBg) {
                        this.emblemButtonBg.fillColor = 0x64B5F6;
                    }
                })
                .on('pointerout', () => {
                    if (this.emblemButtonBg) {
                        this.emblemButtonBg.fillColor = 0x2196F3;
                    }
                });
        } else if (!canAfford && this.emblemButtonBg.input) {
            this.emblemButtonBg.removeInteractive();
        }
    }
    
    public getSkillType(): SkillType {
        return this.skill.type;
    }
    
    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
    
    public destroy(): void {
        this.gameObjects.forEach(obj => {
            if (obj && obj.active) {
                obj.destroy();
            }
        });
        this.gameObjects = [];
        this.emblemButtonBg = null;
    }
} 
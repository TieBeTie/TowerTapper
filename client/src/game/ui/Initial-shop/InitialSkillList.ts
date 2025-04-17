import { ScreenManager } from '../../managers/ScreenManager';
import { SkillInfo, SkillType } from '../../types/SkillType';
import { InitialSkillCard } from './InitialSkillCard';
import { InitialSkillPurchaseService } from '../../services/InitialSkillPurchaseService';

export class InitialSkillList {
    private skillCards: InitialSkillCard[] = [];
    private noSkillsText: Phaser.GameObjects.Text | null = null;
    
    constructor(
        private scene: Phaser.Scene,
        private screenManager: ScreenManager,
        private purchaseService: InitialSkillPurchaseService
    ) {}
    
    public create(skills: SkillInfo[]): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        const padding = this.screenManager.getResponsivePadding(12);
        const buttonHeight = this.screenManager.getResponsivePadding(70);
        const startY = height * 0.25;
        const spacing = buttonHeight + padding;
        
        // Очищаем предыдущие карточки
        this.clearSkillCards();
        
        // Создаем карточки для улучшений
        if (skills.length === 0) {
            // Если категория пуста, показываем сообщение
            this.noSkillsText = this.screenManager.createText(
                center.x,
                startY + spacing * 2,
                'No upgrades available in this category',
                this.screenManager.getMediumFontSize(),
                '#aaaaaa',
                {
                    fontFamily: 'pixelFont'
                }
            );
        } else {
            // Создаем карточки для доступных улучшений
            for (let i = 0; i < skills.length; i++) {
                const skillCard = new InitialSkillCard(
                    this.scene,
                    this.screenManager,
                    skills[i],
                    center.x,
                    startY + (i * spacing),
                    this.purchaseService,
                    this.handlePurchase.bind(this)
                );
                skillCard.create();
                this.skillCards.push(skillCard);
            }
        }
    }
    
    /**
     * Updates the button states of all skill cards without recreating them
     * Used when emblem count changes
     */
    public updateAllButtonStates(): void {
        for (const card of this.skillCards) {
            card.updateButtonState();
        }
    }
    
    private handlePurchase(skillType: SkillType): void {
        // Покупаем улучшение
        const purchased = this.purchaseService.purchaseSkill(skillType);
        
        // Если успешно, обновляем интерфейс
        if (purchased) {
            // Находим карточку, которую нужно обновить
            const skillCard = this.skillCards.find(card => card.getSkillType() === skillType);
            if (skillCard) {
                // Обновляем только данную карточку
                skillCard.updateAfterPurchase();
                
                // Обновляем состояние кнопок всех карточек, так как эмблемы изменились
                this.updateAllButtonStates();
                
                // Обновляем счетчик эмблем в заголовке магазина
                this.scene.events.emit('updateEmblems');
            }
        }
    }
    
    public handleResize(gameScale: number): void {
        // Пересоздаем список с текущими навыками
        // В реальном приложении необходимо сохранить текущий список навыков
        // и просто обновить его с новыми размерами
        const { width, height } = this.screenManager.getScreenSize();
        const padding = this.screenManager.getResponsivePadding(12);
        const buttonHeight = this.screenManager.getResponsivePadding(70);
        const startY = height * 0.25;
        const spacing = buttonHeight + padding;
        const center = this.screenManager.getScreenCenter();
        
        // Обновляем позиции существующих карточек
        this.skillCards.forEach((card, index) => {
            // Удаляем старые объекты
            card.destroy();
            
            // Обновляем координаты
            card.setPosition(center.x, startY + (index * spacing));
            
            // Пересоздаем карточку на новой позиции
            card.create();
        });
        
        // Обновляем сообщение о пустой категории, если оно есть
        if (this.noSkillsText && this.noSkillsText.active) {
            this.noSkillsText.destroy();
            this.noSkillsText = this.screenManager.createText(
                center.x,
                startY + spacing * 2,
                'No upgrades available in this category',
                this.screenManager.getMediumFontSize(),
                '#aaaaaa',
                {
                    fontFamily: 'pixelFont'
                }
            );
        }
    }
    
    private clearSkillCards(): void {
        this.skillCards.forEach(card => card.destroy());
        this.skillCards = [];
        
        if (this.noSkillsText && this.noSkillsText.active) {
            this.noSkillsText.destroy();
            this.noSkillsText = null;
        }
    }
    
    public destroy(): void {
        this.clearSkillCards();
    }
} 
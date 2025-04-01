import { ScreenManager } from '../../managers/ScreenManager';
import { SkillInfo, SkillType } from '../../types/SkillType';
import { PermanentSkillCard } from './PermanentSkillCard';
import { PermanentSkillPurchaseService } from '../../services/PermanentSkillPurchaseService';

export class PermanentSkillList {
    private skillCards: PermanentSkillCard[] = [];
    private noSkillsText: Phaser.GameObjects.Text | null = null;
    
    constructor(
        private scene: Phaser.Scene,
        private screenManager: ScreenManager,
        private purchaseService: PermanentSkillPurchaseService
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
                const skillCard = new PermanentSkillCard(
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
    
    private handlePurchase(skillType: SkillType): void {
        // Покупаем улучшение
        const purchased = this.purchaseService.purchaseSkill(skillType);
        
        // Если успешно, обновляем интерфейс
        if (purchased) {
            // Получаем текущую категорию и перезагружаем список навыков
            const currentSkills = this.purchaseService.getUpdatedSkillList();
            this.clearSkillCards();
            this.create(currentSkills);
        }
    }
    
    public handleResize(gameScale: number): void {
        // Пересоздаем список с текущими навыками
        // В реальном приложении необходимо сохранить текущий список навыков
        // и просто обновить его с новыми размерами
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
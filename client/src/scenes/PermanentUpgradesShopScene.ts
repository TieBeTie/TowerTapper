import Phaser from 'phaser';
import AudioManager from '../managers/AudioManager';
import { IScene } from '../types/IScene';
import { ScreenManager } from '../managers/ScreenManager';
import { UIManager } from '../managers/UIManager';
import { EmblemManager } from '../managers/EmblemManager';
import { UpgradeManager } from '../managers/UpgradeManager';
import { SkillType, SkillInfo } from '../types/SkillType';
import { PermanentShopFilterService } from '../services/PermanentShopFilterService';
import { PermanentSkillPurchaseService } from '../services/PermanentSkillPurchaseService';
import { PermanentShopHeader } from '../ui/permanent-shop/PermanentShopHeader';
import { PermanentShopNavigation } from '../ui/permanent-shop/PermanentShopNavigation';
import { PermanentSkillList } from '../ui/permanent-shop/PermanentSkillList';

export default class PermanentUpgradesShopScene extends Phaser.Scene implements IScene {
    private audioManager!: AudioManager;
    public screenManager!: ScreenManager;
    public uiManager!: UIManager;
    private emblemManager!: EmblemManager;
    private upgradeManager!: UpgradeManager;
    private shopFilterService!: PermanentShopFilterService;
    private skillPurchaseService!: PermanentSkillPurchaseService;
    
    // UI компоненты
    private shopHeader!: PermanentShopHeader;
    private shopNavigation!: PermanentShopNavigation;
    private skillList!: PermanentSkillList;
    
    // Кнопка возврата
    private backButton!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'PermanentUpgradesShopScene' });
    }

    preload(): void {
        // Загрузка изображения эмблемы если необходимо
        if (!this.textures.exists('emblem_icon')) {
            this.load.image('emblem_icon', 'assets/images/currency/heraldic_emblem16x16.png');
        }
    }

    create(): void {
        // Инициализация менеджеров
        this.initializeManagers();
        
        // Создание UI компонентов
        this.createUIComponents();
        
        // Создание кнопки возврата в меню
        this.createBackButton();
        
        // Подписка на события изменения размера экрана
        this.events.on('screenResize', this.handleScreenResize, this);
    }
    
    /**
     * Инициализация всех менеджеров сцены
     */
    private initializeManagers(): void {
        // Initialize ScreenManager
        this.screenManager = new ScreenManager(this);
        
        // Получить менеджер эмблем
        this.emblemManager = EmblemManager.getInstance();
        
        // Инициализировать менеджер улучшений
        this.upgradeManager = new UpgradeManager(this);
        
        // Инициализировать сервис фильтрации
        this.shopFilterService = new PermanentShopFilterService();
        
        try {
            // Initialize AudioManager
            this.audioManager = AudioManager.getInstance(this);
        } catch (err) {
            console.error('Error setting up audio in PermanentUpgradesShopScene:', err);
        }
        
        // Инициализировать сервис покупки навыков
        this.skillPurchaseService = new PermanentSkillPurchaseService(
            this.upgradeManager,
            this.emblemManager,
            this.audioManager,
            this
        );

        // Create background using ScreenManager
        this.screenManager.setupBackground();
    }
    
    /**
     * Создание UI компонентов
     */
    private createUIComponents(): void {
        // Создаем заголовок магазина и счетчик эмблем
        this.shopHeader = new PermanentShopHeader(
            this,
            this.screenManager,
            this.emblemManager
        );
        this.shopHeader.create();
        
        // Создаем навигацию по категориям
        this.shopNavigation = new PermanentShopNavigation(
            this,
            this.screenManager,
            this.audioManager,
            this.shopFilterService
        );
        this.shopNavigation.create();
        
        // Создаем список навыков
        this.skillList = new PermanentSkillList(
            this,
            this.screenManager,
            this.skillPurchaseService
        );
        
        // Загружаем навыки текущей категории
        this.loadSkillsForCurrentCategory();
        
        // Устанавливаем колбэк для обновления списка при смене категории
        this.shopNavigation.setOnCategoryChangeCallback(() => {
            this.loadSkillsForCurrentCategory();
        });
    }
    
    /**
     * Загрузка и отображение навыков для текущей выбранной категории
     */
    private loadSkillsForCurrentCategory(): void {
        const currentCategory = this.shopFilterService.getCurrentCategory();
        const filteredSkills = this.shopFilterService.filterSkillsByCategory(
            this.upgradeManager.getAvailableSkills(),
            currentCategory
        );
        
        // Отображаем навыки
        this.skillList.create(filteredSkills);
    }
    
    /**
     * Создание кнопки возврата в меню
     */
    private createBackButton(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        const backButtonFontSize = this.screenManager.getResponsiveFontSize(36);
        
        this.backButton = this.screenManager.createText(
            center.x, 
            height * 0.9, 
            'Back to Menu',
            backButtonFontSize,
            '#ffffff',
            {
                fontFamily: 'pixelFont'
            }
        );

        // Add interactivity to back button
        this.backButton.setInteractive()
            .on('pointerover', () => {
                this.backButton.setScale(1.1);
            })
            .on('pointerout', () => {
                this.backButton.setScale(1);
            })
            .on('pointerdown', () => {
                try {
                    // Play sound if available
                    if (this.audioManager.hasSoundCached('playButton')) {
                        this.audioManager.playSound('playButton');
                    }
                } catch (err) {
                    console.error('Error playing audio on button click:', err);
                }
                
                this.returnToMenu();
            });
    }
    
    /**
     * Обработка изменения размера экрана
     */
    private handleScreenResize(gameScale: number): void {
        // Обновляем компоненты UI
        this.shopHeader.handleResize(gameScale);
        this.shopNavigation.handleResize(gameScale);
        this.skillList.handleResize(gameScale);
        
        // Обновляем кнопку возврата
        if (this.backButton) {
            const { width, height } = this.screenManager.getScreenSize();
            const center = this.screenManager.getScreenCenter();
            const backButtonFontSize = this.screenManager.getResponsiveFontSize(36);
            
            this.backButton.setFontSize(backButtonFontSize);
            this.backButton.setPosition(center.x, height * 0.9);
        }
    }
    
    /**
     * Обновление данных (вызывается на каждом кадре)
     */
    update(time: number, delta: number): void {
        // Update logic here if needed
    }
    
    /**
     * Возврат в главное меню
     */
    private returnToMenu(): void {
        // Остановим звуки если необходимо
        if (this.audioManager) {
            try {
                this.audioManager.stopMusic();
            } catch (err) {
                console.error('Error stopping sounds:', err);
            }
        }
        
        // Отключаем все обработчики событий
        this.events.off('screenResize', this.handleScreenResize, this);
        
        // Уничтожаем компоненты UI
        this.destroyUIComponents();
        
        // Сначала завершаем текущую сцену полностью
        this.scene.stop('PermanentUpgradesShopScene');
        
        // Перезапускаем главное меню с правильным названием
        this.scene.start('MenuScene');
    }
    
    /**
     * Уничтожение UI компонентов
     */
    private destroyUIComponents(): void {
        if (this.shopHeader) {
            this.shopHeader.destroy();
        }
        
        if (this.shopNavigation) {
            this.shopNavigation.destroy();
        }
        
        if (this.skillList) {
            this.skillList.destroy();
        }
        
        // Удаляем кнопку возврата
        if (this.backButton) {
            this.backButton.destroy();
        }
    }
    
    /**
     * Завершение работы сцены (без полного уничтожения)
     */
    shutdown(): void {
        // Clean up when scene is shutdown
        this.events.off('screenResize', this.handleScreenResize, this);
        
        // Очищаем интерактивность кнопки возврата
        if (this.backButton) {
            this.backButton.removeAllListeners();
        }
    }
    
    /**
     * Полное уничтожение сцены
     */
    destroy(): void {
        // Clean up when scene is destroyed
        this.events.off('screenResize', this.handleScreenResize, this);
        
        // Уничтожаем компоненты UI
        this.destroyUIComponents();
    }
} 
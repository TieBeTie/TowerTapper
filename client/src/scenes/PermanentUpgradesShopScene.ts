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
    
    // Фоновые эффекты
    private backgroundEffects: Phaser.GameObjects.GameObject[] = [];

    constructor() {
        super({ key: 'PermanentUpgradesShopScene' });
    }

    preload(): void {
        // Загрузка изображения эмблемы если необходимо
        if (!this.textures.exists('emblem_icon')) {
            this.load.image('emblem_icon', 'assets/images/currency/heraldic_emblem16x16.png');
        }
        
        // Загрузка текстур для фоновых эффектов
        if (!this.textures.exists('particle')) {
            this.load.image('particle', 'assets/images/particle.png');
        }
    }

    create(): void {
        // Инициализация менеджеров
        this.initializeManagers();
        
        // Создание фоновых эффектов
        this.createBackgroundEffects();
        
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
     * Создание фоновых эффектов
     */
    private createBackgroundEffects(): void {
        const { width, height } = this.screenManager.getScreenSize();
        
        // Создаем полупрозрачный градиентный фон
        const bgGraphics = this.add.graphics();
        
        // Вместо градиента используем заполнение цветом
        bgGraphics.fillStyle(0x10102a, 1);
        bgGraphics.fillRect(0, 0, width, height);
        bgGraphics.setDepth(-10);
        this.backgroundEffects.push(bgGraphics);
        
        // Создаем эффект мерцающих частиц, если текстура доступна
        if (this.textures.exists('particle')) {
            try {
                // Верхний эмиттер (медленные плавающие частицы)
                const particleEmitter = this.add.particles(width / 2, height / 2, 'particle', {
                    x: { min: -width / 2, max: width / 2 },
                    y: { min: -height / 2, max: height / 2 },
                    scale: { start: 0.2, end: 0.1 },
                    alpha: { start: 0.3, end: 0 },
                    speed: 10,
                    angle: { min: 0, max: 360 },
                    lifespan: 10000,
                    gravityY: -5,
                    frequency: 500,
                    blendMode: Phaser.BlendModes.ADD,
                    emitting: true
                });
                particleEmitter.setDepth(-5);
                this.backgroundEffects.push(particleEmitter);
                
                // Нижний эмиттер (восходящие частицы)
                const bottomEmitter = this.add.particles(width / 2, height + 10, 'particle', {
                    x: { min: -width / 2, max: width / 2 },
                    y: 0,
                    scale: { start: 0.1, end: 0 },
                    alpha: { start: 0.2, end: 0 },
                    speed: { min: 20, max: 40 },
                    angle: { min: 260, max: 280 },
                    lifespan: 5000,
                    frequency: 200,
                    blendMode: Phaser.BlendModes.ADD,
                    emitting: true
                });
                bottomEmitter.setDepth(-6);
                this.backgroundEffects.push(bottomEmitter);
            } catch (err) {
                console.error('Error creating particle effects:', err);
            }
        }
        
        // Добавляем эффект "световых лучей"
        try {
            const raysGraphics = this.add.graphics();
            raysGraphics.setDepth(-7);
            
            // Создаем световые лучи
            const createRays = () => {
                raysGraphics.clear();
                
                for (let i = 0; i < 5; i++) {
                    const startX = Phaser.Math.Between(0, width);
                    const angle = Phaser.Math.Between(-30, 30);
                    const rayLength = Phaser.Math.Between(height * 0.5, height * 0.8);
                    const alpha = Phaser.Math.FloatBetween(0.05, 0.1);
                    const rayWidth = Phaser.Math.Between(50, 150);
                    
                    raysGraphics.fillStyle(0xffffff, alpha);
                    raysGraphics.fillTriangle(
                        startX, 0,
                        startX + rayWidth/2, rayLength,
                        startX - rayWidth/2, rayLength
                    );
                }
            };
            
            // Первоначальное создание лучей
            createRays();
            
            // Обновление лучей через интервал
            this.time.addEvent({
                delay: 10000,
                callback: createRays,
                loop: true
            });
            
            // Анимация альфа-прозрачности для лучей
            this.tweens.add({
                targets: raysGraphics,
                alpha: { from: 1, to: 0.3 },
                duration: 5000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            
            this.backgroundEffects.push(raysGraphics);
        } catch (err) {
            console.error('Error creating rays effect:', err);
        }
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
        
        // Добавляем слушатель события обновления эмблем
        this.events.on('updateEmblems', () => {
            this.shopHeader.updateEmblemCount();
            
            // Также обновляем состояние кнопок магазина при изменении количества эмблем
            this.updateShopUIAfterEmblemChange();
        });
        
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
        
        // Инициируем первоначальное обновление эмблем, чтобы кнопки правильно отобразились
        this.events.emit('updateEmblems', this.emblemManager.getEmblemCount());
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
     * Обновляет UI магазина после изменения количества эмблем
     * Используется для обновления состояния кнопок покупки
     */
    private updateShopUIAfterEmblemChange(): void {
        // Вместо полного пересоздания списка просто обновляем состояние кнопок
        if (this.skillList) {
            this.skillList.updateAllButtonStates();
        }
    }
    
    /**
     * Создание кнопки возврата в меню
     */
    private createBackButton(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        const backButtonFontSize = this.screenManager.getSmallFontSize() - 8;
        
        // Создаем контейнер для кнопки для анимаций
        const buttonContainer = this.add.container(center.x, height * 0.9);
        
        // Создаем фон кнопки для улучшенного вида с уменьшенными размерами
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonBg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x444444, 0.7)
            .setStrokeStyle(2, 0xffffff, 0.8)
            .setOrigin(0.5);
        
        // Скругляем углы (если поддерживается)
        try {
            buttonBg.setInteractive({ useHandCursor: true });
        } catch (err) {
            console.error('Error setting interactive rectangle:', err);
        }
        
        this.backButton = this.screenManager.createText(
            0, 
            0, 
            'Back to Menu',
            backButtonFontSize,
            '#ffffff',
            {
                fontFamily: 'pixelFont',
                shadow: { color: '#000000', blur: 3, offsetX: 1, offsetY: 1, fill: true }
            }
        );
        
        // Добавляем элементы в контейнер
        buttonContainer.add([buttonBg, this.backButton]);
        
        // Добавляем свечение вокруг кнопки
        const glowFx = this.add.graphics()
            .fillStyle(0xffffff, 0.2)
            .fillRoundedRect(-buttonWidth/2 - 5, -buttonHeight/2 - 5, buttonWidth + 10, buttonHeight + 10, 16);
        buttonContainer.add(glowFx);
        glowFx.setBlendMode(Phaser.BlendModes.ADD);
        
        // Добавляем анимацию свечения
        this.tweens.add({
            targets: glowFx,
            alpha: { from: 0.2, to: 0.6 },
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Анимация появления кнопки
        buttonContainer.setScale(0.9);
        buttonContainer.setAlpha(0);
        this.tweens.add({
            targets: buttonContainer,
            alpha: 1,
            scale: 1,
            ease: 'Back.easeOut',
            duration: 500,
            delay: 200
        });

        // Add interactivity to back button
        buttonBg.setInteractive()
            .on('pointerover', () => {
                this.tweens.add({
                    targets: buttonContainer,
                    scale: 1.05,
                    duration: 100,
                    ease: 'Sine.easeOut'
                });
                buttonBg.fillColor = 0x666666;
            })
            .on('pointerout', () => {
                this.tweens.add({
                    targets: buttonContainer,
                    scale: 1,
                    duration: 100,
                    ease: 'Sine.easeIn'
                });
                buttonBg.fillColor = 0x444444;
            })
            .on('pointerdown', () => {
                // Анимация нажатия
                this.tweens.add({
                    targets: buttonContainer,
                    scale: 0.95,
                    duration: 50,
                    yoyo: true,
                    ease: 'Sine.easeIn'
                });
                
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
            const backButtonFontSize = this.screenManager.getResponsiveFontSize(26);
            
            this.backButton.setFontSize(backButtonFontSize);
            
            // Обновляем позицию контейнера кнопки
            if (this.backButton.parentContainer) {
                this.backButton.parentContainer.setPosition(center.x, height * 0.9);
            }
        }
        
        // Обновляем фоновые эффекты
        this.updateBackgroundEffects();
    }
    
    /**
     * Обновление фоновых эффектов при изменении размера экрана
     */
    private updateBackgroundEffects(): void {
        // Уничтожаем старые эффекты
        this.backgroundEffects.forEach(effect => {
            if (effect.active) {
                effect.destroy();
            }
        });
        this.backgroundEffects = [];
        
        // Создаем новые эффекты с учетом нового размера
        this.createBackgroundEffects();
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
            // Если кнопка находится в контейнере, удаляем весь контейнер
            if (this.backButton.parentContainer) {
                this.backButton.parentContainer.destroy();
            } else {
                this.backButton.destroy();
            }
        }
        
        // Удаляем фоновые эффекты
        this.backgroundEffects.forEach(effect => {
            if (effect && effect.active) {
                effect.destroy();
            }
        });
        this.backgroundEffects = [];
        
        // Удаляем обработчики событий
        this.events.off('updateEmblems');
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
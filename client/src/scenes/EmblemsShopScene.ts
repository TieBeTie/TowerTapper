import Phaser from 'phaser';
import { ScreenManager } from '../managers/ScreenManager';
import { IScene } from '../types/IScene';
import AudioManager from '../managers/AudioManager';
import { EmblemManager } from '../managers/EmblemManager';
import { TelegramService } from '../services/TelegramService';

interface EmblemPackage {
    amount: number;
    starsCost: number;
    description: string;
}

export default class EmblemsShopScene extends Phaser.Scene implements IScene {
    public screenManager!: ScreenManager;
    public uiManager?: undefined; // Make uiManager optional as defined in IScene
    private audioManager!: AudioManager;
    private emblemManager!: EmblemManager;
    private telegramService!: TelegramService;
    private isProcessingPayment: boolean = false;
    
    // Фон со звездами
    private stars: Phaser.GameObjects.Particles.ParticleEmitter = null as any;
    private backgroundStars: Phaser.GameObjects.TileSprite | null = null;
    private glowEffect: Phaser.GameObjects.Sprite | null = null;
    private staticStars: Phaser.GameObjects.Group | null = null;
    private blackBackground: Phaser.GameObjects.Graphics | null = null;
    
    // Define emblem packages
    private readonly emblemPackages: EmblemPackage[] = [
        { amount: 10, starsCost: 5, description: "Small Pack" },
        { amount: 25, starsCost: 10, description: "Medium Pack" }, 
        { amount: 60, starsCost: 20, description: "Large Pack" },
        { amount: 150, starsCost: 40, description: "Mega Pack" }
    ];

    constructor() {
        super({ key: 'EmblemsShopScene' });
    }

    preload(): void {
        // Загружаем текстуры для звезд, если они еще не загружены
        if (!this.textures.exists('star')) {
            this.load.image('star', 'assets/images/star.png');
        }
        if (!this.textures.exists('starfield')) {
            this.load.image('starfield', 'assets/images/starfield.png');
        }
        if (!this.textures.exists('glow')) {
            this.load.image('glow', 'assets/images/glow.png');
        }
    }

    create(): void {
        // Immediately create a black background to prevent white flash
        const { width, height } = this.scale;
        this.blackBackground = this.add.graphics();
        this.blackBackground.fillStyle(0x000000, 1);
        this.blackBackground.fillRect(0, 0, width, height);
        this.blackBackground.setDepth(-1);
        
        // Initialize managers
        this.screenManager = new ScreenManager(this);
        this.audioManager = AudioManager.getInstance(this);
        this.emblemManager = EmblemManager.getInstance();
        this.telegramService = TelegramService.getInstance();
        
        // Расширенная диагностика WebApp API
        const version = this.telegramService.getWebAppVersion();
        const platform = this.telegramService.getPlatform();
        const versionText = `TG: ${version} (${platform})`;
        
        // Проверка наличия Stars API и детали о нем
        const webApp = window.Telegram?.WebApp;
        const hasStarsApi = typeof webApp?.requestStars === 'function';
        const apiStatus = hasStarsApi ? '✓' : '✗';
        
        // Детальный вывод методов WebApp в консоль
        console.log('[DEBUG] 🔹 Версия WebApp:', version);
        console.log('[DEBUG] 🔹 Платформа:', platform);
        console.log('[DEBUG] 🔹 Stars API доступен:', hasStarsApi);
        
        if (webApp) {
            console.log('[DEBUG] 🔹 Все свойства и методы WebApp:');
            // Вывод всех свойств и методов с их типами
            const methods: Record<string, string> = {};
            for (const key in webApp) {
                if (Object.prototype.hasOwnProperty.call(webApp, key)) {
                    const propType = typeof (webApp as any)[key];
                    methods[key] = propType;
                    console.log(`[DEBUG] 🔹 - ${key}: ${propType}${propType === 'function' ? ' ✓' : ''}`);
                    
                    // Дополнительная проверка методов, связанных с платежами
                    if (key.toLowerCase().includes('star') || key.toLowerCase().includes('payment') || key.toLowerCase().includes('buy')) {
                        console.log(`[DEBUG] 🔹 -- Детали метода ${key}:`, (webApp as any)[key]);
                    }
                }
            }
            
            // Проверка вложенных объектов
            if (webApp.MainButton) {
                console.log('[DEBUG] 🔹 MainButton методы:');
                for (const key in webApp.MainButton) {
                    if (Object.prototype.hasOwnProperty.call(webApp.MainButton, key)) {
                        console.log(`[DEBUG] 🔹 -- ${key}: ${typeof (webApp.MainButton as any)[key]}`);
                    }
                }
            }
            
            // Проверка requestStars подробнее
            if (hasStarsApi && webApp.requestStars) {
                try {
                    console.log('[DEBUG] 🔹 requestStars сигнатура:', webApp.requestStars.toString().substring(0, 100) + '...');
                } catch (e) {
                    console.log('[DEBUG] 🔹 Не удалось получить сигнатуру requestStars:', e);
                }
            } else {
                console.log('[DEBUG] 🔹 Ожидаемая сигнатура requestStars: (starCount: number, callback: (success: boolean) => void) => void');
                console.log('[DEBUG] 🔹 Проверка наличия других методов для работы со Stars:');
                const possibleStarsMethods = ['requestStars', 'buyStars', 'purchaseStars', 'getStars', 'showStars'];
                possibleStarsMethods.forEach(method => {
                    console.log(`[DEBUG] 🔹 -- ${method}: ${typeof (webApp as any)[method] === 'function' ? '✓' : '✗'}`);
                });
            }
        }
        
        // Create animated background
        this.createAnimatedBackground();
        
        // Setup UI elements
        this.setupUI();
        
        // Subscribe to resize events
        this.events.on('screenResize', this.handleScreenResize, this);
        
        // Добавляем информацию о версии и API в углу экрана
        const apiInfoText = `${versionText} | Stars API: ${apiStatus}`;
        this.add.text(
            5, 
            height - 15,
            apiInfoText,
            { fontFamily: 'Arial', fontSize: 10, color: '#777777' }
        ).setOrigin(0, 0.5).setAlpha(0.7);
        
        // Добавляем текст с доступными методами в меньшем размере
        if (webApp) {
            const availableMethods = Object.keys(webApp)
                .filter(key => typeof (webApp as any)[key] === 'function')
                .slice(0, 10) // Ограничиваем до 10 методов
                .join(', ');
            
            this.add.text(
                5,
                height - 30,
                `Методы: ${availableMethods}${Object.keys(webApp).length > 10 ? '...' : ''}`,
                { fontFamily: 'Arial', fontSize: 8, color: '#555555' }
            ).setOrigin(0, 0.5).setAlpha(0.6);
        }
    }
    
    private createAnimatedBackground(): void {
        const { width, height } = this.screenManager.getScreenSize();
        
        // Добавляем темный фон со звездами
        try {
            // Если текстура существует, используем ее
            if (this.textures.exists('starfield')) {
                this.backgroundStars = this.add.tileSprite(0, 0, width, height, 'starfield')
                    .setOrigin(0, 0)
                    .setAlpha(0.5)
                    .setDepth(0);
            } else {
                // Если текстуры нет, создаем черный фон
                const bg = this.add.graphics();
                bg.fillStyle(0x000022, 1);
                bg.fillRect(0, 0, width, height);
                bg.setDepth(0);
            }
            
            // Создаем группу для статических звезд
            this.staticStars = this.add.group();
            
            // Добавляем статические звездочки на фон
            for (let i = 0; i < 50; i++) {
                const x = Phaser.Math.Between(0, width);
                const y = Phaser.Math.Between(0, height);
                const size = Phaser.Math.FloatBetween(0.5, 1.2);
                const alpha = Phaser.Math.FloatBetween(0.5, 1);
                
                // Если есть текстура звезды, используем ее
                if (this.textures.exists('star')) {
                    const star = this.add.image(x, y, 'star')
                        .setScale(size)
                        .setAlpha(alpha)
                        .setDepth(1);
                    
                    // Добавляем вращение для некоторых звезд
                    if (Phaser.Math.Between(0, 10) > 7) {
                        this.tweens.add({
                            targets: star,
                            angle: 360,
                            duration: Phaser.Math.Between(10000, 20000),
                            repeat: -1,
                            ease: 'Linear'
                        });
                    }
                    
                    // Добавляем мерцание
                    this.tweens.add({
                        targets: star,
                        alpha: { from: alpha, to: Phaser.Math.FloatBetween(0.2, 0.6) },
                        scale: { from: size, to: size * 1.2 },
                        duration: Phaser.Math.Between(1000, 3000),
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                    
                    this.staticStars.add(star);
                } else {
                    // Если нет текстуры, создаем звезду из графики
                    const star = this.createStarShape(x, y, size * 15, 0xFFFFFF, alpha);
                    this.staticStars.add(star);
                    
                    // Добавляем мерцание
                    this.tweens.add({
                        targets: star,
                        alpha: { from: alpha, to: Phaser.Math.FloatBetween(0.2, 0.6) },
                        scale: { from: 1, to: 1.2 },
                        duration: Phaser.Math.Between(1000, 3000),
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            }
            
            // Добавляем большие яркие звезды
            for (let i = 0; i < 10; i++) {
                const x = Phaser.Math.Between(0, width);
                const y = Phaser.Math.Between(0, height);
                const size = Phaser.Math.FloatBetween(1.5, 2.5);
                
                if (this.textures.exists('star')) {
                    const bigStar = this.add.image(x, y, 'star')
                        .setScale(size)
                        .setAlpha(0.8)
                        .setDepth(2)
                        .setBlendMode(Phaser.BlendModes.ADD);
                    
                    // Добавляем красивое мерцание
                    this.tweens.add({
                        targets: bigStar,
                        alpha: 0.4,
                        scale: size * 1.3,
                        duration: Phaser.Math.Between(2000, 4000),
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                    
                    // Добавляем свечение вокруг больших звезд
                    if (this.textures.exists('glow')) {
                        const glow = this.add.sprite(x, y, 'glow')
                            .setScale(size * 0.8)
                            .setAlpha(0.2)
                            .setBlendMode(Phaser.BlendModes.ADD)
                            .setDepth(1);
                        
                        this.tweens.add({
                            targets: glow,
                            alpha: 0.1,
                            scale: size,
                            duration: Phaser.Math.Between(2000, 4000),
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
                        
                        this.staticStars.add(glow);
                    }
                    
                    this.staticStars.add(bigStar);
                } else {
                    // Создаем большую звезду из графики
                    const bigStar = this.createStarShape(x, y, size * 20, 0xFFFFFF, 0.8);
                    this.staticStars.add(bigStar);
                    
                    // Добавляем мерцание
                    this.tweens.add({
                        targets: bigStar,
                        alpha: 0.4,
                        scale: 1.3,
                        duration: Phaser.Math.Between(2000, 4000),
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            }
            
            // Добавляем свечение в центре
            const center = this.screenManager.getScreenCenter();
            if (this.textures.exists('glow')) {
                this.glowEffect = this.add.sprite(center.x, center.y, 'glow')
                    .setScale(2)
                    .setAlpha(0.2)
                    .setBlendMode(Phaser.BlendModes.ADD)
                    .setDepth(1);
                
                // Анимируем свечение
                this.tweens.add({
                    targets: this.glowEffect,
                    scale: 2.2,
                    alpha: 0.3,
                    duration: 3000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
            
            // Создаем эффект падающих звезд, если текстура доступна
            if (this.textures.exists('star')) {
                // Создаем эмиттер для падающих звезд
                const particleManager = this.add.particles(0, 0, 'star', {
                    x: { min: 0, max: width },
                    y: 0,
                    lifespan: 3000,
                    speedY: { min: 50, max: 100 },
                    scale: { start: 0.3, end: 0.1 },
                    alpha: { start: 1, end: 0 },
                    quantity: 1,
                    frequency: 5000,
                    blendMode: 'ADD'
                });
                
                particleManager.setDepth(2);
            }
        } catch (error) {
            console.error('Error creating background:', error);
        }
    }
    
    private setupUI(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        const gameScale = this.screenManager.getGameScale();
        
        // Добавляем красивое свечение за заголовком
        const titleGlow = this.add.graphics();
        titleGlow.fillStyle(0x9370DB, 0.3);
        titleGlow.fillRoundedRect(center.x - width * 0.4, height * 0.05, width * 0.8, height * 0.12, 15);
        titleGlow.setDepth(5);
        
        // Add title with glow effect
        const titleFontSize = this.screenManager.getLargeFontSize() * 0.9;
        const title = this.screenManager.createText(
            center.x,
            height * 0.1,
            '✨ Emblems Shop ✨',
            titleFontSize,
            '#FFFFFF'
        ).setDepth(10);
        
        // Add title shadow
        title.setShadow(3, 3, '#9370DB', 5, true, true);
        
        // Add current emblems count with icon
        const currentEmblemsFontSize = this.screenManager.getMediumFontSize();
        
        // Создаем контейнер для счетчика эмблем
        const emblemCountContainer = this.add.container(center.x, height * 0.2).setDepth(10);
        
        // Добавляем иконку эмблемы
        if (this.textures.exists('emblem')) {
            const emblemIcon = this.add.sprite(-currentEmblemsFontSize * 2, 0, 'emblem')
                .setScale(0.4 * gameScale);
            emblemCountContainer.add(emblemIcon);
            
            // Анимация иконки
            this.tweens.add({
                targets: emblemIcon,
                y: -5,
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        // Добавляем текст с количеством эмблем
        const currentEmblemsText = this.screenManager.createText(
            0,
            0,
            `${this.emblemManager.getEmblemCount()} Emblems`,
            currentEmblemsFontSize,
            '#FFCC00'
        );
        emblemCountContainer.add(currentEmblemsText);
        
        // Add packages
        this.createPackageButtons();
        
        // Add back button with improved style
        const backButtonSize = this.screenManager.getSmallFontSize() - 8;
        
        // Создаем фон для кнопки
        const buttonWidth = width * 0.4;
        const buttonHeight = height * 0.08;
        const buttonGraphics = this.add.graphics();
        buttonGraphics.fillStyle(0x4B0082, 0.7);
        buttonGraphics.fillRoundedRect(center.x - buttonWidth/2, height * 0.9 - buttonHeight/2, buttonWidth, buttonHeight, 10);
        buttonGraphics.lineStyle(2, 0xFFCC00, 1);
        buttonGraphics.strokeRoundedRect(center.x - buttonWidth/2, height * 0.9 - buttonHeight/2, buttonWidth, buttonHeight, 10);
        buttonGraphics.setDepth(8);
        
        const backButton = this.screenManager.createText(
            center.x,
            height * 0.9,
            'Back to Menu',
            backButtonSize,
            '#FFFFFF'
        ).setDepth(10);
        
        // Make button interactive
        buttonGraphics.setInteractive(
            new Phaser.Geom.Rectangle(center.x - buttonWidth/2, height * 0.9 - buttonHeight/2, buttonWidth, buttonHeight),
            Phaser.Geom.Rectangle.Contains
        ).on('pointerover', () => {
            buttonGraphics.clear();
            buttonGraphics.fillStyle(0x6A0DAD, 0.8);
            buttonGraphics.fillRoundedRect(center.x - buttonWidth/2, height * 0.9 - buttonHeight/2, buttonWidth, buttonHeight, 10);
            buttonGraphics.lineStyle(2, 0xFFCC00, 1);
            buttonGraphics.strokeRoundedRect(center.x - buttonWidth/2, height * 0.9 - buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            backButton.setScale(1.05);
        }).on('pointerout', () => {
            buttonGraphics.clear();
            buttonGraphics.fillStyle(0x4B0082, 0.7);
            buttonGraphics.fillRoundedRect(center.x - buttonWidth/2, height * 0.9 - buttonHeight/2, buttonWidth, buttonHeight, 10);
            buttonGraphics.lineStyle(2, 0xFFCC00, 1);
            buttonGraphics.strokeRoundedRect(center.x - buttonWidth/2, height * 0.9 - buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            backButton.setScale(1);
        }).on('pointerdown', () => {
            if (this.audioManager.hasSoundCached('playButton')) {
                this.audioManager.playSound('playButton');
            }
            
            // Эффект нажатия
            this.tweens.add({
                targets: backButton,
                scale: 0.95,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.scene.start('MenuScene');
                }
            });
        });
    }
    
    private createPackageButtons(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        
        // Calculate the starting Y position
        const startY = height * 0.32;
        const spacing = height * 0.15;
        
        // Create a container for each package
        this.emblemPackages.forEach((pack, index) => {
            const packageY = startY + index * spacing;
            
            // Create container with background
            const containerWidth = width * 0.85;
            const containerHeight = height * 0.12;
            
            const container = this.add.container(center.x, packageY).setDepth(10);
            
            // Glowing background for package
            const innerGlow = this.add.graphics().setDepth(1);
            innerGlow.fillStyle(0x6A0DAD, 0.4);
            innerGlow.fillRoundedRect(-containerWidth/2 - 5, -containerHeight/2 - 5, containerWidth + 10, containerHeight + 10, 20);
            container.add(innerGlow);
            
            // Background with border
            const background = this.add.graphics().setDepth(2);
            background.fillStyle(0x333366, 0.8);
            background.fillRoundedRect(-containerWidth/2, -containerHeight/2, containerWidth, containerHeight, 15);
            
            background.lineStyle(3, 0xFFCC00, 1);
            background.strokeRoundedRect(-containerWidth/2, -containerHeight/2, containerWidth, containerHeight, 15);
            
            container.add(background);
            
            // Add emblem icon on the left with animation
            const emblemIcon = this.add.sprite(-containerWidth * 0.35, 0, 'emblem')
                .setScale(0.5 * this.screenManager.getGameScale())
                .setDepth(3);
            
            // If emblem texture is not loaded, use a circle instead
            if (!this.textures.exists('emblem')) {
                const circleGraphic = this.add.graphics();
                circleGraphic.fillStyle(0xFFCC00, 1);
                circleGraphic.fillCircle(-containerWidth * 0.35, 0, 25 * this.screenManager.getGameScale());
                container.add(circleGraphic);
            } else {
                container.add(emblemIcon);
                
                // Animate emblem icon
                this.tweens.add({
                    targets: emblemIcon,
                    angle: 360,
                    duration: 10000 + index * 2000,
                    repeat: -1,
                    ease: 'Linear'
                });
            }
            
            // Add package info text
            const fontSize = this.screenManager.getResponsiveFontSize(26);
            
            // Добавляем свечение за текстом количества эмблем
            const amountGlow = this.add.graphics();
            amountGlow.fillStyle(0xFFFFFF, 0.1);
            amountGlow.fillRoundedRect(-containerWidth * 0.2 - 10, -fontSize - 5, containerWidth * 0.3, fontSize * 1.3, 8);
            container.add(amountGlow);
            
            const packageText = this.add.text(
                -containerWidth * 0.2,
                -fontSize * 0.6,
                `${pack.amount} Emblems`,
                { fontFamily: 'pixelFont', fontSize: fontSize, color: '#FFFFFF' }
            ).setOrigin(0, 0.5).setShadow(2, 2, '#000000', 3, true);
            
            const descriptionText = this.add.text(
                -containerWidth * 0.2,
                fontSize * 0.6,
                pack.description,
                { fontFamily: 'pixelFont', fontSize: fontSize * 0.8, color: '#CCCCCC' }
            ).setOrigin(0, 0.5).setShadow(1, 1, '#000000', 2);
            
            container.add(packageText);
            container.add(descriptionText);
            
            // Add price on the right with star icon
            const starIcon = this.add.text(
                containerWidth * 0.25 - 40,
                0,
                '⭐',
                { fontFamily: 'Arial', fontSize: fontSize * 1.2 }
            ).setOrigin(0.5);
            container.add(starIcon);
            
            // Animate star icon
            this.tweens.add({
                targets: starIcon,
                scale: 1.2,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            const priceText = this.add.text(
                containerWidth * 0.25 + 10,
                0,
                `${pack.starsCost}`,
                { fontFamily: 'pixelFont', fontSize: fontSize, color: '#FFCC00' }
            ).setOrigin(0, 0.5).setShadow(2, 2, '#000000', 3, true);
            
            container.add(priceText);
            
            // Make the container interactive with improved effects
            background.setInteractive(
                new Phaser.Geom.Rectangle(-containerWidth/2, -containerHeight/2, containerWidth, containerHeight),
                Phaser.Geom.Rectangle.Contains
            ).on('pointerover', () => {
                background.clear();
                background.fillStyle(0x4B0082, 0.9);
                background.fillRoundedRect(-containerWidth/2, -containerHeight/2, containerWidth, containerHeight, 15);
                background.lineStyle(3, 0xFFCC00, 1);
                background.strokeRoundedRect(-containerWidth/2, -containerHeight/2, containerWidth, containerHeight, 15);
                
                // Увеличиваем контейнер при наведении
                container.setScale(1.02);
                
                // Анимируем иконку
                if (emblemIcon) {
                    this.tweens.add({
                        targets: emblemIcon,
                        scale: 0.55 * this.screenManager.getGameScale(),
                        duration: 200
                    });
                }
            }).on('pointerout', () => {
                background.clear();
                background.fillStyle(0x333366, 0.8);
                background.fillRoundedRect(-containerWidth/2, -containerHeight/2, containerWidth, containerHeight, 15);
                background.lineStyle(3, 0xFFCC00, 1);
                background.strokeRoundedRect(-containerWidth/2, -containerHeight/2, containerWidth, containerHeight, 15);
                
                // Возвращаем нормальный размер
                container.setScale(1);
                
                // Возвращаем нормальный размер иконки
                if (emblemIcon) {
                    this.tweens.add({
                        targets: emblemIcon,
                        scale: 0.5 * this.screenManager.getGameScale(),
                        duration: 200
                    });
                }
            }).on('pointerdown', () => {
                this.purchaseEmblems(pack);
                
                // Эффект нажатия
                this.tweens.add({
                    targets: container,
                    scale: 0.98,
                    duration: 100,
                    yoyo: true
                });
            });
        });
    }
    
    private async purchaseEmblems(pack: EmblemPackage): Promise<void> {
        // Prevent multiple purchases at once
        if (this.isProcessingPayment) {
            console.log("[DEBUG] 🔶 Покупка уже в процессе, предотвращаем повторную");
            return;
        }
        this.isProcessingPayment = true;
        
        console.log(`[DEBUG] 🔶 Начало покупки пакета: ${pack.amount} эмблем за ${pack.starsCost} звезд`);
        console.log(`[DEBUG] 🔶 Отладочная информация WebApp:`);
        console.log(`[DEBUG] 🔶 - Версия: ${this.telegramService.getWebAppVersion()}`);
        console.log(`[DEBUG] 🔶 - Платформа: ${this.telegramService.getPlatform()}`);
        console.log(`[DEBUG] 🔶 - Цветовая схема: ${this.telegramService.getColorScheme()}`);
        
        try {
            // Play button sound
            if (this.audioManager.hasSoundCached('playButton')) {
                this.audioManager.playSound('playButton');
                console.log("[DEBUG] 🔶 Проигран звук кнопки");
            }
            
            // Only proceed if running in Telegram
            if (!this.telegramService.isTelegramWebApp()) {
                console.log("[DEBUG] 🔶 Не в Telegram WebApp - добавляем эмблемы для тестирования");
                // If not in Telegram, just add emblems for testing
                this.emblemManager.addEmblems(pack.amount);
                this.showSuccessMessage(pack.amount);
                this.showDebugMessage("Тестовая покупка: эмблемы добавлены без оплаты");
                this.isProcessingPayment = false;
                return;
            }
            
            // Create loading indicator
            const { width, height } = this.screenManager.getScreenSize();
            const center = this.screenManager.getScreenCenter();
            const loadingText = this.add.text(center.x, center.y, 'Обработка платежа...', {
                fontFamily: 'pixelFont',
                fontSize: this.screenManager.getResponsiveFontSize(24),
                color: '#ffffff'
            }).setOrigin(0.5).setDepth(100);
            
            console.log("[DEBUG] 🔶 Показан индикатор загрузки, начинаем обработку платежа");
            this.showDebugMessage("Начало обработки Stars...");
            
            // Process payment through Telegram using direct Stars API
            let success = false;
            
            try {
                // Прямой вызов Stars API
                console.log("[DEBUG] 🔶 Вызываем Stars API напрямую");
                this.showDebugMessage("Запрос Stars API...");
                success = await this.telegramService.purchaseEmblems(pack.amount, pack.starsCost);
                console.log(`[DEBUG] 🔶 Результат Stars API: ${success ? "Успешно" : "Отклонено"}`);
            } catch (error) {
                console.error('[ERROR] ❌ Непредвиденная ошибка при покупке:', error);
                const errorMsg = error instanceof Error ? error.message : String(error);
                this.showDebugMessage(`Ошибка: ${errorMsg.substring(0, 30)}...`);
                throw error;
            } finally {
                // Remove loading indicator
                loadingText.destroy();
                console.log("[DEBUG] 🔶 Индикатор загрузки удален");
            }
            
            if (success) {
                console.log(`[DEBUG] 🔶 Платеж успешен, добавляем ${pack.amount} эмблем`);
                // Payment successful, add emblems
                this.emblemManager.addEmblems(pack.amount);
                
                // Play purchase sound
                if (this.audioManager.hasSoundCached('purchase_sound')) {
                    this.audioManager.playSound('purchase_sound');
                    console.log("[DEBUG] 🔶 Проигран звук успешной покупки");
                }
                
                this.showSuccessMessage(pack.amount);
                this.showDebugMessage("Покупка успешно завершена!");
            } else {
                console.log("[DEBUG] 🔶 Платеж отменен или не удался");
                this.showDebugMessage("Покупка отменена или не удалась");
            }
        } catch (error) {
            console.error('[ERROR] ❌ Ошибка при обработке покупки:', error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.telegramService.showAlert(`Ошибка при обработке платежа: ${errorMsg.substring(0, 50)}... Пожалуйста, попробуйте позже.`);
            this.showDebugMessage(`ОШИБКА: ${errorMsg.substring(0, 30)}...`);
        } finally {
            this.isProcessingPayment = false;
            console.log("[DEBUG] 🔶 Процесс покупки завершен, флаг isProcessingPayment сброшен");
        }
    }
    
    private showSuccessMessage(amount: number): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        
        // Создаем частицы звезд для эффекта
        if (this.textures.exists('star')) {
            // Создаем эмиттер для звездного взрыва
            const particleManager = this.add.particles(center.x, center.y, 'star', {
                speed: { min: 100, max: 200 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.2, end: 0 },
                blendMode: 'ADD',
                lifespan: 1000,
                gravityY: 100
            });
            
            particleManager.setDepth(100);
            
            // Остановить эмиттер через 1 секунду
            this.time.delayedCall(1000, () => {
                particleManager.destroy();
            });
        }
        
        // Create success message with improved style
        const notificationText = this.add.text(
            center.x, 
            center.y, 
            `+${amount} Emblems!`,
            { 
                fontFamily: 'pixelFont',
                fontSize: `${this.screenManager.getResponsiveFontSize(42)}px`,
                color: '#FFCC00',
                stroke: '#6A0DAD',
                strokeThickness: 6,
                shadow: {
                    offsetX: 3,
                    offsetY: 3,
                    color: '#000000',
                    blur: 5,
                    stroke: true,
                    fill: true
                }
            }
        ).setOrigin(0.5).setDepth(100).setAlpha(0);
        
        // Animation for notification
        this.tweens.add({
            targets: notificationText,
            y: center.y - 80,
            alpha: 1,
            scale: 1.2,
            duration: 1000,
            ease: 'Power2',
            onComplete: (tween, targets) => {
                this.tweens.add({
                    targets: targets,
                    alpha: 0,
                    scale: 0.8,
                    duration: 800,
                    delay: 500,
                    onComplete: (tween, targets) => {
                        targets[0].destroy();
                        
                        // Update current emblems count display
                        this.children.list.forEach(child => {
                            if (child instanceof Phaser.GameObjects.Text && 
                                child.text.includes('Emblems') && 
                                !child.text.includes('+')) {
                                child.setText(`${this.emblemManager.getEmblemCount()} Emblems`);
                            }
                        });
                    }
                });
            }
        });
    }
    
    private handleScreenResize(gameScale: number): void {
        // Пересоздаем фон и интерфейс
        if (this.stars) {
            this.stars.destroy();
            this.stars = null as any;
        }
        
        if (this.staticStars) {
            this.staticStars.clear(true, true);
            this.staticStars = null;
        }
        
        this.backgroundStars = null;
        this.glowEffect = null;
        
        // Start fresh with a new layout
        this.children.removeAll();
        
        // Re-add the black background immediately to prevent flash
        const { width, height } = this.scale;
        this.blackBackground = this.add.graphics();
        this.blackBackground.fillStyle(0x000000, 1);
        this.blackBackground.fillRect(0, 0, width, height);
        this.blackBackground.setDepth(-1);
        
        this.createAnimatedBackground();
        this.setupUI();
    }
    
    update(time: number, delta: number): void {
        // Анимируем фон со звездами
        if (this.backgroundStars) {
            this.backgroundStars.tilePositionX += 0.05;
            this.backgroundStars.tilePositionY += 0.03;
        }
    }
    
    destroy(): void {
        // Clean up event listeners
        this.events.off('screenResize', this.handleScreenResize, this);
        
        // Destroy particles
        if (this.stars) {
            this.stars.destroy();
        }
        
        if (this.staticStars) {
            this.staticStars.clear(true, true);
        }
        
        if (this.blackBackground) {
            this.blackBackground.destroy();
            this.blackBackground = null;
        }
    }
    
    /**
     * Создает звезду из графики
     */
    private createStarShape(x: number, y: number, radius: number, color: number, alpha: number): Phaser.GameObjects.Graphics {
        const starPoints = 5; // 5-конечная звезда
        const innerRadius = radius * 0.4;
        
        const star = this.add.graphics();
        star.fillStyle(color, alpha);
        
        // Рисуем звезду
        star.beginPath();
        
        const step = Math.PI / starPoints;
        
        for (let i = 0; i < 2 * starPoints; i++) {
            const r = (i % 2 === 0) ? radius : innerRadius;
            const angle = i * step - Math.PI / 2;
            
            const px = x + r * Math.cos(angle);
            const py = y + r * Math.sin(angle);
            
            if (i === 0) {
                star.moveTo(px, py);
            } else {
                star.lineTo(px, py);
            }
        }
        
        star.closePath();
        star.fillPath();
        star.setDepth(1);
        
        return star;
    }

    // Метод для показа отладочных сообщений на экране
    private showDebugMessage(message: string): void {
        console.log(`[DEBUG-UI] 📝 ${message}`);
        
        const center = this.screenManager.getScreenCenter();
        const y = this.screenManager.getScreenSize().height - 50;
        
        // Создаем текст сообщения внизу экрана
        const debugText = this.add.text(
            center.x, 
            y, 
            message,
            { 
                fontFamily: 'pixelFont',
                fontSize: this.screenManager.getResponsiveFontSize(8),
                color: '#FFFF00',
                backgroundColor: '#000000',
                padding: {
                    x: 10,
                    y: 5
                }
            }
        ).setOrigin(0.5).setDepth(1000).setAlpha(0);
        
        // Анимируем появление
        this.tweens.add({
            targets: debugText,
            alpha: 1,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Автоматически удаляем через 5 секунд
                this.time.delayedCall(5000, () => {
                    this.tweens.add({
                        targets: debugText,
                        alpha: 0,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => {
                            debugText.destroy();
                        }
                    });
                });
            }
        });
    }
} 
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
        // Preload assets if needed
    }

    create(): void {
        // Initialize managers
        this.screenManager = new ScreenManager(this);
        this.audioManager = AudioManager.getInstance(this);
        this.emblemManager = EmblemManager.getInstance();
        this.telegramService = TelegramService.getInstance();
        
        // Create background
        this.screenManager.setupBackground();
        
        // Setup UI
        this.setupUI();
        
        // Subscribe to resize events
        this.events.on('screenResize', this.handleScreenResize, this);
    }
    
    private setupUI(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        const gameScale = this.screenManager.getGameScale();
        
        // Add title
        const titleFontSize = this.screenManager.getLargeFontSize() * 0.8;
        const title = this.screenManager.createText(
            center.x,
            height * 0.1,
            'Emblems Shop',
            titleFontSize,
            '#FFFFFF'
        );
        
        // Add current emblems count
        const currentEmblemsFontSize = this.screenManager.getMediumFontSize();
        const currentEmblemsText = this.screenManager.createText(
            center.x,
            height * 0.2,
            `Current Emblems: ${this.emblemManager.getEmblemCount()}`,
            currentEmblemsFontSize,
            '#FFCC00'
        );
        
        // Add packages
        this.createPackageButtons();
        
        // Add back button
        const backButtonSize = this.screenManager.getResponsiveFontSize(32);
        const backButton = this.screenManager.createText(
            center.x,
            height * 0.9,
            'Back to Menu',
            backButtonSize,
            '#FFFFFF'
        );
        
        backButton.setInteractive()
            .on('pointerover', () => {
                backButton.setScale(1.1);
            })
            .on('pointerout', () => {
                backButton.setScale(1);
            })
            .on('pointerdown', () => {
                if (this.audioManager.hasSoundCached('playButton')) {
                    this.audioManager.playSound('playButton');
                }
                this.scene.start('MenuScene');
            });
    }
    
    private createPackageButtons(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        
        // Calculate the starting Y position
        const startY = height * 0.3;
        const spacing = height * 0.15;
        
        // Create a container for each package
        this.emblemPackages.forEach((pack, index) => {
            const packageY = startY + index * spacing;
            
            // Create container with background
            const containerWidth = width * 0.8;
            const containerHeight = height * 0.12;
            
            const container = this.add.container(center.x, packageY);
            
            // Background with border
            const background = this.add.graphics();
            background.fillStyle(0x333333, 0.7);
            background.fillRoundedRect(-containerWidth/2, -containerHeight/2, containerWidth, containerHeight, 15);
            
            background.lineStyle(2, 0xFFCC00, 1);
            background.strokeRoundedRect(-containerWidth/2, -containerHeight/2, containerWidth, containerHeight, 15);
            
            container.add(background);
            
            // Add emblem icon on the left
            const emblemIcon = this.add.sprite(-containerWidth * 0.35, 0, 'emblem')
                .setScale(0.4 * this.screenManager.getGameScale());
            
            // If emblem texture is not loaded, use a circle instead
            if (!this.textures.exists('emblem')) {
                const circleGraphic = this.add.graphics();
                circleGraphic.fillStyle(0xFFCC00, 1);
                circleGraphic.fillCircle(-containerWidth * 0.35, 0, 20 * this.screenManager.getGameScale());
                container.add(circleGraphic);
            } else {
                container.add(emblemIcon);
            }
            
            // Add package info text
            const fontSize = this.screenManager.getResponsiveFontSize(24);
            const packageText = this.add.text(
                -containerWidth * 0.2,
                -fontSize * 0.6,
                `${pack.amount} Emblems`,
                { fontFamily: 'Arial', fontSize: fontSize, color: '#FFFFFF' }
            ).setOrigin(0, 0.5);
            
            const descriptionText = this.add.text(
                -containerWidth * 0.2,
                fontSize * 0.6,
                pack.description,
                { fontFamily: 'Arial', fontSize: fontSize * 0.8, color: '#CCCCCC' }
            ).setOrigin(0, 0.5);
            
            container.add(packageText);
            container.add(descriptionText);
            
            // Add price on the right
            const priceText = this.add.text(
                containerWidth * 0.25,
                0,
                `${pack.starsCost} ⭐`,
                { fontFamily: 'Arial', fontSize: fontSize, color: '#FFCC00' }
            ).setOrigin(0.5);
            
            container.add(priceText);
            
            // Make the container interactive
            background.setInteractive(
                new Phaser.Geom.Rectangle(-containerWidth/2, -containerHeight/2, containerWidth, containerHeight),
                Phaser.Geom.Rectangle.Contains
            ).on('pointerover', () => {
                background.clear();
                background.fillStyle(0x444444, 0.8);
                background.fillRoundedRect(-containerWidth/2, -containerHeight/2, containerWidth, containerHeight, 15);
                background.lineStyle(2, 0xFFCC00, 1);
                background.strokeRoundedRect(-containerWidth/2, -containerHeight/2, containerWidth, containerHeight, 15);
            }).on('pointerout', () => {
                background.clear();
                background.fillStyle(0x333333, 0.7);
                background.fillRoundedRect(-containerWidth/2, -containerHeight/2, containerWidth, containerHeight, 15);
                background.lineStyle(2, 0xFFCC00, 1);
                background.strokeRoundedRect(-containerWidth/2, -containerHeight/2, containerWidth, containerHeight, 15);
            }).on('pointerdown', () => {
                this.purchaseEmblems(pack);
            });
        });
    }
    
    private async purchaseEmblems(pack: EmblemPackage): Promise<void> {
        // Prevent multiple purchases at once
        if (this.isProcessingPayment) return;
        this.isProcessingPayment = true;
        
        try {
            // Play button sound
            if (this.audioManager.hasSoundCached('playButton')) {
                this.audioManager.playSound('playButton');
            }
            
            // Only proceed if running in Telegram
            if (!this.telegramService.isTelegramWebApp()) {
                // If not in Telegram, just add emblems for testing
                this.emblemManager.addEmblems(pack.amount);
                this.showSuccessMessage(pack.amount);
                return;
            }
            
            // Process payment through Telegram
            const success = await this.telegramService.purchaseEmblems(pack.amount, pack.starsCost);
            
            if (success) {
                // Payment successful, add emblems
                this.emblemManager.addEmblems(pack.amount);
                this.showSuccessMessage(pack.amount);
            }
        } catch (error) {
            console.error('Error processing purchase:', error);
            this.telegramService.showAlert('Error processing payment. Please try again later.');
        } finally {
            this.isProcessingPayment = false;
        }
    }
    
    private showSuccessMessage(amount: number): void {
        const { width, height } = this.screenManager.getScreenSize();
        const center = this.screenManager.getScreenCenter();
        
        // Create success message
        const notificationText = this.screenManager.createText(
            center.x, 
            center.y, 
            `+${amount} Emblems!`,
            this.screenManager.getMediumFontSize(),
            '#9370DB'
        ).setAlpha(0);
        
        // Animation for notification
        this.tweens.add({
            targets: notificationText,
            y: center.y - 50,
            alpha: 1,
            duration: 1000,
            ease: 'Power2',
            onComplete: (tween, targets) => {
                this.tweens.add({
                    targets: targets,
                    alpha: 0,
                    duration: 500,
                    delay: 500,
                    onComplete: (tween, targets) => {
                        targets[0].destroy();
                        
                        // Update current emblems count display
                        const currentEmblemsText = this.children.list.find(child => 
                            child instanceof Phaser.GameObjects.Text && 
                            (child as Phaser.GameObjects.Text).text.startsWith('Current Emblems:')
                        ) as Phaser.GameObjects.Text;
                        
                        if (currentEmblemsText) {
                            currentEmblemsText.setText(`Current Emblems: ${this.emblemManager.getEmblemCount()}`);
                        }
                    }
                });
            }
        });
    }
    
    private handleScreenResize(gameScale: number): void {
        // Start fresh with a new layout
        this.children.removeAll();
        this.setupUI();
    }
    
    destroy(): void {
        // Clean up event listeners
        this.events.off('screenResize', this.handleScreenResize, this);
    }

    update(time: number, delta: number): void {
        // Update logic if needed
    }
} 
import Phaser from 'phaser';
import { WaveManager } from '../../managers/WaveManager';
import { ScreenManager } from '../../managers/ScreenManager';

export class WaveIndicator {
    private scene: Phaser.Scene;
    private waveManager: WaveManager;
    private waveText: Phaser.GameObjects.Text;
    private enemiesText: Phaser.GameObjects.Text;
    private statusText: Phaser.GameObjects.Text;
    private screenManager: ScreenManager;
    private x: number;
    private y: number;
    
    constructor(scene: Phaser.Scene, waveManager: WaveManager, x: number, y: number, screenManager?: ScreenManager) {
        this.scene = scene;
        this.waveManager = waveManager;
        this.x = x;
        this.y = y;
        this.screenManager = screenManager || new ScreenManager(scene);
        
        // Create UI elements with responsive font sizes
        
        // Calculate spacing based on font size
        const spacing = this.screenManager.getResponsivePadding(40);
        
        // Создаем UI элементы с высоким значением depth для отображения поверх других объектов
        this.waveText = this.scene.add.text(x, y, 'Wave: 1', { 
            fontSize: `${this.screenManager.getMediumFontSize()}px`, 
            color: '#ffffff',
            fontFamily: 'pixelFont',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(100);
        
        this.enemiesText = this.scene.add.text(x, y + spacing * 0.8, 'Enemies: 0', { 
            fontSize: `${this.screenManager.getSmallFontSize()}px`, 
            color: '#ffffff',
            fontFamily: 'pixelFont',
            stroke: '#000000',
            strokeThickness: 3
        }).setDepth(100);
        
        this.statusText = this.scene.add.text(x, y + spacing * 1.6, '', { 
            fontSize: `${this.screenManager.getSmallFontSize()}px`, 
            color: '#ffcc00',
            fontFamily: 'pixelFont',
            stroke: '#000000',
            strokeThickness: 3
        }).setDepth(100);
        
        // Подписываемся на события
        this.waveManager.on('waveStart', () => this.onWaveStart());
        this.waveManager.on('waveComplete', () => this.onWaveComplete());
        
        // Subscribe to screen resize events
        this.scene.events.on('screenResize', this.handleScreenResize, this);
        
        // Первоначальное обновление
        this.updateUI();
    }
    
    private handleScreenResize(gameScale: number): void {
        // Safety check for scene and text objects
        if (!this.scene || !this.waveText || !this.enemiesText || !this.statusText) {
            return;
        }
        
        try {
            // Calculate spacing based on font size
            const spacing = this.screenManager.getResponsivePadding(40);
            
            // Update text styles only if objects are active and valid
            if (this.waveText.active) {
                this.waveText.setFontSize(this.screenManager.getMediumFontSize());
                this.waveText.setStyle({ 
                    fontSize: `${this.screenManager.getMediumFontSize()}px`,
                    strokeThickness: Math.round(4 * gameScale),
                    color: '#ffffff',
                    fontFamily: 'pixelFont',
                    stroke: '#000000'
                });
            }
            
            if (this.enemiesText.active) {
                this.enemiesText.setFontSize(this.screenManager.getMediumFontSize());
                this.enemiesText.setStyle({ 
                    fontSize: `${this.screenManager.getMediumFontSize()}px`,
                    strokeThickness: Math.round(3 * gameScale),
                    color: '#ffffff',
                    fontFamily: 'pixelFont',
                    stroke: '#000000'
                });
            }
            
            if (this.statusText.active) {
                this.statusText.setFontSize(this.screenManager.getSmallFontSize());
                this.statusText.setStyle({ 
                    fontSize: `${this.screenManager.getSmallFontSize()}px`,
                    strokeThickness: Math.round(3 * gameScale),
                    color: '#ffcc00',
                    fontFamily: 'pixelFont',
                    stroke: '#000000'
                });
            }
            
            // Ensure position is properly updated based on screen size
            const screenSize = this.screenManager.getScreenSize();
            
            // If x was originally set to be a percentage of screen width, adjust accordingly
            if (this.x < 1) { // If x was specified as a percentage (0-1)
                this.x = screenSize.width * this.x;
            }
            
            // Reposition elements
            this.waveText.setPosition(this.x, this.y);
            this.enemiesText.setPosition(this.x, this.y + spacing * 0.8);
            this.statusText.setPosition(this.x, this.y + spacing * 1.6);
            
            // Ensure text is visible and has proper depth
            this.waveText.setVisible(true).setDepth(100);
            this.enemiesText.setVisible(true).setDepth(100);
            this.statusText.setVisible(true).setDepth(100);
            
            // Force update after a short delay to ensure visibility
            if (this.scene) {
                this.scene.time.delayedCall(100, () => {
                    // Recreate text to fix potential font issues
                    this.waveText.setText(this.waveText.text);
                    this.enemiesText.setText(this.enemiesText.text);
                    this.statusText.setText(this.statusText.text);
                    
                    this.waveText.setVisible(true).setDepth(100);
                    this.enemiesText.setVisible(true).setDepth(100);
                    this.statusText.setVisible(true).setDepth(100);
                });
            }
        } catch (e) {
            console.warn('Error updating WaveIndicator UI:', e);
        }
    }
    
    private onWaveStart(): void {
        this.updateUI();
        this.statusText.setText('Wave in progress...');
        this.statusText.setColor('#ffcc00');
    }
    
    private onWaveComplete(): void {
        this.updateUI();
        this.statusText.setText('Next wave coming...');
        this.statusText.setColor('#00ff00');
        
        // Анимация мигания статуса
        this.scene.tweens.add({
            targets: this.statusText,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: 2
        });
    }
    
    public updateUI(): void {
        // Safety check to make sure text objects are valid
        if (!this.scene || !this.scene.textures || !this.waveText || !this.enemiesText || !this.statusText) {
            return;
        }

        try {
            // Only update text if it's safe to do so
            if (this.waveText.active) {
                this.waveText.setText(`Wave: ${this.waveManager.getCurrentWave()}`);
                this.waveText.setDepth(100);
            }
            
            if (this.enemiesText.active) {
                this.enemiesText.setText(`Enemies: ${this.waveManager.getRemainingEnemies()}`);
                this.enemiesText.setDepth(100);
            }
            
            if (this.statusText.active) {
                this.statusText.setDepth(100);
            }
        } catch (e) {
            console.warn('Error updating WaveIndicator UI:', e);
        }
    }
    
    public destroy(): void {
        // Clean up event listeners
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        this.waveManager.off('waveStart');
        this.waveManager.off('waveComplete');
        
        // Destroy game objects
        this.waveText.destroy();
        this.enemiesText.destroy();
        this.statusText.destroy();
    }
} 
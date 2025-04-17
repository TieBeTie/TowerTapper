import Phaser from 'phaser';
import { WaveManager } from '../../managers/WaveManager';
import { ScreenManager } from '../../managers/ScreenManager';

export class WaveIndicator {
    private scene!: Phaser.Scene;
    private waveManager!: WaveManager;
    private waveText!: Phaser.GameObjects.Text;
    private statusText!: Phaser.GameObjects.Text;
    private screenManager!: ScreenManager;
    private x: number = 0;
    private y: number = 0;
    
    constructor(scene: Phaser.Scene, waveManager: WaveManager, x: number, y: number, screenManager?: ScreenManager) {
        try {
            if (!scene || !waveManager) {
                console.error('WaveIndicator: не переданы необходимые параметры в конструктор');
                return;
            }
            
            this.scene = scene;
            this.waveManager = waveManager;
            this.x = x;
            this.y = y;
            this.screenManager = screenManager || new ScreenManager(scene);
            
            // Create UI elements with responsive font sizes
            this.createUIElements();
            
            // Регистрируем обработчики событий с привязкой контекста (this)
            const boundOnWaveStart = this.onWaveStart.bind(this);
            const boundOnWaveComplete = this.onWaveComplete.bind(this);
            
            // Подписываемся на события
            this.waveManager.on('waveStart', boundOnWaveStart);
            this.waveManager.on('waveComplete', boundOnWaveComplete);
            
            // Subscribe to screen resize events
            this.scene.events.on('screenResize', this.handleScreenResize, this);
            
            // Первоначальное обновление
            this.safeUpdateUI();
        } catch (error) {
            console.error('Ошибка в конструкторе WaveIndicator:', error);
        }
    }
    
    private createUIElements(): void {
        try {
            // Calculate spacing based on font size
            const spacing = this.screenManager.getResponsivePadding(40);
            
            // Создаем UI элементы с высоким значением depth для отображения поверх других объектов
            this.waveText = this.scene.add.text(this.x, this.y, 'Wave: 1', { 
                fontSize: `${this.screenManager.getMediumFontSize()}px`, 
                color: '#ffffff',
                fontFamily: 'pixelFont',
                stroke: '#000000',
                strokeThickness: 4
            }).setDepth(100);
            
            // Create status text at the position where enemies text used to be
            this.statusText = this.scene.add.text(this.x, this.y + spacing * 0.8, '', { 
                fontSize: `${this.screenManager.getSmallFontSize()}px`, 
                color: '#ffcc00',
                fontFamily: 'pixelFont',
                stroke: '#000000',
                strokeThickness: 3
            }).setDepth(100);
            
            // Проверяем, что все элементы созданы успешно
            if (!this.waveText || !this.statusText) {
                console.error('Не удалось создать текстовые элементы WaveIndicator');
            }
        } catch (error) {
            console.error('Ошибка при создании UI элементов WaveIndicator:', error);
        }
    }
    
    private handleScreenResize(gameScale: number): void {
        // Safety check for scene and text objects
        if (!this.scene || !this.waveText || !this.statusText) {
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
            this.statusText.setPosition(this.x, this.y + spacing * 0.8);
            
            // Ensure text is visible and has proper depth
            this.waveText.setVisible(true).setDepth(100);
            this.statusText.setVisible(true).setDepth(100);
            
            // Force update after a short delay to ensure visibility
            if (this.scene) {
                this.scene.time.delayedCall(100, () => {
                    // Recreate text to fix potential font issues
                    this.waveText.setText(this.waveText.text);
                    this.statusText.setText(this.statusText.text);
                    
                    this.waveText.setVisible(true).setDepth(100);
                    this.statusText.setVisible(true).setDepth(100);
                });
            }
        } catch (e) {
            console.warn('Error updating WaveIndicator UI:', e);
        }
    }
    
    private onWaveStart(): void {
        try {
            // Проверяем существование и корректность текстовых объектов
            if (!this.scene || !this.scene.textures || 
                !this.statusText || !this.statusText.active || 
                !this.statusText.scene) {
                console.warn('WaveIndicator: Текстовые объекты не готовы в onWaveStart');
                return;
            }
            
            // Обновляем UI безопасно
            this.safeUpdateUI();
            
            // Устанавливаем текст только если объект существует и активен
            if (this.statusText && this.statusText.active) {
                this.statusText.setText('in progress...');
                this.statusText.setColor('#ffcc00');
            }
        } catch (error) {
            console.error('Ошибка в WaveIndicator.onWaveStart:', error);
        }
    }
    
    private onWaveComplete(): void {
        try {
            // Проверяем существование и корректность текстовых объектов
            if (!this.scene || !this.scene.textures || 
                !this.statusText || !this.statusText.active || 
                !this.statusText.scene) {
                console.warn('WaveIndicator: Текстовые объекты не готовы в onWaveComplete');
                return;
            }
            
            // Обновляем UI безопасно
            this.safeUpdateUI();
            
            // Устанавливаем текст только если объект существует и активен
            if (this.statusText && this.statusText.active) {
                this.statusText.setText('Next wave coming...');
                this.statusText.setColor('#00ff00');
                
                // Анимация мигания статуса, если сцена существует
                if (this.scene && this.scene.tweens) {
                    this.scene.tweens.add({
                        targets: this.statusText,
                        alpha: 0.5,
                        duration: 500,
                        yoyo: true,
                        repeat: 2
                    });
                }
            }
        } catch (error) {
            console.error('Ошибка в WaveIndicator.onWaveComplete:', error);
        }
    }
    
    // Безопасное обновление UI с проверками
    private safeUpdateUI(): void {
        try {
            // Safety check to make sure text objects and textures are valid
            if (!this.scene || !this.scene.textures) {
                console.warn('WaveIndicator: Сцена или текстуры не существуют');
                return;
            }

            // Проверяем каждый текстовый объект отдельно
            if (this.waveText && this.waveText.active && this.waveText.scene) {
                this.waveText.setText(`Wave: ${this.waveManager.getCurrentWave()}`);
                this.waveText.setDepth(100);
            } else {
                console.warn('WaveIndicator: waveText не готов');
            }
            
            if (this.statusText && this.statusText.active && this.statusText.scene) {
                this.statusText.setDepth(100);
                // Status text is updated in onWaveStart/onWaveComplete
            } else {
                console.warn('WaveIndicator: statusText не готов');
            }
        } catch (error) {
            console.error('Ошибка в WaveIndicator.safeUpdateUI:', error);
        }
    }
    
    // Публичный метод обновления для вызова извне
    public updateUI(): void {
        this.safeUpdateUI();
    }
    
    // Метод для правильного уничтожения компонента
    public destroy(): void {
        try {
            // Отписываемся от событий
            this.waveManager.off('waveStart', this.onWaveStart);
            this.waveManager.off('waveComplete', this.onWaveComplete);
            this.scene.events.off('screenResize', this.handleScreenResize, this);
            
            // Уничтожаем текстовые объекты, если они существуют
            if (this.waveText && this.waveText.active) {
                this.waveText.destroy();
            }
            
            if (this.statusText && this.statusText.active) {
                this.statusText.destroy();
            }
        } catch (error) {
            console.error('Ошибка при уничтожении WaveIndicator:', error);
        }
    }
} 
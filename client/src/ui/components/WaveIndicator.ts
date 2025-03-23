import Phaser from 'phaser';
import { WaveManager } from '../../managers/WaveManager';

export class WaveIndicator {
    private scene: Phaser.Scene;
    private waveManager: WaveManager;
    private waveText: Phaser.GameObjects.Text;
    private enemiesText: Phaser.GameObjects.Text;
    private statusText: Phaser.GameObjects.Text;
    
    constructor(scene: Phaser.Scene, waveManager: WaveManager, x: number, y: number) {
        this.scene = scene;
        this.waveManager = waveManager;
        
        // Создаем UI элементы
        this.waveText = this.scene.add.text(x, y, 'Wave: 1', { 
            fontSize: '24px', 
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        this.enemiesText = this.scene.add.text(x, y + 30, 'Enemies: 0', { 
            fontSize: '18px', 
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        this.statusText = this.scene.add.text(x, y + 60, '', { 
            fontSize: '16px', 
            color: '#ffcc00',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        // Подписываемся на события
        this.waveManager.on('waveStart', () => this.onWaveStart());
        this.waveManager.on('waveComplete', () => this.onWaveComplete());
        
        // Первоначальное обновление
        this.updateUI();
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
        this.waveText.setText(`Wave: ${this.waveManager.getCurrentWave()}`);
        this.enemiesText.setText(`Enemies: ${this.waveManager.getRemainingEnemies()}`);
    }
} 
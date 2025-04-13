/**
 * Этот файл содержит пример использования MysticalBackground в игровой сцене.
 * 
 * ВАЖНО: Этот файл создан только для демонстрации; не используйте его напрямую.
 * Вместо этого интегрируйте соответствующий код в вашу GameScene.
 */

import Phaser from 'phaser';
import { MysticalBackground } from './MysticalBackground';

export class MysticalBackgroundDemo {
    /**
     * Демонстрирует, как добавить мистический фон в вашу сцену
     */
    static integrateIntoGameScene(scene: Phaser.Scene): void {
        // 1. Добавьте в класс вашей сцены новое свойство:
        // private mysticalBackground!: MysticalBackground;

        // 2. Создайте фон в методе create() до создания других объектов:
        const mysticalBackground = new MysticalBackground(scene);

        // 3. Добавьте вызов update() в методе update() вашей сцены:
        // if (this.mysticalBackground) {
        //     this.mysticalBackground.update();
        // }

        // 4. При уничтожении сцены очистите ресурсы фона:
        // if (this.mysticalBackground) {
        //     this.mysticalBackground.destroy();
        // }

        // 5. Если вы хотите заменить стандартный фон на мистический, удалите
        // вызов this.screenManager.setupBackground() из вашей сцены
    }

    /**
     * Полная интеграция в GameScene
     */
    static getFullIntegrationCode(): string {
        return `
// 1. Импортируйте класс MysticalBackground
import { MysticalBackground } from '../objects/backgrounds/MysticalBackground';

export default class GameScene extends Phaser.Scene {
    // 2. Добавьте свойство для хранения ссылки на фон
    private mysticalBackground!: MysticalBackground;
    
    // ... другие свойства класса ...
    
    create(): void {
        // ... инициализация ScreenManager и других базовых объектов ...
        
        // 3. Создайте мистический фон вместо стандартного
        this.mysticalBackground = new MysticalBackground(this);
        
        // 4. Уберите вызов стандартного фона:
        // this.screenManager.setupBackground();
        
        // ... остальной код создания игровых объектов ...
    }
    
    update(time: number, delta: number): void {
        // 5. Обновляйте фон в каждом кадре
        if (this.mysticalBackground) {
            this.mysticalBackground.update();
        }
        
        // ... остальной код обновления ...
    }
    
    // При уничтожении сцены (метод shutdown или destroy)
    shutdown(): void {
        // 6. Очистите ресурсы фона
        if (this.mysticalBackground) {
            this.mysticalBackground.destroy();
        }
        
        // ... остальная очистка ресурсов ...
    }
}`;
    }
} 
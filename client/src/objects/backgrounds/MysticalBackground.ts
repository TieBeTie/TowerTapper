import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';

export class MysticalBackground {
    private scene: Phaser.Scene;
    private screenManager: ScreenManager;
    private backgroundLayers: Phaser.GameObjects.Image[] = [];
    private floatingIslands: Phaser.GameObjects.Image[] = [];
    private mainIsland: Phaser.GameObjects.Image | null = null;
    private stars: Phaser.GameObjects.Image[] = [];
    private perimeterGlow: Phaser.GameObjects.Graphics | null = null;
    private isDestroyed: boolean = false;
    private islandScale: number = 0.6;
    private mainIslandXOffset: number = 1.08;
    private mainIslandYOffset: number = 1.15;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.screenManager = new ScreenManager(scene);
        this.initialize();
    }

    /**
     * Инициализирует все компоненты фона
     */
    private initialize(): void {
        this.createSkyGradient();
        this.createMainIsland(); // Создаем основной остров под башней
        this.createFloatingIslands(); // Возвращаем парящие острова
        this.createStars();
        this.createPerimeterGlow();
        
        // Подписка на изменение размера экрана
        this.scene.events.on('screenResize', this.handleScreenResize, this);
    }

    /**
     * Создает градиентный фон неба
     */
    private createSkyGradient(): void {
        const { width, height } = this.screenManager.getScreenSize();
        
        // Создаем текстуру градиента программно
        const gradientTexture = this.createGradientTexture();

        // Создаем слой неба на основе градиентной текстуры
        const skyLayer = this.scene.add.image(width / 2, height / 2, gradientTexture);
        skyLayer.setDisplaySize(width * 1.5, height * 1.5); // Увеличиваем для избежания появления краев
        skyLayer.setDepth(-3000);
        skyLayer.setScrollFactor(0);
        skyLayer.setName('mysticalBackground_sky');
        
        this.backgroundLayers.push(skyLayer);
    }

    /**
     * Программно создает градиентную текстуру для неба
     */
    private createGradientTexture(): string {
        const textureKey = 'skyGradient';
        
        // Проверяем, существует ли уже такая текстура
        if (this.scene.textures.exists(textureKey)) {
            return textureKey;
        }
        
        // Создаем градиент от темно-синего до фиолетового
        // Увеличиваем размер градиента для лучшего качества
        const width = 512;
        const height = 1024;
        const graphics = this.scene.add.graphics();
        
        // Определяем цвета градиента (темно-синий внизу, фиолетовый вверху)
        const colorStops = [
            { stop: 0, color: 0x0a0a2a },    // Темно-синий внизу
            { stop: 0.3, color: 0x1a1a4a },   // Синий
            { stop: 0.6, color: 0x2a1a6a },   // Сине-фиолетовый
            { stop: 0.8, color: 0x3a1a7a },   // Фиолетовый
            { stop: 1, color: 0x4a1a8a }      // Светло-фиолетовый вверху
        ];
        
        // Рисуем градиент с полным заполнением без пропусков
        graphics.fillStyle(colorStops[0].color, 1);
        graphics.fillRect(0, 0, width, height);
        
        // Рисуем градиент
        for (let i = 0; i < colorStops.length - 1; i++) {
            const currentStop = colorStops[i];
            const nextStop = colorStops[i + 1];
            
            const startY = Math.floor(height * currentStop.stop);
            const endY = Math.floor(height * nextStop.stop);
            const steps = endY - startY;
            
            if (steps <= 0) continue;
            
            for (let j = 0; j < steps; j++) {
                const ratio = j / steps;
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(currentStop.color),
                    Phaser.Display.Color.ValueToColor(nextStop.color),
                    steps,
                    j
                );
                
                graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
                graphics.fillRect(0, startY + j, width, 1);
            }
        }
        
        // Генерируем текстуру и уничтожаем графику
        graphics.generateTexture(textureKey, width, height);
        graphics.destroy();
        
        return textureKey;
    }

    /**
     * Создает основной остров под башней
     */
    private createMainIsland(): void {
        const center = this.screenManager.getGameViewCenter();
        
        // Загружаем изображение главного острова вместо программной генерации
        if (!this.scene.textures.exists('mainIsland')) {
            this.scene.load.image('mainIsland', 'assets/images/islands/main_island.png');
            this.scene.load.once('complete', () => {
                // Создаем остров под башней после загрузки текстуры
                this.addMainIslandToScene(center);
            });
            this.scene.load.start();
        } else {
            // Если текстура уже загружена, просто добавляем остров
            this.addMainIslandToScene(center);
        }
    }
    
    /**
     * Добавляет главный остров на сцену
     */
    private addMainIslandToScene(center: { x: number; y: number }): void {
        // Создаем остров под башней
        this.mainIsland = this.scene.add.image(center.x * this.mainIslandXOffset, center.y * this.mainIslandYOffset, 'mainIsland');
        // Устанавливаем масштаб острова
        const scale = this.islandScale * this.screenManager.getGameScale(); // НЕ МЕНЯТЬ
        this.mainIsland.setScale(scale);
        this.mainIsland.setDepth(-15); // Выше фона, но ниже башни
        this.mainIsland.setName('mysticalBackground_mainIsland');
        
        // Возвращаем анимацию осыпания острова
        this.addCrumblingEffect();
    }

    /**
     * Добавляет эффект осыпания острова
     */
    private addCrumblingEffect(): void {
        if (!this.mainIsland) return;
        
        // Функция для создания анимации отдельного осколка по нижнему периметру
        const spawnCrumbleEffect = () => {
            if (!this.mainIsland || this.isDestroyed) return;
            
            // Создаем группы частиц, одну слева и одну справа для гарантии
            const leftParticles = true;
            const rightParticles = true;
            
            if (leftParticles) {
                // Левая сторона - случайная позиция на левой половине
                const randomLeftAngle = Math.PI * (0.5 + Math.random() * 0.5); // От 0.5π до π
                createParticleGroup(randomLeftAngle, 0);
            }
            
            if (rightParticles) {
                // Правая сторона - зеркальное отражение левой стороны
                const randomRightAngle = Math.PI * (1.0 + Math.random() * 1.5); // От π до 1.7π
                createParticleGroup(randomRightAngle, 1);
            }
            
            // Иногда добавляем частицы посередине
            if (Math.random() > 0.5) {
                const centerAngle = Math.PI; // Ровно вниз
                createParticleGroup(centerAngle, 2);
            }
            
            // Планируем следующее осыпание через случайный интервал
            if (!this.isDestroyed) {
                this.scene.time.delayedCall(
                    3000 + Math.random() * 1000, // Реже
                    spawnCrumbleEffect
                );
            }
        };
        
        // Вспомогательная функция для создания группы частиц по заданному углу
        const createParticleGroup = (angle: number, side: number) => {
            if (!this.mainIsland) return;
            
            // Коэффициент для расчета радиуса
            const radiusMultiplier = 1.1;
            
            const radiusX = this.mainIsland.width * this.mainIsland.scaleX * 0.4 * radiusMultiplier;
            const radiusY = this.mainIsland.height * this.mainIsland.scaleY * 0.4 * radiusMultiplier;
            
            // Вычисляем позицию на основе угла
            const x = this.mainIsland.x + Math.cos(angle) * radiusX;
            const y = this.mainIsland.y + Math.sin(angle) * radiusY;
            
            // Проверяем, что позиция находится ниже центра острова
            if (y >= this.mainIsland.y) {
                createParticlesAtPosition(x, y, side);
            } else {
                // Если точка выше центра, корректируем её положение
                const adjustedY = this.mainIsland.y + Math.abs(radiusY * 0.5);
                createParticlesAtPosition(x, adjustedY, side);
            }
        };
        
        // Вспомогательная функция для создания частиц в указанной позиции
        const createParticlesAtPosition = (x: number, y: number, side: number) => {
            // Создаем группу частиц в этой позиции
            const particleCount = 2 + Math.floor(Math.random() * 2);
            
            for (let i = 0; i < particleCount; i++) {
                const particle = this.scene.add.image(
                    x + (Math.random() * 4 - 2),
                    y + (Math.random() * 4), // Только вниз от края
                    'particle'
                );
                
                particle.setOrigin(0.5);
                particle.setScale(0.4 + Math.random() * 0.3);
                particle.setAlpha(0.5 + Math.random() * 0.3);
                particle.setDepth(-17);  // Ниже острова
                
                // Цвета для частиц строго коричневых оттенков для земли
                const colors = [0x7e5c42, 0x6d4c32, 0x594321];
                particle.setTint(colors[Math.floor(Math.random() * colors.length)]);
                
                // Определяем направление падения в зависимости от стороны
                let xVelocity = 0;
                
                // Направление падения зависит от стороны
                if (side === 0) { // Левая сторона
                    xVelocity = -5 - Math.random() * 10; // Влево
                } else if (side === 1) { // Правая сторона 
                    xVelocity = 5 + Math.random() * 10; // Вправо
                } else { // Центр
                    xVelocity = Math.random() * 8 - 4; // Небольшой разброс
                }
                
                // Анимация падения с учетом стороны
                this.scene.tweens.add({
                    targets: particle,
                    y: particle.y + 60 + Math.random() * 30,
                    x: particle.x + xVelocity,
                    alpha: 0,
                    scaleX: 0.2,
                    scaleY: 0.2,
                    duration: 2500 + Math.random() * 1000,
                    ease: 'Power2',
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            }
        };
        
        // Начинаем с небольшой задержкой
        this.scene.time.delayedCall(500, spawnCrumbleEffect);
    }

    /**
     * Создает звезды и энергетические частицы на фоне
     */
    private createStars(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const gameViewHeight = height * this.screenManager.getGameViewHeightRatio();
        
        // Создаем текстуру для звезд, если её нет
        this.createStarTexture();
        
        // Создаем множество звезд разного размера и яркости
        const starCount = Math.floor(width * height / 10000); // Примерное количество звезд в зависимости от размера экрана
        
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height; // Распределяем звезды по всей высоте экрана
            const size = 0.1 + Math.random() * 0.5; // Размер от 0.1 до 0.6 (уменьшаем для более тонкого эффекта)
            const alpha = 0.2 + Math.random() * 0.6; // Прозрачность от 0.2 до 0.8
            
            const star = this.scene.add.image(x, y, 'starParticle');
            star.setScale(size);
            star.setAlpha(alpha);
            star.setDepth(-2900);
            
            // Анимация мерцания
            this.scene.tweens.add({
                targets: star,
                alpha: alpha - 0.2,
                duration: 1000 + Math.random() * 2000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                delay: Math.random() * 1000
            });
            
            this.stars.push(star);
        }
    }
    
    /**
     * Создает текстуру для звезд
     */
    private createStarTexture(): void {
        const textureKey = 'starParticle';
        
        // Проверяем, существует ли уже такая текстура
        if (this.scene.textures.exists(textureKey)) {
            return;
        }
        
        // Создаем текстуру для звезд
        const graphics = this.scene.add.graphics();
        
        // Рисуем звезду
        graphics.fillStyle(0xffffff);
        this.drawStar(graphics, 8, 8, 5, 8, 4);
        
        // Генерируем текстуру
        graphics.generateTexture(textureKey, 16, 16);
        graphics.destroy();
    }
    
    /**
     * Вспомогательный метод для рисования звезды
     */
    private drawStar(graphics: Phaser.GameObjects.Graphics, x: number, y: number, points: number, outerRadius: number, innerRadius: number): void {
        const rot = Math.PI / 2 * 3;
        const step = Math.PI / points;
        
        graphics.beginPath();
        graphics.moveTo(x, y - outerRadius);
        
        for (let i = 0; i < points; i++) {
            graphics.lineTo(
                x + Math.cos(rot + step * i) * outerRadius,
                y + Math.sin(rot + step * i) * outerRadius
            );
            graphics.lineTo(
                x + Math.cos(rot + step * i + step / 2) * innerRadius,
                y + Math.sin(rot + step * i + step / 2) * innerRadius
            );
        }
        
        graphics.lineTo(x, y - outerRadius);
        graphics.closePath();
        graphics.fillPath();
    }

    /**
     * Создает свечение по периметру игровой области
     */
    private createPerimeterGlow(): void {
        const { width, height } = this.screenManager.getScreenSize();
        const gameViewHeight = height * this.screenManager.getGameViewHeightRatio();
        
        // Создаем графический объект для свечения
        this.perimeterGlow = this.scene.add.graphics();
        this.perimeterGlow.setDepth(-2000);
        
        // Рисуем периметр с градиентным свечением
        const glowColors = [
            { stop: 0, color: 0x9966ff, alpha: 0.25 },
            { stop: 0.7, color: 0x6633cc, alpha: 0.15 },
            { stop: 1, color: 0x000000, alpha: 0 }
        ];
        
        // Толщина линии периметра
        const lineWidth = Math.max(10, Math.round(width * 0.015));
        
        // Рисуем рамку
        for (let i = 0; i < lineWidth; i++) {
            const ratio = i / lineWidth;
            const colorInfo = this.interpolateColors(glowColors, ratio);
            
            this.perimeterGlow.lineStyle(2, colorInfo.color, colorInfo.alpha);
            this.perimeterGlow.strokeRect(
                i, 
                i, 
                width - i * 2, 
                gameViewHeight - i * 2
            );
        }
        
        // Добавляем пульсацию свечения
        this.scene.tweens.add({
            targets: this.perimeterGlow,
            alpha: 0.6,
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
    
    /**
     * Интерполирует цвета для создания градиента
     */
    private interpolateColors(colors: Array<{stop: number, color: number, alpha: number}>, ratio: number): {color: number, alpha: number} {
        for (let i = 0; i < colors.length - 1; i++) {
            const currentStop = colors[i];
            const nextStop = colors[i + 1];
            
            if (ratio >= currentStop.stop && ratio <= nextStop.stop) {
                const localRatio = (ratio - currentStop.stop) / (nextStop.stop - currentStop.stop);
                
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(currentStop.color),
                    Phaser.Display.Color.ValueToColor(nextStop.color),
                    1,
                    localRatio
                );
                
                const colorValue = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
                const alpha = currentStop.alpha + (nextStop.alpha - currentStop.alpha) * localRatio;
                
                return { color: colorValue, alpha };
            }
        }
        
        // Если ничего не найдено, возвращаем последний цвет
        const last = colors[colors.length - 1];
        return { color: last.color, alpha: last.alpha };
    }

    /**
     * Создает парящие острова на фоне
     */
    private createFloatingIslands(): void {
        const { width, height } = this.screenManager.getScreenSize();
        
        // Создаем программно текстуры для островов, если их нет
        this.createIslandTextures();
        
        // Определяем параметры расположения островов
        // Избегаем центра, где находится башня
        const islandPositions = [
            { x: width * 0.2, y: height * 0.25, scale: 0.6, texture: 'islandSmall', speed: 0.2 },
            { x: width * 0.85, y: height * 0.4, scale: 0.8, texture: 'islandMedium', speed: 0.15 },
            { x: width * 0.1, y: height * 0.7, scale: 0.5, texture: 'islandSmall', speed: 0.25 },
            { x: width * 0.75, y: height * 0.2, scale: 0.6, texture: 'islandSmall', speed: 0.18 },
            { x: width * 0.6, y: height * 0.7, scale: 0.7, texture: 'islandMedium', speed: 0.1 }
        ];
        
        // Создаем острова и добавляем анимацию парения
        islandPositions.forEach((position, index) => {
            const island = this.scene.add.image(position.x, position.y, position.texture);
            island.setScale(position.scale * this.screenManager.getGameScale());
            island.setDepth(-2500 + index * 5); // Разная глубина для эффекта параллакса
            island.setName(`mysticalBackground_island_${index}`);
            
            // Добавляем небольшой случайный начальный поворот
            island.setAngle((Math.random() * 10 - 5));
            
            // Анимация медленного парения вверх-вниз
            this.scene.tweens.add({
                targets: island,
                y: island.y - 15,
                duration: 3000 + Math.random() * 2000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                delay: Math.random() * 1000
            });
            
            // Очень медленное вращение
            this.scene.tweens.add({
                targets: island,
                angle: island.angle + (Math.random() > 0.5 ? 2 : -2),
                duration: 8000 + Math.random() * 4000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            
            this.floatingIslands.push(island);
        });
    }
    
    /**
     * Создает текстуры для островов программно
     */
    private createIslandTextures(): void {
        // Проверяем, существуют ли уже текстуры
        if (this.scene.textures.exists('islandSmall')) {
            return;
        }
        
        // Создаем текстуры для островов разных размеров
        this.createIslandTexture('islandSmall', 80, 50);
        this.createIslandTexture('islandMedium', 120, 70);
    }
    
    /**
     * Создает одну текстуру острова с заданными параметрами
     */
    private createIslandTexture(key: string, width: number, height: number): void {
        const graphics = this.scene.add.graphics();
        
        // Цвета островов как у главного острова
        const topColor = 0x5b6b47;     // Зеленый цвет для верха
        const soilColor = 0x7e5c42;    // Коричневый цвет для почвы
        
        // Параметры овалов
        const topOvalWidth = width * 0.9;
        const topOvalHeight = height * 0.5;
        const bottomOvalWidth = width * 0.85;
        const bottomOvalHeight = height * 0.4;
        
        const topOvalY = height * 0.4;
        const bottomOvalY = height * 0.7;
        
        // Рисуем прямоугольник, соединяющий овалы (заполняет цилиндр)
        graphics.fillStyle(soilColor);
        graphics.fillRect(
            width / 2 - topOvalWidth / 2,
            topOvalY,
            topOvalWidth,
            bottomOvalY - topOvalY
        );
        
        // Рисуем нижнюю часть острова (почва/земля)
        graphics.fillStyle(soilColor);
        
        // Нижний овал для почвы
        graphics.fillEllipse(width / 2, bottomOvalY, bottomOvalWidth, bottomOvalHeight);
        
        // Рисуем верхнюю часть острова (трава)
        graphics.fillStyle(topColor);
        
        // Верхний овал для травы
        graphics.fillEllipse(width / 2, topOvalY, topOvalWidth, topOvalHeight);
        
        // Добавляем деревья как на главном острове
        const treePositions = [
            { x: 0.3, y: 0.25 },
            { x: 0.5, y: 0.2 },
            { x: 0.7, y: 0.25 }
        ];
        
        treePositions.forEach(pos => {
            if (Math.random() > 0.3) { // Не на каждом острове будут все деревья
                this.drawPixelTree(graphics, width * pos.x, height * pos.y, width * 0.08);
            }
        });
        
        // Генерируем текстуру
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }
    
    /**
     * Рисует пиксельное дерево как на главном острове
     */
    private drawPixelTree(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
        // Рисуем ствол дерева
        graphics.fillStyle(0x6b4c33);
        graphics.fillRect(x - size * 0.2, y, size * 0.4, size * 0.7);
        
        // Рисуем крону дерева
        graphics.fillStyle(0x2a7d2a);
        const crownSize = size * 0.9;
        graphics.fillCircle(x, y - size * 0.4, crownSize / 2);
        
        // Добавляем детали к кроне
        graphics.fillStyle(0x348b34);
        graphics.fillCircle(x - crownSize * 0.25, y - size * 0.5, crownSize * 0.3);
        graphics.fillCircle(x + crownSize * 0.25, y - size * 0.6, crownSize * 0.3);
    }

    /**
     * Обработчик изменения размера экрана
     */
    private handleScreenResize(): void {
        const { width, height } = this.screenManager.getScreenSize();
        
        // Обновляем фоновые слои
        this.backgroundLayers.forEach(layer => {
            layer.setPosition(width / 2, height / 2);
            layer.setDisplaySize(width * 1.5, height * 1.5); // Увеличиваем для избежания появления краев
        });
        
        // Обновляем главный остров
        if (this.mainIsland) {
            const center = this.screenManager.getGameViewCenter();
            this.mainIsland.setPosition(center.x * this.mainIslandXOffset, center.y * this.mainIslandYOffset); // Сохраняем смещение вниз
            const scale = this.islandScale * this.screenManager.getGameScale();
            this.mainIsland.setScale(scale);
        }
        
        // Обновляем положение островов
        this.updateIslandsPositions(width, height);
        
        // Удаляем старые звезды и создаем новые
        this.stars.forEach(star => star.destroy());
        this.stars = [];
        this.createStars();
        
        // Обновляем свечение периметра
        if (this.perimeterGlow) {
            this.perimeterGlow.clear();
            this.createPerimeterGlow();
        }
    }
    
    /**
     * Обновляет положение островов при изменении размера экрана
     */
    private updateIslandsPositions(width: number, height: number): void {
        const newPositions = [
            { x: width * 0.2, y: height * 0.25 },
            { x: width * 0.85, y: height * 0.4 },
            { x: width * 0.1, y: height * 0.7 },
            { x: width * 0.75, y: height * 0.2 },
            { x: width * 0.6, y: height * 0.7 }
        ];
        
        this.floatingIslands.forEach((island, index) => {
            if (index < newPositions.length) {
                island.setPosition(newPositions[index].x, newPositions[index].y);
                
                // Обновляем масштаб
                const scales = [0.6, 0.8, 0.5, 0.6, 0.7];
                const scale = scales[index] * this.screenManager.getGameScale();
                island.setScale(scale);
                
                // Сбрасываем анимации и создаем новые
                this.scene.tweens.killTweensOf(island);
                
                // Сохраняем случайный начальный поворот при обновлении
                island.setAngle((Math.random() * 10 - 5));
                
                // Анимация медленного парения вверх-вниз
                this.scene.tweens.add({
                    targets: island,
                    y: island.y - 15,
                    duration: 3000 + Math.random() * 2000,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1,
                    delay: Math.random() * 1000
                });
                
                // Очень медленное вращение
                this.scene.tweens.add({
                    targets: island,
                    angle: island.angle + (Math.random() > 0.5 ? 2 : -2),
                    duration: 8000 + Math.random() * 4000,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });
            }
        });
    }

    /**
     * Уничтожает все объекты фона и очищает подписки на события
     */
    public destroy(): void {
        this.isDestroyed = true;
        
        // Отписываемся от событий
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        
        // Уничтожаем фоновые слои
        this.backgroundLayers.forEach(layer => layer.destroy());
        this.backgroundLayers = [];
        
        // Уничтожаем главный остров
        if (this.mainIsland) {
            this.mainIsland.destroy();
            this.mainIsland = null;
        }
        
        // Уничтожаем острова
        this.floatingIslands.forEach(island => island.destroy());
        this.floatingIslands = [];
        
        // Уничтожаем звезды
        this.stars.forEach(star => star.destroy());
        this.stars = [];
        
        // Уничтожаем свечение периметра
        if (this.perimeterGlow) {
            this.perimeterGlow.destroy();
            this.perimeterGlow = null;
        }
    }

    /**
     * Обновляет состояние фона (вызывается из метода update сцены)
     */
    public update(): void {
        // Здесь можно добавить дополнительную анимацию или эффекты,
        // которые должны обновляться каждый кадр
    }
} 
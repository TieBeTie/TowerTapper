import Phaser from 'phaser';
import { MysticalBackground } from '../objects/backgrounds/MysticalBackground';

export default class BackgroundScene extends Phaser.Scene {
    private mysticalBackground!: MysticalBackground;

    constructor() {
        super({ key: 'BackgroundScene' });
    }

    create() {
        this.mysticalBackground = new MysticalBackground(this);
    }

    update(time: number, delta: number) {
        if (this.mysticalBackground) {
            this.mysticalBackground.update();
        }
    }
} 
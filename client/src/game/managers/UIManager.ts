// managers/UIManager.js
import Phaser from 'phaser';
import { SkillType } from '../types/SkillType';
import { UpgradeManager } from './UpgradeManager';
import { ScreenManager } from './ScreenManager';
import { useGameStore } from '../../stores/game';

export class UIManager {
    private goldCount: number = 0;
    private goldIcon!: Phaser.GameObjects.Image;
    private goldNumberText!: Phaser.GameObjects.Text;
    private emblemIcon!: Phaser.GameObjects.Image;
    private emblemNumberText!: Phaser.GameObjects.Text;
    private upgradeManager: UpgradeManager;
    private screenManager: ScreenManager;
    
    // Dummy property to avoid TypeScript errors
    private upgradePanel: any = {
        addButtonsToCategory: () => {},
        setPosition: () => {},
        setVisible: () => {},
        updateUI: () => {},
        reset: () => {},
        destroy: () => {}
    };

    // Responsive design constants
    private readonly STATS_VIEW_HEIGHT_PIXEL = 24;
    private readonly BUTTON_SIZE_RATIO = 0.02; // 2% of screen width
    private readonly BUTTON_SPACING_RATIO = 0.04; // 4% of screen width
    private readonly ICON_SIZE_RATIO = 0.04; // 4% of screen width
    private readonly FONT_SIZE_RATIO = 0.04; // 4% of screen width
    
    // Категории улучшений
    private readonly CATEGORIES = ["Attack Upgrades", "Defense Upgrades", "Utility Upgrades"];

    // Добавляем поле для отслеживания времени между обновлениями
    private lastUpdateTime: number = 0;
    private readonly UPDATE_INTERVAL: number = 500; // миллисекунды

    constructor(
        private scene: Phaser.Scene,
        private onPauseToggle: () => void,
        private onUpgradeClick: () => void,
        private onSettingsClick: () => void,
        private onShopClick: () => void,
        upgradeManager: UpgradeManager,
        screenManager: ScreenManager
    ) {
        this.upgradeManager = upgradeManager;
        this.screenManager = screenManager;
        this.initialize();
        
        // Subscribe to screen resize events from ScreenManager
        this.scene.events.on('screenResize', this.handleScreenResize, this);
        
        // Listen for ui-force-visibility event with the updated name
        this.scene.events.on('ui-refresh-visibility', this.forceAllButtonsVisible, this);
        
        // Listen for emblem updates
        this.scene.events.on('updateEmblems', this.updateEmblemCount, this);
        
        // Set up update callback for regular updates
        this.scene.events.on('update', this.onUpdate, this);
    }

    private initilizeUpgradePanel(): void {
        // Stub implementation - no longer creates actual UI elements
        console.log("[UIManager] initilizeUpgradePanel: UI replaced with Vue components");
    }
    
    private createAttackUpgradeButtons(fontSize: number): Phaser.GameObjects.GameObject[] {
        return []; // Stub implementation - returns empty array
    }
    
    private createDefenseUpgradeButtons(fontSize: number): Phaser.GameObjects.GameObject[] {
        return []; // Stub implementation - returns empty array
    }
    
    private createUtilityUpgradeButtons(fontSize: number): Phaser.GameObjects.GameObject[] {
        return []; // Stub implementation - returns empty array
    }

    private initialize(): void {
        console.log("[UIManager] initialize: Using Vue components instead of Phaser UI");
        // Ensure game store is updated
        try {
            const gameStore = useGameStore();
            gameStore.updateGold(this.goldCount);
        } catch (err) {
            console.warn("Could not update Pinia store with gold", err);
        }
    }

    public updatePositions(): void {
        // Stub implementation - no longer updates UI positions
        console.log("[UIManager] updatePositions: UI replaced with Vue components");
    }

    private handleScreenResize(gameScale: number): void {
        // Stub implementation - no longer handles resizing of UI
        console.log("[UIManager] handleScreenResize: UI replaced with Vue components");
    }

    private forceAllButtonsVisible(): void {
        // Stub implementation - no longer forces visibility of UI buttons
        console.log("[UIManager] forceAllButtonsVisible: UI replaced with Vue components");
    }

    public updateGold(gold: number): void {
        this.goldCount = gold;
        
        // Update Pinia store
        try {
            const gameStore = useGameStore();
            gameStore.updateGold(gold);
        } catch (err) {
            console.warn("Could not update Pinia store with gold", err);
        }
    }

    public updateGoldCount(gold: number): void {
        this.updateGold(gold);
    }

    showNotification(message: string, color: number = 0xFFFFFF): void {
        console.log(`[UIManager] showNotification: ${message}`);
    }

    getGoldCount(): number {
        return this.goldCount;
    }

    destroy(): void {
        // Clean up event listeners
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        this.scene.events.off('ui-refresh-visibility', this.forceAllButtonsVisible, this);
        this.scene.events.off('updateEmblems', this.updateEmblemCount, this);
        this.scene.events.off('update', this.onUpdate, this);
        
        console.log('[UIManager] Destroying UI components...');
        console.log('[UIManager] UI components destroyed');
    }

    private updateEmblemCount(emblems: number): void {
        // Update Pinia store
        try {
            const gameStore = useGameStore();
            gameStore.updateEmblems(emblems);
        } catch (err) {
            console.warn("Could not update Pinia store with emblems", err);
        }
    }

    updateCounts(): void {
        // Stub implementation - no longer updates UI counts
        console.log("[UIManager] updateCounts: UI replaced with Vue components");
    }

    private onUpdate(time: number): void {
        // No-op - don't need to update UI anymore
    }

    updateHealthDisplay(currentHP: number, maxHP: number): void {
        // Update Pinia store
        try {
            const gameStore = useGameStore();
            gameStore.updateHealth(currentHP, maxHP);
        } catch (err) {
            console.warn("Could not update Pinia store with health", err);
        }
    }

    public reset(): void {
        // Stub implementation - no longer resets UI
        console.log("[UIManager] reset: UI replaced with Vue components");
        console.log('[UIManager] Reset complete');
    }

    public setVisible(visible: boolean): void {
        // Stub implementation - no longer sets visibility of UI
        console.log(`[UIManager] setVisible(${visible}): UI replaced with Vue components`);
    }
}

import Phaser from 'phaser';
import { ScreenManager } from '../../managers/ScreenManager';
import { ButtonPanel } from './ButtonPanel';

export class ScrollableButtonPanel {
    private container: Phaser.GameObjects.Container;
    private background: Phaser.GameObjects.Graphics;
    private contentContainer: Phaser.GameObjects.Container;
    private categoryContainer: Phaser.GameObjects.Container;
    private categoryButtons: Phaser.GameObjects.Container[] = [];
    private upgradeButtonsPanel: ButtonPanel[] = [];
    private currentCategoryIndex: number = 0;
    private currentWidth: number = 0;
    private currentHeight: number = 0;
    private screenManager: ScreenManager;
    private scrollBars: Phaser.GameObjects.Graphics[] = [];
    private isDragging: boolean = false;
    private lastDragY: number = 0;

    // Layout constants
    private readonly CATEGORY_HEIGHT_RATIO = 0.1;
    private readonly CONTENT_HEIGHT_RATIO = 0.9;
    private readonly CATEGORY_ACTIVE_TINT = 0x00aa00;
    private readonly CATEGORY_INACTIVE_TINT = 0x444444;
    private readonly SCROLLBAR_WIDTH = 6;
    private readonly SCROLLBAR_COLOR = 0xCCCCCC;
    private readonly SCROLLBAR_ALPHA = 0.5;

    constructor(
        private scene: Phaser.Scene,
        private columns: number = 2,
        private rows: number = 3,
        private totalButtons: number = 0,
        screenManager?: ScreenManager,
        private categories: string[] = []
    ) {
        this.screenManager = screenManager || new ScreenManager(scene);
        
        // Create containers with maximum depth
        this.container = this.scene.add.container(0, 0).setDepth(2000); // Increase from 1000 to 2000
        this.background = this.scene.add.graphics();
        this.contentContainer = this.scene.add.container(0, 0);
        this.categoryContainer = this.scene.add.container(0, 0);
        
        // Add to main container
        this.container.add(this.background);
        this.container.add(this.contentContainer);
        this.container.add(this.categoryContainer);
        
        // Set initial size and create buttons
        const { width, height } = this.screenManager.getScreenSize();
        this.setSize(width, height * 0.3);
        
        if (this.categories.length > 0) {
            this.createCategoryButtons();
        }
        
        // Set up input events
        this.setupScrollingEvents();
        
        // Listen for screen resize
        this.scene.events.on('screenResize', this.handleScreenResize, this);
        
        // Listen for force visibility events
        this.scene.events.on('ui-force-visibility', this.forceVisibility, this);
    }

    private setupScrollingEvents(): void {
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const localY = pointer.y - this.container.y;
            if (localY < this.currentHeight - (this.currentHeight * this.CATEGORY_HEIGHT_RATIO)) {
                this.isDragging = true;
                this.lastDragY = pointer.y;
            }
        });
        
        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.isDragging) return;
            
            if (this.upgradeButtonsPanel.length > 0) {
                const deltaY = pointer.y - this.lastDragY;
                this.lastDragY = pointer.y;
                
                const currentPanel = this.upgradeButtonsPanel[this.currentCategoryIndex];
                const elements = currentPanel.getContainer().list as Phaser.GameObjects.GameObject[];
                
                if (elements.length <= this.columns * this.rows) return;
                
                const contentHeight = this.currentHeight * this.CONTENT_HEIGHT_RATIO;
                const cellHeight = contentHeight / this.rows;
                const totalRows = Math.ceil(elements.length / this.columns);
                const totalContentHeight = totalRows * cellHeight;
                const maxScroll = Math.max(0, totalContentHeight - contentHeight);
                
                currentPanel.getContainer().y += deltaY;
                currentPanel.getContainer().y = Math.min(0, Math.max(-maxScroll, currentPanel.getContainer().y));
                
                if (totalContentHeight > contentHeight) {
                    this.updateScrollbar(currentPanel.getContainer().y, maxScroll);
                }
            }
        });
        
        this.scene.input.on('pointerup', () => {
            this.isDragging = false;
        });
        
        this.scene.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
            const localY = pointer.y - this.container.y;
            if (localY < this.currentHeight - (this.currentHeight * this.CATEGORY_HEIGHT_RATIO)) {
                if (this.upgradeButtonsPanel.length <= 0) return;
                
                const currentPanel = this.upgradeButtonsPanel[this.currentCategoryIndex];
                const elements = currentPanel.getContainer().list as Phaser.GameObjects.GameObject[];
                
                if (elements.length <= this.columns * this.rows) return;
                
                const contentHeight = this.currentHeight * this.CONTENT_HEIGHT_RATIO;
                const cellHeight = contentHeight / this.rows;
                const totalRows = Math.ceil(elements.length / this.columns);
                const totalContentHeight = totalRows * cellHeight;
                const maxScroll = Math.max(0, totalContentHeight - contentHeight);
                
                currentPanel.getContainer().y -= Math.sign(deltaY) * 20;
                currentPanel.getContainer().y = Math.min(0, Math.max(-maxScroll, currentPanel.getContainer().y));
                
                if (totalContentHeight > contentHeight) {
                    this.updateScrollbar(currentPanel.getContainer().y, maxScroll);
                }
            }
        });
    }
    
    private updateScrollbar(panelY: number, maxScroll: number): void {
        const scrollbar = this.scrollBars[this.currentCategoryIndex];
        if (!scrollbar) return;
        
        scrollbar.clear();
        
        const contentHeight = this.currentHeight * this.CONTENT_HEIGHT_RATIO;
        if (maxScroll <= 0) return;
        
        const scrollbarHeight = (contentHeight / (maxScroll + contentHeight)) * contentHeight;
        const scrollPosition = (panelY / -maxScroll) * (contentHeight - scrollbarHeight);
        
        scrollbar.fillStyle(this.SCROLLBAR_COLOR, this.SCROLLBAR_ALPHA);
        scrollbar.fillRect(
            this.currentWidth - this.SCROLLBAR_WIDTH - 2,
            scrollPosition, 
            this.SCROLLBAR_WIDTH, 
            scrollbarHeight
        );
    }

    private createCategoryButtons(): void {
        // Clear existing elements
        this.categoryButtons.forEach(button => button.destroy());
        this.categoryButtons = [];
        this.scrollBars.forEach(sb => sb.destroy());
        this.scrollBars = [];
        
        // Clear existing panels
        this.upgradeButtonsPanel.forEach(panel => panel.destroy());
        this.upgradeButtonsPanel = [];
        
        // Calculate dimensions
        const fontSize = this.screenManager.getResponsiveFontSize(14);
        const categoryHeight = this.currentHeight * this.CATEGORY_HEIGHT_RATIO;
        const buttonWidth = (this.currentWidth / this.categories.length) - 10;
        const buttonHeight = categoryHeight * 0.8;
        
        // Create panels for each category
        for (let i = 0; i < this.categories.length; i++) {
            // Create panel
            const panel = new ButtonPanel(
                this.scene, 
                this.columns, 
                this.rows,
                this.screenManager
            );
            
            panel.setPosition(0, 0);
            panel.setVisible(i === this.currentCategoryIndex);
            panel.setSize(this.currentWidth, this.currentHeight * this.CONTENT_HEIGHT_RATIO);
            
            this.contentContainer.add(panel.getContainer());
            this.upgradeButtonsPanel.push(panel);
            
            // Create scrollbar
            const scrollbar = this.scene.add.graphics();
            this.container.add(scrollbar);
            this.scrollBars.push(scrollbar);
            scrollbar.setVisible(i === this.currentCategoryIndex);
        }
        
        // Create category buttons
        this.categories.forEach((category, index) => {
            const x = (index * (buttonWidth + 10)) + (buttonWidth / 2) + 5;
            
            // Create button container
            const buttonContainer = this.scene.add.container(x, this.currentHeight - (categoryHeight / 2));
            buttonContainer.setDepth(2001); // Increase from 1000 to 2001
            
            // Create background
            const background = this.scene.add.graphics();
            background.fillStyle(index === this.currentCategoryIndex ? 
                            this.CATEGORY_ACTIVE_TINT : this.CATEGORY_INACTIVE_TINT, 1);
            background.lineStyle(2, 0x666666, 1);
            background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 8);
            background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 8);
            buttonContainer.add(background);
            
            // Create text
            const text = this.scene.add.text(0, 0, category, {
                fontSize: `${fontSize}px`,
                color: '#ffffff',
                align: 'center',
                fontFamily: 'pixelFont'
            }).setOrigin(0.5).setDepth(2002); // Increase from 1001 to 2002
            buttonContainer.add(text);
            
            // Make button interactive
            buttonContainer.setInteractive(new Phaser.Geom.Rectangle(
                -buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight
            ), Phaser.Geom.Rectangle.Contains);
            
            // Add event handler
            buttonContainer.on('pointerdown', () => this.switchCategory(index));
            
            // Add to container
            this.categoryContainer.add(buttonContainer);
            this.categoryButtons.push(buttonContainer);
        });
    }

    private switchCategory(index: number): void {
        if (index === this.currentCategoryIndex) return;
        
        // Update button appearances
        this.categoryButtons.forEach((buttonContainer, i) => {
            const background = buttonContainer.list[0] as Phaser.GameObjects.Graphics;
            const bounds = (buttonContainer as any).input.hitArea;
            
            background.clear();
            background.fillStyle(i === index ? this.CATEGORY_ACTIVE_TINT : this.CATEGORY_INACTIVE_TINT, 1);
            background.lineStyle(2, 0x666666, 1);
            background.fillRoundedRect(-bounds.width/2, -bounds.height/2, bounds.width, bounds.height, 8);
            background.strokeRoundedRect(-bounds.width/2, -bounds.height/2, bounds.width, bounds.height, 8);
        });
        
        // Hide current panel and show new one
        this.upgradeButtonsPanel[this.currentCategoryIndex].setVisible(false);
        if (this.scrollBars[this.currentCategoryIndex]) {
            this.scrollBars[this.currentCategoryIndex].setVisible(false);
        }
        
        this.upgradeButtonsPanel[index].setVisible(true);
        if (this.scrollBars[index]) {
            this.scrollBars[index].setVisible(true);
        }
        
        // Reset panel position
        this.upgradeButtonsPanel[index].setPosition(0, 0);
        this.currentCategoryIndex = index;
        
        // Update scrollbar
        this.updateScrollbarForCategory(index);
    }

    addButtonsToCategory(buttons: Phaser.GameObjects.GameObject[], categoryIndex: number): void {
        if (categoryIndex < 0 || categoryIndex >= this.upgradeButtonsPanel.length) return;
        
        const panel = this.upgradeButtonsPanel[categoryIndex];
        buttons.forEach(button => panel.addElement(button));
        
        this.updateScrollbarForCategory(categoryIndex);
    }

    private updateScrollbarForCategory(categoryIndex: number): void {
        const panel = this.upgradeButtonsPanel[categoryIndex];
        if (!this.scrollBars[categoryIndex]) return;
        
        const contentHeight = this.currentHeight * this.CONTENT_HEIGHT_RATIO;
        const panelPosition = panel.getContainer().y;
        const totalElements = panel.getElementCount();
        
        if (totalElements > this.columns * this.rows) {
            const cellHeight = contentHeight / this.rows;
            const totalRows = Math.ceil(totalElements / this.columns);
            const totalContentHeight = totalRows * cellHeight;
            const maxScroll = Math.max(0, totalContentHeight - contentHeight);
            
            this.updateScrollbar(panelPosition, maxScroll);
        } else {
            this.scrollBars[categoryIndex].clear();
        }
    }

    private handleScreenResize(): void {
        // Get new screen dimensions
        const { width, height } = this.screenManager.getScreenSize();
        
        // Update panel size
        this.setSize(width, height * 0.3);
        
        // Recreate category buttons for proper sizing
        this.createCategoryButtons();
        
        // Ensure all components are visible
        this.container.setVisible(true);
        this.container.setDepth(2000); // Increase from 1000 to 2000
        this.contentContainer.setVisible(true);
        this.categoryContainer.setVisible(true);
        
        // Make sure current panel and scrollbar are visible
        if (this.upgradeButtonsPanel.length > 0) {
            this.upgradeButtonsPanel[this.currentCategoryIndex].setVisible(true);
            if (this.scrollBars[this.currentCategoryIndex]) {
                this.scrollBars[this.currentCategoryIndex].setVisible(true);
            }
        }
        
        // Force visibility with a slight delay
        if (this.scene && this.scene.time) {
            this.scene.time.delayedCall(100, () => {
                // Ensure all category buttons are visible
                this.categoryButtons.forEach(button => {
                    button.setVisible(true);
                    button.setDepth(2001); // Increase from 1000 to 2001
                    
                    // Make text visible
                    const text = button.list[1] as Phaser.GameObjects.Text;
                    if (text) {
                        text.setVisible(true);
                        text.setDepth(2002); // Increase from 1001 to 2002
                    }
                });
                
                // Ensure current panel is visible
                if (this.upgradeButtonsPanel.length > 0) {
                    const currentPanel = this.upgradeButtonsPanel[this.currentCategoryIndex];
                    currentPanel.setVisible(true);
                    
                    // Force update button positions
                    const panelContainer = currentPanel.getContainer();
                    if (panelContainer) {
                        panelContainer.setVisible(true);
                        panelContainer.setDepth(2000); // Increase from 1000 to 2000
                    }
                }
                
                this.forceVisibility();
            });
        }
    }

    setPosition(x: number, y: number): void {
        this.container.setPosition(x, y);
    }

    setSize(width: number, height: number): void {
        this.currentWidth = width;
        this.currentHeight = height;
        
        // Redraw background
        this.background.clear();
        this.background.fillStyle(0x000000, 0.7);
        this.background.fillRect(0, 0, width, height);
        
        // Update category buttons and panels
        if (this.categories.length > 0) {
            this.createCategoryButtons();
        }
    }

    setVisible(visible: boolean): void {
        this.container.setVisible(visible);
    }

    getHeight(): number {
        return this.currentHeight;
    }

    destroy(): void {
        // Remove event listeners
        this.scene.events.off('screenResize', this.handleScreenResize, this);
        this.scene.events.off('ui-force-visibility', this.forceVisibility, this);
        this.scene.input.off('pointerdown');
        this.scene.input.off('pointermove');
        this.scene.input.off('pointerup');
        this.scene.input.off('wheel');
        
        // Destroy all objects
        this.categoryButtons.forEach(button => button.destroy());
        this.upgradeButtonsPanel.forEach(panel => panel.destroy());
        this.scrollBars.forEach(sb => sb.destroy());
        this.categoryContainer.destroy();
        this.contentContainer.destroy();
        this.background.destroy();
        this.container.destroy();
    }

    // Add a new method to force visibility of all UI elements
    private forceVisibility(): void {
        // Make sure container and all its contents are visible
        this.container.setVisible(true);
        this.container.setDepth(2000);
        
        // Ensure all category buttons are properly visible
        this.categoryButtons.forEach(button => {
            button.setVisible(true);
            button.setDepth(2001);
            
            // Make text visible
            const text = button.list[1] as Phaser.GameObjects.Text;
            if (text) {
                text.setVisible(true);
                text.setDepth(2002);
            }
        });
        
        // Make sure the current panel is visible
        if (this.upgradeButtonsPanel.length > 0) {
            const currentPanel = this.upgradeButtonsPanel[this.currentCategoryIndex];
            currentPanel.setVisible(true);
            
            // Force the panel container to be visible
            const panelContainer = currentPanel.getContainer();
            if (panelContainer) {
                panelContainer.setVisible(true);
                panelContainer.setDepth(2000);
            }
        }
        
        // Make sure scrollbars are visible
        if (this.scrollBars.length > 0 && this.scrollBars[this.currentCategoryIndex]) {
            this.scrollBars[this.currentCategoryIndex].setVisible(true);
        }
    }
} 
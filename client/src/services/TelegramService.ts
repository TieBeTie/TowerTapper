export class TelegramService {
    private static instance: TelegramService;
    private webApp: TelegramWebApp | null = null;
    private viewportChangeCallbacks: (() => void)[] = [];

    private constructor() {
        // Проверяем, доступен ли Telegram Web App
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            this.webApp = window.Telegram.WebApp;
            this.initialize();
        } else {
            console.warn('Telegram Web App is not available');
        }
    }

    public static getInstance(): TelegramService {
        if (!TelegramService.instance) {
            TelegramService.instance = new TelegramService();
        }
        return TelegramService.instance;
    }

    private initialize(): void {
        if (!this.webApp) return;
        
        // Инициализация Telegram Web App
        this.webApp.ready();
        
        // Устанавливаем основной цвет темы
        this.webApp.setHeaderColor('#ffffff');
        this.webApp.setBackgroundColor('#ffffff');

        // Разворачиваем приложение на весь экран
        this.expandWebApp();

        // Check if running on iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        
        if (isIOS) {
            console.log('Running on iOS - applying special viewport handling');
        }

        // Use a debounced handler for iOS to prevent too many viewport updates
        let timeout: any = null;
        const debouncedCallback = () => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.viewportChangeCallbacks.forEach(callback => callback());
            }, isIOS ? 250 : 50); // Longer delay for iOS
        };

        // Подписываемся на изменения viewport
        this.webApp.onEvent('viewportChanged', debouncedCallback);
        
        // Also listen for window resize events as a fallback
        window.addEventListener('resize', debouncedCallback);
    }

    // Получить данные пользователя
    public getUserData(): TelegramWebApp['initDataUnsafe']['user'] | null {
        return this.webApp?.initDataUnsafe?.user || null;
    }

    // Проверить, запущено ли приложение в Telegram
    public isTelegramWebApp(): boolean {
        return !!this.webApp;
    }

    // Получить текущую тему (светлая/темная)
    public getTheme(): string {
        return this.webApp?.colorScheme || 'light';
    }

    // Получить размеры окна
    public getViewportHeight(): number {
        return this.webApp?.viewportHeight || window.innerHeight;
    }

    public getViewportWidth(): number {
        return this.webApp?.viewportWidth || window.innerWidth;
    }

    // Проверить, развернуто ли приложение на весь экран
    public isExpanded(): boolean {
        return this.webApp?.isExpanded || false;
    }

    // Развернуть приложение на весь экран
    public expandWebApp(): void {
        if (this.webApp && !this.isExpanded()) {
            try {
                this.webApp.expand();
                console.log('WebApp expanded to fullscreen');
            } catch (error) {
                console.error('Failed to expand WebApp:', error);
            }
        }
    }

    // Добавить обработчик изменения viewport
    public onViewportChange(callback: () => void): void {
        this.viewportChangeCallbacks.push(callback);
    }

    // Удалить обработчик изменения viewport
    public offViewportChange(callback: () => void): void {
        const index = this.viewportChangeCallbacks.indexOf(callback);
        if (index > -1) {
            this.viewportChangeCallbacks.splice(index, 1);
        }
    }
} 
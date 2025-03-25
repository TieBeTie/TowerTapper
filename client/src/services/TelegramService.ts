export class TelegramService {
    private static instance: TelegramService;
    private webApp: TelegramWebApp | null = null;

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
} 
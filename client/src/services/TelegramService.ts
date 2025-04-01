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

    // Purchase emblems using Telegram stars
    public purchaseEmblems(emblemAmount: number, starCost: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.webApp) {
                console.error('Telegram WebApp not available');
                reject(new Error('Telegram WebApp not available'));
                return;
            }

            // Show confirmation dialog
            this.webApp.showConfirm(
                `Do you want to purchase ${emblemAmount} emblems for ${starCost} stars?`,
                (confirmed) => {
                    if (!confirmed) {
                        resolve(false);
                        return;
                    }

                    // Create a short unique invoice ID
                    const invoiceId = Math.random().toString(36).substring(2, 10);
                    
                    // Generate a backend API URL that would create an invoice
                    // In a real implementation, this would call your server endpoint
                    const invoiceUrl = `https://t.me/payments/${invoiceId}?amount=${starCost}&emblems=${emblemAmount}`;
                    
                    try {
                        // At this point, this.webApp is guaranteed to be non-null because of the check at the beginning of the method
                        const webApp = this.webApp as TelegramWebApp;
                        webApp.openInvoice(invoiceUrl, (status) => {
                            if (status === 'paid') {
                                console.log(`Purchase successful: ${emblemAmount} emblems for ${starCost} stars`);
                                resolve(true);
                            } else {
                                console.log(`Purchase failed or cancelled with status: ${status}`);
                                resolve(false);
                            }
                        });
                    } catch (error) {
                        console.error('Error opening invoice:', error);
                        reject(error);
                    }
                }
            );
        });
    }

    // Show a popup message with buttons
    public showPopup(message: string, title?: string, buttons?: Array<{
        id?: string;
        type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
        text: string;
    }>): Promise<string> {
        return new Promise((resolve) => {
            if (!this.webApp) {
                console.error('Telegram WebApp not available');
                resolve('error');
                return;
            }

            this.webApp.showPopup(
                {
                    title,
                    message,
                    buttons
                },
                (buttonId) => {
                    resolve(buttonId);
                }
            );
        });
    }

    // Show a simple alert
    public showAlert(message: string): Promise<void> {
        return new Promise((resolve) => {
            if (!this.webApp) {
                console.error('Telegram WebApp not available');
                resolve();
                return;
            }

            this.webApp?.showAlert(message, () => {
                resolve();
            });
        });
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
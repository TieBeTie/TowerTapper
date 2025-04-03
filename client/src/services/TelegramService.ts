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
        console.log(`[DEBUG] 🔹 Начало процесса покупки ${emblemAmount} эмблем за ${starCost} звезд через Stars API`);
        return new Promise((resolve, reject) => {
            if (!this.webApp) {
                console.error('[ERROR] ❌ Telegram WebApp не доступен');
                this.showAlert('Telegram WebApp не доступен. Пожалуйста, обновите приложение.');
                reject(new Error('Telegram WebApp not available'));
                return;
            }

            // Получаем данные пользователя для логирования
            const userData = this.getUserData();
            console.log('[DEBUG] 🔹 Пользователь:', userData ? `ID: ${userData.id}, Username: ${userData.username || 'не указан'}` : 'не определен');
            console.log('[DEBUG] 🔹 Версия WebApp:', this.webApp.version || 'неизвестно');
            console.log('[DEBUG] 🔹 Платформа:', this.webApp.platform || 'неизвестно');
            console.log('[DEBUG] 🔹 Цветовая схема:', this.webApp.colorScheme || 'неизвестно');
            
            // Проверяем версию API
            const versionString = this.webApp.version || '';
            const versionParts = versionString.split('.');
            const majorVersion = parseInt(versionParts[0] || '0', 10);
            const minorVersion = parseInt(versionParts[1] || '0', 10);
            
            // Считаем API поддерживаемым, только если оно действительно доступно в объекте webApp
            const hasStarsApi = typeof this.webApp.requestStars === 'function';
            
            // Вместо проверки версии 6.7+ просто проверяем доступность API
            // Это позволит сразу использовать новую версию, если она доступна
            const forceUseModernApi = true; // Форсируем использование современного API
            
            console.log(`[DEBUG] 🔹 Наличие Stars API: ${hasStarsApi}`);
            console.log(`[DEBUG] 🔹 Версия: ${majorVersion}.${minorVersion}`);
            
            if (!hasStarsApi) {
                console.error('[ERROR] ❌ Метод requestStars не найден в WebApp API!');
                console.log('[DEBUG] 🔹 Доступные методы WebApp:', Object.keys(this.webApp).join(', '));
                
                // Используем альтернативный метод - только если Stars API недоступен
                this.showConfirmAndProcess(emblemAmount, starCost, userData, resolve, reject);
                return;
            }

            try {
                // Прямой запрос Stars через Telegram API (новая версия)
                console.log('[DEBUG] 🔹 Запрашиваем Stars напрямую через современный API...');
                
                // Безопасный вызов с проверкой формата колбэка
                this.webApp.requestStars(
                    starCost, 
                    (success: boolean) => {
                        console.log(`[DEBUG] 🔹 Результат Stars API: ${success ? "Успешно" : "Отклонено"}`);
                        
                        if (success) {
                            console.log(`[DEBUG] ✅ Stars успешно списаны: ${starCost} звезд`);
                            
                            // Если пользователь в Telegram, отправляем запрос на сервер для обновления эмблем
                            if (userData && userData.id) {
                                this.notifyServerAboutPurchase(userData.id, emblemAmount, starCost)
                                    .then(() => {
                                        console.log(`[DEBUG] ✅ Сервер успешно уведомлен о покупке`);
                                        resolve(true);
                                    })
                                    .catch(error => {
                                        console.error('[ERROR] ❌ Ошибка при обновлении данных на сервере:', error);
                                        // Даже при ошибке сервера считаем покупку успешной, так как Stars уже списаны
                                        this.showAlert('Звезды списаны, но возникла проблема с начислением эмблем. Пожалуйста, обратитесь в поддержку.');
                                        resolve(true);
                                    });
                            } else {
                                console.log('[WARNING] ⚠️ Нет данных пользователя для уведомления сервера');
                                resolve(true);
                            }
                        } else {
                            console.log('[DEBUG] ❌ Покупка отменена пользователем или не удалась');
                            resolve(false);
                        }
                    }
                );
            } catch (error) {
                console.error('[ERROR] ❌ Ошибка API Stars:', error);
                console.error('[ERROR] ❌ Тип ошибки:', typeof error);
                console.error('[ERROR] ❌ Подробности:', error instanceof Error ? error.message : String(error));
                
                // Если произошла ошибка, пробуем альтернативный метод
                console.log('[DEBUG] 🔹 Пробуем альтернативный метод оплаты...');
                this.showConfirmAndProcess(emblemAmount, starCost, userData, resolve, reject);
            }
        });
    }

    // Альтернативный метод для покупки через диалог подтверждения
    private showConfirmAndProcess(
        emblemAmount: number, 
        starCost: number, 
        userData: any, 
        resolve: (value: boolean) => void, 
        reject: (reason?: any) => void
    ): void {
        try {
            console.log('[DEBUG] 🔹 Используем альтернативный метод оплаты через подтверждение');
            
            // Проверка наличия webApp и метода showConfirm
            if (!this.webApp || typeof this.webApp.showConfirm !== 'function') {
                console.error('[ERROR] ❌ Метод showConfirm не доступен');
                this.showAlert('К сожалению, ваша версия Telegram не поддерживает покупку эмблем. Пожалуйста, обновите приложение.');
                reject(new Error('showConfirm method not available'));
                return;
            }
            
            this.webApp.showConfirm(
                `Вы хотите купить ${emblemAmount} эмблем за ${starCost} звезд?`,
                (confirmed) => {
                    if (!confirmed) {
                        console.log('[DEBUG] 🔹 Пользователь отменил покупку');
                        resolve(false);
                        return;
                    }
                    
                    console.log('[DEBUG] 🔹 Пользователь подтвердил покупку, имитируем успешную оплату');
                    
                    // Если пользователь подтвердил, считаем что оплата прошла успешно
                    // (для тестирования и для версий, где нет прямой оплаты)
                    if (userData && userData.id) {
                        this.notifyServerAboutPurchase(userData.id, emblemAmount, starCost)
                            .then(() => {
                                console.log(`[DEBUG] ✅ Сервер успешно уведомлен о покупке (альт. метод)`);
                                resolve(true);
                            })
                            .catch(error => {
                                console.error('[ERROR] ❌ Ошибка при обновлении данных на сервере (альт. метод):', error);
                                this.showAlert('Возникла проблема с начислением эмблем. Пожалуйста, обратитесь в поддержку.');
                                resolve(false);
                            });
                    } else {
                        console.log('[WARNING] ⚠️ Нет данных пользователя (альт. метод)');
                        resolve(true);
                    }
                }
            );
        } catch (error) {
            console.error('[ERROR] ❌ Ошибка альтернативного метода:', error);
            this.showAlert('Ошибка обработки платежа. Пожалуйста, попробуйте позже.');
            reject(error);
        }
    }

    // Modern method to purchase emblems using Telegram invoice
    public purchaseEmblemsWithInvoice(emblemAmount: number, starCost: number): Promise<boolean> {
        console.log(`[DEBUG] 🔹 Предупреждение: Устаревший метод вызван! Перенаправляем на новый метод`);
        return this.purchaseEmblems(emblemAmount, starCost);
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

    // Вспомогательные методы для отладки
    public getWebAppVersion(): string {
        return this.webApp?.version || 'unknown';
    }

    public getPlatform(): string {
        return this.webApp?.platform || 'unknown';
    }

    public getColorScheme(): string {
        return this.webApp?.colorScheme || 'unknown';
    }

    public getInitData(): string {
        return this.webApp?.initData || 'unknown';
    }

    // Метод для уведомления сервера о покупке
    private async notifyServerAboutPurchase(userId: number, emblemAmount: number, starCost: number): Promise<void> {
        const protocol = window.location.protocol;
        const host = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        const baseUrl = `${protocol}//${host}${port}`;
        
        console.log(`[DEBUG] 🔹 Уведомляем сервер о покупке: ${baseUrl}/api/process-purchase`);
        console.log(`[DEBUG] 🔹 Детали запроса - UserID: ${userId}, Эмблемы: ${emblemAmount}, Звезды: ${starCost}`);
        
        try {
            const response = await fetch(`${baseUrl}/api/process-purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    emblem_amount: emblemAmount,
                    star_cost: starCost,
                    purchase_source: 'stars_api_direct',
                    timestamp: Date.now()
                })
            });
            
            console.log(`[DEBUG] 🔹 Статус ответа сервера: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[ERROR] ❌ Ошибка сервера: ${response.status} - ${errorText}`);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('[DEBUG] 🔹 Ответ сервера:', JSON.stringify(data));
            return data;
        } catch (error) {
            console.error('[ERROR] ❌ Сетевая ошибка при запросе к серверу:', error);
            throw error;
        }
    }
} 
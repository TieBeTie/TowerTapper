export class TelegramService {
    private static instance: TelegramService;
    private webApp: TelegramWebApp | null = null;
    private viewportChangeCallbacks: Array<() => void> = [];
    private botUsername: string = '';

    private constructor() {
        // Получаем экземпляр Telegram WebApp
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
            this.webApp = window.Telegram.WebApp;
            
            // Логируем информацию о WebApp для отладки
            console.log(`[INFO] 📱 Telegram WebApp initialized, version: ${this.webApp.version}`);
            console.log(`[INFO] 📱 Platform: ${this.webApp.platform}`);
            
            // Определяем имя бота из initDataUnsafe, если доступно
            if (this.webApp.initDataUnsafe && this.webApp.initDataUnsafe.user && this.webApp.initDataUnsafe.user.username) {
                // В большинстве случаев имя бота можно получить из initData, но это пример
                // В реальном случае вы бы знали имя своего бота заранее
                this.botUsername = 'TowerTapperBot'; // Задаем имя бота статически
                console.log(`[INFO] 📱 Bot username set to: ${this.botUsername}`);
            }
            
            // Добавляем обработчик изменения viewport
            this.webApp.onEvent('viewportChanged', () => {
                this.viewportChangeCallbacks.forEach(callback => callback());
            });
        } else {
            console.warn('[WARNING] ⚠️ Telegram WebApp not available');
        }
    }

    public static getInstance(): TelegramService {
        if (!TelegramService.instance) {
            TelegramService.instance = new TelegramService();
        }
        return TelegramService.instance;
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
            
            // Проверяем наличие метода requestStars
            if (typeof this.webApp.requestStars !== 'function') {
                console.error('[ERROR] ❌ Метод requestStars не найден в WebApp API!');
                console.log('[DEBUG] 🔹 Доступные методы WebApp:', Object.keys(this.webApp).join(', '));
                reject(new Error('Stars API is not supported in this Telegram version. Update your Telegram app.'));
                return;
            }

            try {
                // Прямой запрос Stars через Telegram API
                console.log('[DEBUG] 🔹 Запрашиваем Stars напрямую через API...');
                
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
                reject(error);
            }
        });
    }

    // Modern method to purchase emblems using Telegram invoice
    public purchaseEmblemsWithInvoice(emblemAmount: number, starCost: number): Promise<boolean> {
        console.log(`[DEBUG] 🔹 Начало процесса покупки ${emblemAmount} эмблем за ${starCost} звезд через Invoice API`);
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
            
            // Проверяем наличие метода openInvoice
            if (typeof this.webApp.openInvoice !== 'function') {
                console.error('[ERROR] ❌ Метод openInvoice не найден в WebApp API!');
                console.log('[DEBUG] 🔹 Пробуем использовать альтернативный метод requestStars...');
                return this.purchaseEmblems(emblemAmount, starCost)
                    .then(result => resolve(result))
                    .catch(error => reject(error));
            }

            try {
                // Формируем URL для запроса инвойса с сервера
                const protocol = window.location.protocol;
                const host = window.location.hostname;
                const port = window.location.port ? `:${window.location.port}` : '';
                const baseUrl = `${protocol}//${host}${port}`;
                const apiUrl = `${baseUrl}/api/create-invoice`;
                
                console.log(`[DEBUG] 🔹 Запрашиваем создание инвойса по URL: ${apiUrl}`);

                // Запрашиваем создание инвойса у сервера
                fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userData?.id || 0,
                        emblem_amount: emblemAmount,
                        star_cost: starCost
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log(`[DEBUG] 🔹 Получен инвойс: ${data.invoice_link}`);
                    
                    // Проверяем, что WebApp все еще доступен
                    if (!this.webApp) {
                        console.error('[ERROR] ❌ Telegram WebApp больше не доступен');
                        reject(new Error('Telegram WebApp not available'));
                        return;
                    }
                    
                    // Открываем инвойс через WebApp API
                    this.webApp.openInvoice(data.invoice_link, (status) => {
                        console.log(`[DEBUG] 🔹 Статус оплаты: ${status}`);
                        
                        if (status === 'paid') {
                            console.log(`[DEBUG] ✅ Оплата успешно выполнена`);
                            
                            // Уведомляем сервер об успешной оплате
                            if (userData && userData.id) {
                                this.notifyServerAboutPurchase(userData.id, emblemAmount, starCost)
                                    .then(() => {
                                        console.log(`[DEBUG] ✅ Сервер успешно уведомлен о покупке`);
                                        resolve(true);
                                    })
                                    .catch(error => {
                                        console.error('[ERROR] ❌ Ошибка при обновлении данных на сервере:', error);
                                        this.showAlert('Платеж успешен, но возникла проблема с начислением эмблем. Пожалуйста, обратитесь в поддержку (/paysupport).');
                                        resolve(true);
                                    });
                            } else {
                                console.log('[WARNING] ⚠️ Нет данных пользователя для уведомления сервера');
                                resolve(true);
                            }
                        } else if (status === 'cancelled') {
                            console.log('[DEBUG] ⚠️ Оплата отменена пользователем');
                            resolve(false);
                        } else if (status === 'failed') {
                            console.log('[ERROR] ❌ Ошибка при выполнении платежа');
                            resolve(false);
                        } else if (status === 'pending') {
                            console.log('[DEBUG] ⏳ Платеж в обработке');
                            // Пока платеж в статусе pending, мы не можем точно сказать, завершился он успешно или нет
                            // Можно реализовать механизм проверки статуса платежа на сервере
                            resolve(false);
                        }
                    });
                })
                .catch(error => {
                    console.error('[ERROR] ❌ Ошибка при создании инвойса:', error);
                    console.log('[DEBUG] 🔹 Пробуем использовать альтернативный метод requestStars...');
                    // Если не удалось создать инвойс, пробуем использовать прямой метод
                    return this.purchaseEmblems(emblemAmount, starCost)
                        .then(result => resolve(result))
                        .catch(error => reject(error));
                });
            } catch (error) {
                console.error('[ERROR] ❌ Ошибка при использовании openInvoice:', error);
                console.log('[DEBUG] 🔹 Пробуем использовать альтернативный метод requestStars...');
                // Если произошла ошибка, пробуем использовать прямой метод
                return this.purchaseEmblems(emblemAmount, starCost)
                    .then(result => resolve(result))
                    .catch(error => reject(error));
            }
        });
    }

    // Метод для запроса поддержки по платежам
    public openPaymentSupport(): void {
        if (!this.webApp) {
            console.error('[ERROR] ❌ Telegram WebApp не доступен');
            return;
        }

        // Используем безопасный метод для открытия ссылки
        if (typeof this.webApp.openLink === 'function') {
            // Отправляем команду /paysupport в бота
            this.webApp.openLink('https://t.me/' + this.botUsername + '?start=paysupport');
        } else {
            console.error('[ERROR] ❌ Метод openLink не найден в WebApp API');
            // Показываем сообщение с инструкцией
            this.showAlert('Пожалуйста, отправьте команду /paysupport боту для получения поддержки по платежам.');
        }
    }

    // Метод для запроса возврата платежа
    public requestRefund(paymentId: string, refundAmount: number, reason: string): Promise<boolean> {
        console.log(`[DEBUG] 🔹 Запрос на возврат средств: платеж ${paymentId}, сумма ${refundAmount}, причина: ${reason}`);
        
        return new Promise((resolve, reject) => {
            if (!this.webApp) {
                console.error('[ERROR] ❌ Telegram WebApp не доступен');
                reject(new Error('Telegram WebApp not available'));
                return;
            }

            const userData = this.getUserData();
            if (!userData || !userData.id) {
                console.error('[ERROR] ❌ Нет данных пользователя для запроса возврата');
                reject(new Error('User data not available'));
                return;
            }

            // Формируем URL для запроса возврата с сервера
            const protocol = window.location.protocol;
            const host = window.location.hostname;
            const port = window.location.port ? `:${window.location.port}` : '';
            const baseUrl = `${protocol}//${host}${port}`;
            const apiUrl = `${baseUrl}/api/refund-payment`;
            
            console.log(`[DEBUG] 🔹 Запрашиваем возврат средств по URL: ${apiUrl}`);

            // Запрашиваем возврат у сервера
            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    payment_id: paymentId,
                    user_id: userData.id,
                    refund_amount: refundAmount,
                    refund_reason: reason
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`[DEBUG] 🔹 Результат запроса на возврат: ${JSON.stringify(data)}`);
                if (data.success) {
                    this.showAlert(`Возврат успешно выполнен: ${data.message}`);
                    resolve(true);
                } else {
                    this.showAlert(`Ошибка при выполнении возврата: ${data.message}`);
                    resolve(false);
                }
            })
            .catch(error => {
                console.error('[ERROR] ❌ Ошибка при запросе возврата:', error);
                this.showAlert('Произошла ошибка при запросе возврата. Пожалуйста, обратитесь в поддержку (/paysupport).');
                reject(error);
            });
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
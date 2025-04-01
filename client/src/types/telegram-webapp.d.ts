declare global {
    type TelegramEventType = 'viewportChanged' | 'themeChanged' | 'mainButtonClicked' | 'popupClosed' | 'paymentFormClosed';

    interface TelegramWebApp {
        ready: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        onEvent: (eventType: TelegramEventType, callback: () => void) => void;
        offEvent: (eventType: TelegramEventType, callback: () => void) => void;
        initDataUnsafe: {
            user?: {
                id: number;
                first_name: string;
                last_name?: string;
                username?: string;
                language_code?: string;
                start_param?: string;
            };
        };
        colorScheme: string;
        viewportHeight: number;
        viewportWidth: number;
        isExpanded: boolean;
        expand: () => void;
        showPopup: (params: {
            title?: string;
            message: string;
            buttons?: Array<{
                id?: string;
                type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
                text: string;
            }>;
        }, callback?: (buttonId: string) => void) => void;
        openInvoice: (url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        requestStars: (amount: number, callback: (success: boolean) => void) => void;
        MainButton: {
            text: string;
            color: string;
            textColor: string;
            isVisible: boolean;
            isActive: boolean;
            isProgressVisible: boolean;
            setText: (text: string) => void;
            onClick: (callback: () => void) => void;
            offClick: (callback: () => void) => void;
            show: () => void;
            hide: () => void;
            enable: () => void;
            disable: () => void;
            showProgress: (leaveActive?: boolean) => void;
            hideProgress: () => void;
        };
    }

    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp;
        };
    }
}

export {}; 
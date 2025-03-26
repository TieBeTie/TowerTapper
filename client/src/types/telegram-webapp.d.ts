declare global {
    type TelegramEventType = 'viewportChanged' | 'themeChanged' | 'mainButtonClicked';

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
    }

    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp;
        };
    }
}

export {}; 
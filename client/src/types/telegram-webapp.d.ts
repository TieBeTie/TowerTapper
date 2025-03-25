declare global {
    interface TelegramWebApp {
        ready: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
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
    }

    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp;
        };
    }
}

export {}; 
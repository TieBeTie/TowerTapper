import { UpgradeType } from '../types/UpgradeType';
import { IUpgradeState } from '../types/UpgradeState';
import { UpgradeStorage } from './UpgradeStorage';

export class UpgradeStateService {
    private static instance: UpgradeStateService;
    private state: Map<UpgradeType, IUpgradeState>;
    private storage: UpgradeStorage;
    
    private constructor() {
        this.storage = new UpgradeStorage();
        this.state = new Map();
    }
    
    public static getInstance(): UpgradeStateService {
        if (!UpgradeStateService.instance) {
            UpgradeStateService.instance = new UpgradeStateService();
        }
        return UpgradeStateService.instance;
    }
    
    // Инициализация при старте игры
    public initialize(): void {
        this.state = this.storage.load();
    }
    
    // Сохранение состояния
    public saveState(type: UpgradeType, level: number): void {
        this.state.set(type, {
            type,
            level,
            lastUpdated: new Date()
        });
        
        // Сохраняем в хранилище
        this.storage.save(this.state);
    }
    
    // Получение состояния
    public getState(type: UpgradeType): number {
        return this.state.get(type)?.level || 1;
    }
    
    // Получение всех состояний
    public getAllStates(): Map<UpgradeType, IUpgradeState> {
        return new Map(this.state);
    }
} 
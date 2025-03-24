import { UpgradeType } from '../types/UpgradeType';
import { IUpgradeState } from '../types/UpgradeState';

export class UpgradeStorage {
    private readonly STORAGE_KEY = 'upgrade_states';
    
    save(states: Map<UpgradeType, IUpgradeState>): void {
        const data = Array.from(states.entries());
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
    
    load(): Map<UpgradeType, IUpgradeState> {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return new Map();
        
        const entries = JSON.parse(data);
        return new Map(entries);
    }
} 
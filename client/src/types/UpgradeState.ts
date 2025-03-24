import { UpgradeType } from './UpgradeType';

export interface IUpgradeState {
    type: UpgradeType;
    level: number;
    lastUpdated: Date;
} 
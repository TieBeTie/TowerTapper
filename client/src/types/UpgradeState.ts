import { UpgradeType } from './UpgradeType';

export interface IUpgradeState {
    type: UpgradeType;
    value: number;
    lastUpdated: Date;
} 
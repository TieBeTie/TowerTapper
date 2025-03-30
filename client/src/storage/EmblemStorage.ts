export class EmblemStorage {
    private static instance: EmblemStorage;
    private emblemCount: number = 0;
    
    private constructor() {}
    
    public static getInstance(): EmblemStorage {
        if (!EmblemStorage.instance) {
            EmblemStorage.instance = new EmblemStorage();
        }
        return EmblemStorage.instance;
    }
    
    saveEmblemCount(count: number): void {
        this.emblemCount = count;
    }
    
    loadEmblemCount(): number {
        return this.emblemCount;
    }

    clear(): void {
        this.emblemCount = 0;
    }
} 
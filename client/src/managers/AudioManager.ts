import Phaser from 'phaser';

const gameVolume: number = 2;  

class AudioManager {
    private static instance: AudioManager;
    private scene: Phaser.Scene;
    private music: Phaser.Sound.BaseSound | null = null;
    private currentMusicKey: string = '';
    private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
    private isMuted: boolean = false;

    private constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initialize();
    }


    public static getInstance(scene: Phaser.Scene): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager(scene);
        } else {
            // Update the scene reference but keep the existing music instance
            AudioManager.instance.scene = scene;
        }
        return AudioManager.instance;
    }

    private initialize(): void {
        try {
            // Check if running on iOS
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            
            // Initialize sounds if they haven't been created yet
            if (this.sounds.size === 0) {
                // Array of sound keys to add
                const soundKeys = ['arrow', 'enemyDie', 'towerDie', 'waveCompleted', 
                                  'upgradeButton', 'towerDamage', 'usualButton', 'crit', 'heal',
                                  'supply_drop', 'gold_collect', 'purchase_sound', 'tower_appearing'];
                
                // Add each sound only if it exists in cache
                soundKeys.forEach(key => {
                    if (this.scene.cache.audio.exists(key)) {
                        const volume = {
                            'arrow': 0.3 * gameVolume,
                            'enemyDie': 0.03 * gameVolume,
                            'towerDie': 0.3 * gameVolume,
                            'waveCompleted': 0.04 * gameVolume,
                            'upgradeButton': 0.1 * gameVolume,
                            'towerDamage': 0.2 * gameVolume,
                            'usualButton': 1 * gameVolume,
                            'crit': 0.25 * gameVolume,
                            'heal': 0.3 * gameVolume,
                            'supply_drop': 0.2 * gameVolume,
                            'gold_collect': 0.15 * gameVolume,
                            'purchase_sound': 0.2 * gameVolume,
                            'tower_appearing': 0.25 * gameVolume
                        }[key] || 0.2 * gameVolume;
                        
                        this.sounds.set(key, this.scene.sound.add(key, { volume }));
                    }
                });
            }
        } catch (err) {
            console.error('Error initializing audio:', err);
        }
    }

    public playMusic(musicKey: string = 'gameMusic'): void {
        if (this.isMuted) {
            return;
        }

        try {
            // Если музыка уже играет и это тот же трек - ничего не делаем
            if (this.music && this.music.isPlaying && this.currentMusicKey === musicKey) {
                return;
            }

            // Сначала останавливаем текущую музыку, если она играет
            if (this.music && this.music.isPlaying) {
                this.music.stop();
            }

            // Проверяем, есть ли этот трек в кеше
            if (this.scene.cache.audio.exists(musicKey)) {
                const volume = {
                    'gameMusic': 0.05 * gameVolume,
                    'emblem_shop': 0.08 * gameVolume,
                    'initial_upgrades_shop': 0.12 * gameVolume
                }[musicKey] || 0.05 * gameVolume;

                // Создаем и запускаем новый трек
                this.music = this.scene.sound.add(musicKey, {
                    loop: true,
                    volume: volume
                });
                
                this.currentMusicKey = musicKey;
                this.music.play();
            } else {
                console.warn(`Music track ${musicKey} not found in audio cache`);
            }
        } catch (err) {
            console.error('Error playing music:', err);
        }
    }

    public stopMusic(): void {
        if (this.music) {
            this.music.stop();
        }
    }

    public playSound(soundKey: string): void {
        if (!this.isMuted && this.sounds.has(soundKey)) {
            const sound = this.sounds.get(soundKey);
            if (sound) {
                sound.play();
            }
        }
    }

    public toggleMute(): void {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopMusic();
        } else {
            this.playMusic(this.currentMusicKey);
        }
    }

    public isSoundMuted(): boolean {
        return this.isMuted;
    }

    public isMusicPlaying(): boolean {
        return this.music ? this.music.isPlaying : false;
    }

    public getCurrentMusicKey(): string {
        return this.currentMusicKey;
    }

    public destroy(): void {
        // Don't destroy music and sounds on scene change
        // The singleton pattern will handle cleanup when the game is closed
        this.stopMusic();
    }

    public hasSoundCached(key: string): boolean {
        return this.scene.cache.audio.exists(key);
    }
}

export default AudioManager;

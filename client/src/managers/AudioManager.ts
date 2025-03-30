import Phaser from 'phaser';

class AudioManager {
    private static instance: AudioManager;
    private scene: Phaser.Scene;
    private music: Phaser.Sound.BaseSound | null = null;
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
            
            // Only initialize if music hasn't been created yet
            if (!this.music) {
                // Check if the audio file exists in cache first
                if (this.scene.cache.audio.exists('gameMusic')) {
                    // Load and play background music with reduced volume
                    this.music = this.scene.sound.add('gameMusic', {
                        loop: true,
                        volume: 0.05
                    });
                    
                    if (isIOS) {
                        console.log('iOS: Successfully created gameMusic audio');
                    }
                } else {
                    console.warn('gameMusic not found in audio cache');
                }
            }

            // Only initialize sounds if they haven't been created yet
            if (this.sounds.size === 0) {
                // Array of sound keys to add
                const soundKeys = ['arrow', 'enemyDie', 'towerDie', 'waveCompleted', 
                                  'upgradeButton', 'towerDamage', 'playButton'];
                
                // Add each sound only if it exists in cache
                soundKeys.forEach(key => {
                    if (this.scene.cache.audio.exists(key)) {
                        const volume = {
                            'arrow': 0.3,
                            'enemyDie': 0.07,
                            'towerDie': 0.3,
                            'waveCompleted': 0.07,
                            'upgradeButton': 0.1,
                            'towerDamage': 0.2,
                            'playButton': 0.2
                        }[key] || 0.2;
                        
                        this.sounds.set(key, this.scene.sound.add(key, { volume }));
                    }
                });
            }
        } catch (err) {
            console.error('Error initializing audio:', err);
        }
    }

    public playMusic(): void {
        if (!this.isMuted && this.music) {
            if (!this.music.isPlaying) {
                this.music.play();
            }
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
            this.playMusic();
        }
    }

    public isSoundMuted(): boolean {
        return this.isMuted;
    }

    public isMusicPlaying(): boolean {
        return this.music ? this.music.isPlaying : false;
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

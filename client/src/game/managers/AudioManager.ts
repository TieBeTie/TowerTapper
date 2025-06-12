import Phaser from 'phaser';

const gameVolume: number = 3;

class AudioManager {
    private static instance: AudioManager;
    private scene: Phaser.Scene;
    private music: Phaser.Sound.BaseSound | null = null;
    private currentMusicKey: string = '';
    private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
    private isMuted: boolean = false;
    private musicRetryTimer: Phaser.Time.TimerEvent | null = null;
    private pendingMusicKey: string = '';
    private audioLoadingComplete: boolean = false;
    private currentSceneKey: string = '';

    private constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initialize();
        this.setupAudioLoadedListener();
    }

    public static getInstance(scene: Phaser.Scene): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager(scene);
        } else {
            // Update the scene reference but keep the existing music instance
            AudioManager.instance.scene = scene;
            AudioManager.instance.setupAudioLoadedListener();
        }
        return AudioManager.instance;
    }

    private setupAudioLoadedListener(): void {
        // Track current scene key
        this.currentSceneKey = this.scene.scene.key;

        // Check if audio is already loaded (global flag from BootScene)
        if ((window as any).audioLoaded) {
            this.audioLoadingComplete = true;
            console.log('[AudioManager] Audio already loaded from previous session');
            return;
        }

        // Listen for global audio loaded event from BootScene
        this.scene.game.events.once('audioLoaded', () => {
            console.log('[AudioManager] Received audioLoaded event');
            this.audioLoadingComplete = true;

            // If we have a pending music request and we're still in the same scene, try to play it now
            if (this.pendingMusicKey && !this.isMuted && this.currentSceneKey === this.scene.scene.key) {
                console.log(`[AudioManager] Audio loaded, attempting to play pending music: ${this.pendingMusicKey}`);
                this.attemptPlayMusic(this.pendingMusicKey);
            }
        });
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
                    'supply_drop', 'gold_collect', 'purchase_sound', 'tower_building'];

                // Add each sound only if it exists in cache
                soundKeys.forEach(key => {
                    if (this.scene.cache.audio.exists(key)) {
                        const volume = {
                            'arrow': 0.1 * gameVolume,
                            'enemyDie': 0.01 * gameVolume,
                            'towerDie': 0.05 * gameVolume,
                            'waveCompleted': 0.02 * gameVolume,
                            'upgradeButton': 0.05 * gameVolume,
                            'towerDamage': 0.05 * gameVolume,
                            'usualButton': 1 * gameVolume,
                            'crit': 0.2 * gameVolume,
                            'heal': 0.2 * gameVolume,
                            'supply_drop': 0.2 * gameVolume,
                            'gold_collect': 0.15 * gameVolume,
                            'purchase_sound': 0.1 * gameVolume,
                            'tower_building': 0.1 * gameVolume
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

        // Update current scene key
        this.currentSceneKey = this.scene.scene.key;

        // Store the requested music key
        this.pendingMusicKey = musicKey;

        // Stop any existing retry timer
        this.stopMusicRetryTimer();

        // If audio loading is complete, try to play immediately
        if (this.audioLoadingComplete) {
            this.attemptPlayMusic(musicKey);
        } else {
            // Audio not ready yet, start retry mechanism
            console.log(`[AudioManager] Audio not ready yet, starting retry mechanism for: ${musicKey}`);
            this.startMusicRetryTimer(musicKey);
        }
    }

    private attemptPlayMusic(musicKey: string): boolean {
        try {
            // Check if we're still in the same scene that requested the music
            if (this.currentSceneKey !== this.scene.scene.key) {
                console.log(`[AudioManager] Scene changed from ${this.currentSceneKey} to ${this.scene.scene.key}, stopping music attempt`);
                this.stopMusicRetryTimer();
                return false;
            }

            // Если музыка уже играет и это тот же трек - ничего не делаем
            if (this.music && this.music.isPlaying && this.currentMusicKey === musicKey) {
                console.log(`[AudioManager] Music ${musicKey} is already playing`);
                this.stopMusicRetryTimer(); // Success, stop retrying
                return true;
            }

            // Сначала останавливаем текущую музыку, если она играет
            if (this.music && this.music.isPlaying) {
                this.music.stop();
            }

            // Проверяем, есть ли этот трек в кеше
            if (this.scene.cache.audio.exists(musicKey)) {
                const volume = {
                    'gameMusic': 0.1 * gameVolume,
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

                console.log(`[AudioManager] Successfully started music: ${musicKey}`);
                this.stopMusicRetryTimer(); // Success, stop retrying
                return true;
            } else {
                console.warn(`[AudioManager] Music track ${musicKey} not found in audio cache, will retry...`);
                return false;
            }
        } catch (err) {
            console.error(`[AudioManager] Error playing music ${musicKey}:`, err);
            return false;
        }
    }

    private startMusicRetryTimer(musicKey: string): void {
        console.log(`[AudioManager] Starting retry timer for music: ${musicKey}`);

        this.musicRetryTimer = this.scene.time.addEvent({
            delay: 3000, // 3 seconds
            callback: () => {
                // Check if we're still in the same scene that requested the music
                if (this.currentSceneKey !== this.scene.scene.key) {
                    console.log(`[AudioManager] Scene changed during retry, stopping attempts for: ${musicKey}`);
                    this.stopMusicRetryTimer();
                    return;
                }

                console.log(`[AudioManager] Retrying to play music: ${musicKey}`);

                // Attempt to play the music
                const success = this.attemptPlayMusic(musicKey);

                if (!success) {
                    console.log(`[AudioManager] Music ${musicKey} still not ready, will retry again in 3 seconds`);
                    // Timer will continue automatically due to loop: true
                } else {
                    console.log(`[AudioManager] Successfully played music ${musicKey} on retry`);
                }
            },
            loop: true
        });
    }

    private stopMusicRetryTimer(): void {
        if (this.musicRetryTimer) {
            this.musicRetryTimer.destroy();
            this.musicRetryTimer = null;
            console.log('[AudioManager] Stopped music retry timer');
        }
    }

    public stopMusic(): void {
        if (this.music) {
            this.music.stop();
        }
        this.stopMusicRetryTimer();
    }

    /**
     * Stop retry mechanism without destroying the AudioManager
     * Called when scene is shutting down but we want to preserve AudioManager instance
     */
    public stopRetryMechanism(): void {
        this.stopMusicRetryTimer();
        this.pendingMusicKey = '';
        console.log('[AudioManager] Stopped retry mechanism for scene shutdown');
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
            // When unmuting, try to play the pending music if we have one
            if (this.pendingMusicKey) {
                this.playMusic(this.pendingMusicKey);
            } else {
                this.playMusic(this.currentMusicKey);
            }
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
        // Stop retry timer
        this.stopMusicRetryTimer();

        // Don't destroy music and sounds on scene change
        // The singleton pattern will handle cleanup when the game is closed
        this.stopMusic();
    }

    public hasSoundCached(key: string): boolean {
        return this.scene.cache.audio.exists(key);
    }
}

export default AudioManager;

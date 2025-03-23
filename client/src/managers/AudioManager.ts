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
        // Only initialize if music hasn't been created yet
        if (!this.music) {
            // Load and play background music with reduced volume
            this.music = this.scene.sound.add('gameMusic', {
                loop: true,
                volume: 0.05    
            });
        }

        // Only initialize sounds if they haven't been created yet
        if (this.sounds.size === 0) {
            // Load sound effects with adjusted volumes
            this.sounds.set('arrow', this.scene.sound.add('arrow', { volume: 0.3 }));
            this.sounds.set('enemyDie', this.scene.sound.add('enemyDie', { volume: 0.07 }));
            this.sounds.set('towerDie', this.scene.sound.add('towerDie', { volume: 0.3 }));
            this.sounds.set('waveCompleted', this.scene.sound.add('waveCompleted', { volume: 0.07 }));
            this.sounds.set('upgradeButton', this.scene.sound.add('upgradeButton', { volume: 0.1 }));
            this.sounds.set('towerDamage', this.scene.sound.add('towerDamage', { volume: 0.2 }));
            this.sounds.set('playButton', this.scene.sound.add('playButton', { volume: 0.2 }));
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

    public destroy(): void {
        // Don't destroy music and sounds on scene change
        // The singleton pattern will handle cleanup when the game is closed
        this.stopMusic();
    }
}

export default AudioManager;

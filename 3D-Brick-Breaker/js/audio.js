const AudioManager = {
    sounds: {},
    music: null,
    musicVolume: 0.5,
    sfxVolume: 0.7,
    initialized: false,

    init() {
        if (this.initialized) return;

        // Create Web Audio API context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Generate sound effects procedurally
        this.sounds = {
            paddleHit: this.createPaddleHitSound(),
            wallHit: this.createWallHitSound(),
            brickHit: this.createBrickHitSound(),
            brickDestroy: this.createBrickDestroySound(),
            powerup: this.createPowerUpSound(),
            launch: this.createLaunchSound(),
            explosion: this.createExplosionSound(),
            laser: this.createLaserSound(),
            loseLife: this.createLoseLifeSound(),
            gameOver: this.createGameOverSound(),
            levelComplete: this.createLevelCompleteSound()
        };

        this.initialized = true;
    },

    play(soundName) {
        // Disabled - placeholder sounds are simple beeps that become annoying
        // TODO: Replace with proper sound effects
        return;

        /* Original implementation:
        if (!this.initialized) this.init();

        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound ${soundName} not found`);
            return;
        }

        // Clone and play the audio
        try {
            const clone = sound.cloneNode();
            clone.volume = this.sfxVolume;
            clone.play().catch(e => console.log('Audio play failed:', e));
        } catch (e) {
            console.log('Audio error:', e);
        }
        */
    },

    playMusic() {
        if (!this.initialized) this.init();

        if (!this.music) {
            // Create background music loop
            this.music = this.createBackgroundMusic();
        }

        if (this.music) {
            this.music.loop = true;
            this.music.volume = this.musicVolume;
            this.music.play().catch(e => console.log('Music play failed:', e));
        }
    },

    pauseMusic() {
        if (this.music) {
            this.music.pause();
        }
    },

    resumeMusic() {
        if (this.music) {
            this.music.play().catch(e => console.log('Music resume failed:', e));
        }
    },

    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    },

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.music) {
            this.music.volume = this.musicVolume;
        }
    },

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    },

    // Sound generation functions using Web Audio API
    createPaddleHitSound() {
        return this.createToneSound(440, 0.1, 'sine', 0.3);
    },

    createWallHitSound() {
        return this.createToneSound(330, 0.08, 'triangle', 0.2);
    },

    createBrickHitSound() {
        return this.createToneSound(550, 0.12, 'square', 0.25);
    },

    createBrickDestroySound() {
        return this.createSweepSound(800, 200, 0.2, 'sawtooth', 0.4);
    },

    createPowerUpSound() {
        return this.createArpeggioSound([523, 659, 784, 1047], 0.4);
    },

    createLaunchSound() {
        return this.createSweepSound(200, 600, 0.15, 'sine', 0.3);
    },

    createExplosionSound() {
        return this.createNoiseSound(0.3, 0.4);
    },

    createLaserSound() {
        return this.createSweepSound(1200, 800, 0.1, 'sawtooth', 0.3);
    },

    createLoseLifeSound() {
        return this.createSweepSound(440, 110, 0.5, 'triangle', 0.4);
    },

    createGameOverSound() {
        return this.createArpeggioSound([440, 392, 349, 294], 0.8);
    },

    createLevelCompleteSound() {
        return this.createArpeggioSound([523, 587, 659, 784, 880], 0.6);
    },

    // Helper function to create a simple tone
    createToneSound(frequency, duration, type = 'sine', volume = 0.3) {
        const audio = document.createElement('audio');
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        // Create a buffer and encode it
        const sampleRate = audioContext.sampleRate;
        const numSamples = Math.floor(sampleRate * duration);
        const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
        const channelData = buffer.getChannelData(0);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);

        // Return a simple audio element with base64 data
        return this.createSimpleBeep(frequency, duration);
    },

    createSimpleBeep(frequency, duration) {
        const audio = new Audio();
        // Using data URI for simple beep
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ4PWqzn77BdGAg+ltryy3kqBSd+zPHaizsIGGS57OihUhELTaTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBQ==';
        return audio;
    },

    createSweepSound(startFreq, endFreq, duration, type = 'sine', volume = 0.3) {
        return this.createSimpleBeep((startFreq + endFreq) / 2, duration);
    },

    createNoiseSound(duration, volume = 0.3) {
        return this.createSimpleBeep(100, duration);
    },

    createArpeggioSound(frequencies, totalDuration) {
        const audio = this.createSimpleBeep(frequencies[0], totalDuration);
        return audio;
    },

    createBackgroundMusic() {
        // Create a simple looping background music
        const audio = new Audio();
        // You can replace this with actual music file
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ4PWqzn77BdGAg+ltryy3kqBSd+zPHaizsIGGS57OihUhELTaTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBSl9y/HajDcJFWS56+mlUxEOTqTi8bllHAU2jdXzzn0uBQ==';
        audio.loop = true;
        return audio;
    }
};

// Initialize audio context on first user interaction
document.addEventListener('click', () => {
    if (!AudioManager.initialized) {
        AudioManager.init();
    }
}, { once: true });

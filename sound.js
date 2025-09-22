// ==================== SOUND MANAGER ====================
const SoundManager = {
    sounds: {},
    enabled: true,
    volume: 0.5,
    audioContext: null,
    masterGain: null,
    
    // Sound definitions
    soundDefinitions: {
        achievement: {
            frequency: [523.25, 659.25, 783.99],
            duration: [0.1, 0.1, 0.2],
            type: 'sine',
            delay: [0, 100, 200]
        },
        levelup: {
            frequency: [523.25, 659.25, 783.99, 1046.50],
            duration: [0.1, 0.1, 0.1, 0.3],
            type: 'sine',
            delay: [0, 100, 200, 300]
        },
        click: {
            frequency: 800,
            duration: 0.05,
            type: 'square'
        },
        complete: {
            frequency: [440, 554.37, 659.25],
            duration: [0.1, 0.1, 0.15],
            type: 'triangle',
            delay: [0, 50, 100]
        },
        error: {
            frequency: [200, 150],
            duration: [0.1, 0.1],
            type: 'sawtooth',
            delay: [0, 100]
        },
        success: {
            frequency: [523.25, 659.25],
            duration: [0.1, 0.1],
            type: 'sine',
            delay: [0, 100]
        },
        add: {
            frequency: 600,
            duration: 0.08,
            type: 'sine'
        },
        delete: {
            frequency: [400, 300],
            duration: [0.08, 0.08],
            type: 'triangle',
            delay: [0, 50]
        }
    },
    
    init() {
        this.loadSettings();
        this.initializeAudioContext();
        this.setupEventListeners();
        this.preloadSounds();
    },
    
    loadSettings() {
        const soundEnabled = localStorage.getItem('soundEnabled');
        const soundVolume = localStorage.getItem('soundVolume');
        
        if (soundEnabled !== null) {
            this.enabled = soundEnabled === 'true';
        }
        
        if (soundVolume !== null) {
            this.volume = parseFloat(soundVolume);
        }
    },
    
    initializeAudioContext() {
        try {
            // Create audio context on first user interaction
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.volume;
        } catch (error) {
            console.warn('AudioContext not supported:', error);
            this.enabled = false;
        }
    },
    
    setupEventListeners() {
        // Setup sound toggle
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.checked = this.enabled;
            soundToggle.addEventListener('change', (e) => {
                this.setEnabled(e.target.checked);
            });
        }
        
        // Setup volume control if exists
        const volumeControl = document.getElementById('sound-volume');
        if (volumeControl) {
            volumeControl.value = this.volume;
            volumeControl.addEventListener('input', (e) => {
                this.setVolume(parseFloat(e.target.value));
            });
        }
        
        // Resume audio context on user interaction
        document.addEventListener('click', this.resumeAudioContext.bind(this), { once: true });
        document.addEventListener('keydown', this.resumeAudioContext.bind(this), { once: true });
    },
    
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.warn('Failed to resume AudioContext:', error);
            }
        }
    },
    
    preloadSounds() {
        // Try to load audio files if available
        this.loadAudioFiles();
    },
    
    loadAudioFiles() {
        const soundFiles = {
            achievement: 'assets/sounds/achievement.mp3',
            levelup: 'assets/sounds/levelup.mp3',
            click: 'assets/sounds/click.mp3',
            complete: 'assets/sounds/complete.mp3'
        };
        
        Object.entries(soundFiles).forEach(([name, path]) => {
            try {
                const audio = new Audio(path);
                audio.addEventListener('canplaythrough', () => {
                    this.sounds[name] = audio;
                }, { once: true });
                
                audio.addEventListener('error', () => {
                    console.log(`Audio file ${name} not found, will use synthesized sound`);
                });
                
                audio.load();
            } catch (error) {
                console.log(`Error loading audio file ${name}:`, error);
            }
        });
    },
    
    play(soundName) {
        if (!this.enabled) return;
        
        try {
            // Resume audio context if needed
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // Try to play audio file first
            if (this.sounds[soundName]) {
                this.playAudioFile(soundName);
            } else {
                // Fall back to synthesized sound
                this.synthesizeSound(soundName);
            }
        } catch (error) {
            console.warn(`Error playing sound ${soundName}:`, error);
        }
    },
    
    playAudioFile(soundName) {
        const audio = this.sounds[soundName];
        if (!audio) return;
        
        // Clone audio to allow overlapping sounds
        const sound = audio.cloneNode();
        sound.volume = this.volume;
        
        sound.play().catch(error => {
            console.warn(`Error playing audio file ${soundName}:`, error);
            // Fall back to synthesized sound
            this.synthesizeSound(soundName);
        });
    },
    
    synthesizeSound(soundName) {
        if (!this.audioContext) return;
        
        const definition = this.soundDefinitions[soundName];
        if (!definition) return;
        
        try {
            if (Array.isArray(definition.frequency)) {
                // Play sequence of notes
                definition.frequency.forEach((freq, index) => {
                    setTimeout(() => {
                        this.playTone(
                            freq,
                            definition.duration[index] || definition.duration,
                            definition.type,
                            definition.gain || 0.3
                        );
                    }, definition.delay[index] || 0);
                });
            } else {
                // Play single note
                this.playTone(
                    definition.frequency,
                    definition.duration,
                    definition.type,
                    definition.gain || 0.3
                );
            }
        } catch (error) {
            console.warn(`Error synthesizing sound ${soundName}:`, error);
        }
    },
    
    playTone(frequency, duration, type = 'sine', gain = 0.3) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        // Apply envelope
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(gain, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    },
    
    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('soundEnabled', enabled);
        
        if (enabled) {
            this.initializeAudioContext();
        }
        
        return enabled;
    },
    
    setVolume(volume) {
        if (volume < 0) volume = 0;
        if (volume > 1) volume = 1;
        
        this.volume = volume;
        localStorage.setItem('soundVolume', volume);
        
        if (this.masterGain) {
            this.masterGain.gain.value = volume;
        }
        
        // Update all loaded audio volumes
        Object.values(this.sounds).forEach(audio => {
            audio.volume = volume;
        });
        
        return volume;
    },
    
    toggle() {
        return this.setEnabled(!this.enabled);
    },
    
    // ==================== ADVANCED SOUND EFFECTS ====================
    playAchievementSound() {
        this.play('achievement');
        // Add extra celebration effect
        setTimeout(() => {
            this.playTone(1046.50, 0.1, 'sine', 0.2);
        }, 300);
    },
    
    playLevelUpSound() {
        this.play('levelup');
        // Add ascending arpeggio
        setTimeout(() => {
            this.playTone(1318.51, 0.15, 'sine', 0.3);
        }, 400);
    },
    
    playErrorSound() {
        this.play('error');
        // Vibration effect if available
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
    },
    
    playSuccessSound() {
        this.play('success');
        // Add confirmation chime
        setTimeout(() => {
            this.playTone(880, 0.1, 'triangle', 0.2);
        }, 150);
    },
    
    // ==================== UTILITY METHODS ====================
    getSupportedFormats() {
        const audio = document.createElement('audio');
        const formats = {};
        
        if (audio.canPlayType) {
            formats.mp3 = audio.canPlayType('audio/mpeg');
            formats.wav = audio.canPlayType('audio/wav');
            formats.ogg = audio.canPlayType('audio/ogg');
            formats.aac = audio.canPlayType('audio/aac');
        }
        
        return formats;
    },
    
    testAudio() {
        if (!this.enabled) {
            showNotification('Sound effects are disabled', 'info');
            return;
        }
        
        // Play test sequence
        this.play('click');
        setTimeout(() => this.play('success'), 200);
        setTimeout(() => this.play('achievement'), 400);
        
        showNotification('Sound test complete!', 'success');
    },
    
    // ==================== VISUALIZER (Optional) ====================
    createVisualizer() {
        if (!this.audioContext) return;
        
        const visualizer = document.createElement('div');
        visualizer.id = 'audio-visualizer';
        visualizer.className = 'fixed bottom-0 left-0 right-0 h-16 bg-black bg-opacity-50 pointer-events-none z-40';
        visualizer.innerHTML = '<canvas id="visualizer-canvas" class="w-full h-full"></canvas>';
        
        document.body.appendChild(visualizer);
        
        const canvas = document.getElementById('visualizer-canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = 64;
        
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.connect(this.masterGain);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            requestAnimationFrame(draw);
            
            analyser.getByteFrequencyData(dataArray);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                
                const r = barHeight + 25 * (i / bufferLength);
                const g = 250 * (i / bufferLength);
                const b = 50;
                
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            visualizer.remove();
        });
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    SoundManager.init();
});

// Export for global access
window.SoundManager = SoundManager;
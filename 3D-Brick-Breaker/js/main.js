// Game State
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    LEVEL_COMPLETE: 'levelComplete'
};

class Game {
    constructor() {
        // Check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            console.error('THREE.js is not loaded!');
            alert('Failed to load 3D engine. Please refresh the page.');
            return;
        }

        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }

        this.state = GameState.MENU;

        // Game stats
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.combo = 0;
        this.comboTimer = 0;

        // Game timing
        this.timeScale = 1.0;  // For smooth transitions and slow-motion effects

        // Obstacle effects
        this.controlsReversed = false;
        this.reverseEffectTimer = 0;

        // Powerup effects
        this.hasShield = false;
        this.shieldHits = 0;
        this.shieldMesh = null;
        this.hasMagnet = false;

        // Active effects tracking
        this.activeEffects = new Map(); // id -> {name, type, duration, startTime}

        // Game objects
        this.paddle = null;
        this.balls = [];
        this.bricks = [];
        this.powerUps = [];
        this.particles = [];
        this.musicalCollectibles = [];

        // Musical collection tracking
        this.collectedMusic = {
            genre: [],
            beat: [],
            melody: [],
            sfx: [],
            tempo: [],
            style: []
        };

        // Keyboard controls
        this.keys = {
            left: false,
            right: false
        };

        // Settings
        this.settings = {
            musicVolume: 0.5,
            sfxVolume: 0.7,
            quality: 'medium'
        };

        // Debug / cheat state
        this.debugUnlocked = (localStorage.getItem('bb_debug_unlocked') === '1');
        this.konamiUnlocked = (localStorage.getItem('bb_konami') === '1');
        this.proceduralMode = (localStorage.getItem('bb_proc_mode') === '1');
        this.cheats = {
            lives: parseInt(localStorage.getItem('bb_cheat_lives') || '3', 10),
            laser: (localStorage.getItem('bb_cheat_laser') === '1'),
            shield: (localStorage.getItem('bb_cheat_shield') === '1'),
            infiniteLives: (localStorage.getItem('bb_cheat_infinite') === '1')
        };

        try {
            this.setupThreeJS();
            this.setupLighting();
        this.setupEventListeners();
        this.setupKonamiCode();
        this.setupMenuDebugUI();
        this.setupUI();

            // Start animation loop
            this.animate();
        } catch (error) {
            console.error('Game initialization failed:', error);
            alert(`Game failed to start: ${error.message}`);
        }
    }

    setupThreeJS() {
        console.log('Setting up Three.js scene...');

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a1a);
        this.scene.fog = new THREE.Fog(0x0a0a1a, 60, 150); // Expanded fog for wider play area

        // Camera - 2.5D perspective for wall view (FULLSCREEN - fills entire viewport)
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(95, aspect, 0.1, 1000);  // Very wide FOV to fill screen
        this.camera.position.set(0, 33, 49.5);  // 10% larger (30*1.1=33, 45*1.1=49.5)
        this.camera.lookAt(0, 33, -1);  // Look at middle of 10% larger vertical range

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Add stars background
        this.createStarfield();

        // Create game boundaries
        this.createBoundaries();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        console.log('Three.js setup complete!');
    }

    setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404060, 0.5);
        this.scene.add(ambient);

        // Main directional light (like sun)
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 15, 10);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 500;
        mainLight.shadow.camera.left = -30;
        mainLight.shadow.camera.right = 30;
        mainLight.shadow.camera.top = 30;
        mainLight.shadow.camera.bottom = -30;
        this.scene.add(mainLight);

        // Fill light from below
        const fillLight = new THREE.DirectionalLight(0x4080ff, 0.3);
        fillLight.position.set(-5, -10, 5);
        this.scene.add(fillLight);

        // Point light that follows the ball
        this.ballLight = new THREE.PointLight(0x00ff88, 1, 20);
        this.ballLight.position.set(0, 0, 2);
        this.scene.add(this.ballLight);

        // Colored rim lights for atmosphere
        const rimLight1 = new THREE.PointLight(0xff0080, 0.5, 40);
        rimLight1.position.set(-15, 5, 10);
        this.scene.add(rimLight1);

        const rimLight2 = new THREE.PointLight(0x00ccff, 0.5, 40);
        rimLight2.position.set(15, 5, 10);
        this.scene.add(rimLight2);
    }

    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3,
            transparent: true,
            opacity: 0.8
        });

        const starsVertices = [];
        for (let i = 0; i < 1000; i++) {
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute('position',
            new THREE.Float32BufferAttribute(starsVertices, 3));

        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
    }

    createBoundaries() {
        // Create glowing floor (10% larger: 90*1.1=99, 120*1.1=132)
        const floorGeometry = new THREE.PlaneGeometry(99, 132);  // 10% larger floor
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x0a0a1a,
            emissiveIntensity: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Grid and wall edges removed for cleaner visual aesthetic
        // this.createWallEdge(-49.5, 33, 0, 132);  // Left wall
        // this.createWallEdge(49.5, 33, 0, 132);   // Right wall
        // this.createWallEdge(0, 33, -25, 99);  // Back wall (this was the green band)
    }

    createWallEdge(x, y, z, length) {
        const geometry = new THREE.BoxGeometry(
            x === 0 ? length : 0.2,
            10,
            z === 0 ? 0.2 : length
        );
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ff88,
            emissive: 0x00ff88,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.3
        });
        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, y + 5, z);
        this.scene.add(wall);
    }

    setupEventListeners() {
        // Mouse movement for paddle control
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Click to launch ball
        document.addEventListener('click', () => this.onMouseClick());

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // UI Button handlers
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('retry-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('next-level-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.getElementById('settings-back-btn').addEventListener('click', () => this.hideSettings());

        // Settings controls
        document.getElementById('music-volume').addEventListener('input', (e) => {
            this.settings.musicVolume = e.target.value / 100;
            AudioManager.setMusicVolume(this.settings.musicVolume);
        });

        document.getElementById('sfx-volume').addEventListener('input', (e) => {
            this.settings.sfxVolume = e.target.value / 100;
            AudioManager.setSFXVolume(this.settings.sfxVolume);
        });

        document.getElementById('quality-select').addEventListener('change', (e) => {
            this.settings.quality = e.target.value;
            this.updateGraphicsQuality();
        });

        // Save-to-app buttons (if present)
        const saveBtnGameOver = document.getElementById('save-to-generator-gameover');
        if (saveBtnGameOver) {
            saveBtnGameOver.addEventListener('click', () => {
                try {
                    this.saveCollectionToLocalStorage();
                    this.showSaveConfirmation();
                } catch (e) {
                    console.error('[Game] Save to Music Generator failed:', e);
                }
            });
        }
        const saveBtnLevel = document.getElementById('save-to-generator-level');
        if (saveBtnLevel) {
            saveBtnLevel.addEventListener('click', () => {
                try {
                    this.saveCollectionToLocalStorage();
                    this.showSaveConfirmation();
                } catch (e) {
                    console.error('[Game] Save to Music Generator failed:', e);
                }
            });
        }
    }

    setupUI() {
        this.updateScore();
        this.updateLives();
        this.updateLevel();
        this.updateCombo();
        this.updateMusicalCollectionUI();
    }

    setupMenuDebugUI() {
        const dev = document.getElementById('dev-options');
        const hint = document.getElementById('secret-hint');
        const secretInput = document.getElementById('secret-code-input');
        const secretBtn = document.getElementById('secret-code-btn');
        const secretSection = document.getElementById('secret-section');
        const levelSel = document.getElementById('level-select');
        const procToggle = document.getElementById('procedural-toggle');
        const livesInput = document.getElementById('cheat-lives');
        const livesMaxBtn = document.getElementById('cheat-lives-max');
        const cheatLaser = document.getElementById('cheat-laser');
        const cheatShield = document.getElementById('cheat-shield');

        if (!dev || !hint || !secretInput || !secretBtn || !levelSel || !procToggle || !livesInput || !livesMaxBtn || !cheatLaser || !cheatShield || !secretSection) {
            return;
        }

        // Show secret section only if Konami was entered
        if (this.konamiUnlocked) {
            secretSection.style.display = 'block';
            hint.textContent = 'Enter a secret code';
        } else {
            secretSection.style.display = 'none';
            hint.textContent = 'Enter Konami code to unlock secret input';
        }

        // Populate level select (1..50)
        if (levelSel.options.length === 0) {
            for (let i = 1; i <= 50; i++) {
                const opt = document.createElement('option');
                opt.value = String(i);
                opt.textContent = `Level ${i}`;
                levelSel.appendChild(opt);
            }
        }

        // Initialize visibility and values
        if (this.debugUnlocked) {
            dev.style.display = 'block';
            hint.textContent = 'Debug options unlocked';
        }
        procToggle.checked = !!this.proceduralMode;
        livesInput.value = String(this.cheats.lives || 3);
        cheatLaser.checked = !!this.cheats.laser;
        cheatShield.checked = !!this.cheats.shield;

        // Secret code handling
        const handleSecret = () => {
            if (!this.konamiUnlocked) {
                hint.textContent = 'Enter Konami code first';
                return;
            }
            const code = (secretInput.value || '').trim().toUpperCase();
            if (!code) return;

            const unlockCodes = ['LEVELUP', 'DEBUG', 'UNLOCK', 'DEVTOOLS'];
            if (unlockCodes.includes(code)) {
                this.debugUnlocked = true;
                localStorage.setItem('bb_debug_unlocked', '1');
                dev.style.display = 'block';
                hint.textContent = 'Debug options unlocked';
                secretInput.value = '';
                return;
            }

            if (code === 'GODMODE') {
                this.cheats.infiniteLives = true;
                localStorage.setItem('bb_cheat_infinite', '1');
                hint.textContent = 'God Mode enabled (infinite lives)';
                secretInput.value = '';
                return;
            }

            if (code === 'EXTRALIFE') {
                const current = parseInt(livesInput.value || '3', 10);
                const next = Math.min(99, current + 5);
                livesInput.value = String(next);
                livesInput.dispatchEvent(new Event('change'));
                hint.textContent = '+5 lives added';
                secretInput.value = '';
                return;
            }

            if (code === 'LASERS') {
                cheatLaser.checked = true;
                cheatLaser.dispatchEvent(new Event('change'));
                hint.textContent = 'Start with Laser enabled';
                secretInput.value = '';
                return;
            }

            hint.textContent = 'Unknown code';
        };
        secretBtn.addEventListener('click', handleSecret);
        secretInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSecret();
        });

        // Bind controls
        procToggle.addEventListener('change', (e) => {
            this.proceduralMode = !!e.target.checked;
            localStorage.setItem('bb_proc_mode', this.proceduralMode ? '1' : '0');
        });
        livesInput.addEventListener('change', (e) => {
            const v = Math.max(1, Math.min(99, parseInt(e.target.value || '3', 10)));
            this.cheats.lives = v;
            e.target.value = String(v);
            localStorage.setItem('bb_cheat_lives', String(v));
        });
        livesMaxBtn.addEventListener('click', () => {
            this.cheats.lives = 99;
            livesInput.value = '99';
            localStorage.setItem('bb_cheat_lives', '99');
        });
        cheatLaser.addEventListener('change', (e) => {
            this.cheats.laser = !!e.target.checked;
            localStorage.setItem('bb_cheat_laser', this.cheats.laser ? '1' : '0');
        });
        cheatShield.addEventListener('change', (e) => {
            this.cheats.shield = !!e.target.checked;
            localStorage.setItem('bb_cheat_shield', this.cheats.shield ? '1' : '0');
        });
    }

    setupKonamiCode() {
        // Konami sequence: Up Up Down Down Left Right Left Right B A
        const sequence = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
        let buffer = [];

        // Subtle on-screen progress indicator (10 dots)
        let indicator, hideTimer;
        const ensureIndicator = () => {
            if (indicator) return indicator;
            const overlay = document.getElementById('ui-overlay') || document.body;
            indicator = document.createElement('div');
            indicator.id = 'konami-indicator';
            indicator.style.position = 'fixed';
            indicator.style.bottom = '16px';
            indicator.style.left = '50%';
            indicator.style.transform = 'translateX(-50%)';
            indicator.style.display = 'none';
            indicator.style.gap = '6px';
            indicator.style.zIndex = '1200';
            indicator.style.pointerEvents = 'none';
            indicator.style.opacity = '0.6';
            indicator.style.filter = 'drop-shadow(0 0 2px rgba(0,0,0,0.6))';
            indicator.style.backdropFilter = 'blur(2px)';

            // Create dots
            for (let i = 0; i < sequence.length; i++) {
                const dot = document.createElement('span');
                dot.style.display = 'inline-block';
                dot.style.width = '6px';
                dot.style.height = '6px';
                dot.style.borderRadius = '50%';
                dot.style.background = 'rgba(255,255,255,0.25)';
                dot.style.transition = 'background 120ms ease, transform 120ms ease';
                indicator.appendChild(dot);
            }
            overlay.appendChild(indicator);
            return indicator;
        };

        const setIndicatorProgress = (count) => {
            const el = ensureIndicator();
            const dots = el.children;
            for (let i = 0; i < dots.length; i++) {
                const active = i < count;
                dots[i].style.background = active ? '#00ff88' : 'rgba(255,255,255,0.25)';
                dots[i].style.transform = active ? 'scale(1.1)' : 'scale(1.0)';
            }
            if (count > 0 && !this.konamiUnlocked) {
                el.style.display = 'flex';
                clearTimeout(hideTimer);
                hideTimer = setTimeout(() => {
                    el.style.display = 'none';
                }, 2500);
            } else if (this.konamiUnlocked) {
                el.style.display = 'none';
            }
        };

        const computeProgress = () => {
            // Longest k such that last k of buffer equals first k of sequence
            const maxK = Math.min(buffer.length, sequence.length);
            for (let k = maxK; k >= 0; k--) {
                let ok = true;
                for (let i = 0; i < k; i++) {
                    if (buffer[buffer.length - k + i] !== sequence[i]) { ok = false; break; }
                }
                if (ok) return k;
            }
            return 0;
        };

        const tryUnlock = () => {
            if (buffer.length > sequence.length) buffer.shift();
            const progress = computeProgress();
            setIndicatorProgress(progress);
            if (progress === sequence.length) {
                this.konamiUnlocked = true;
                localStorage.setItem('bb_konami', '1');
                const secretSection = document.getElementById('secret-section');
                const hint = document.getElementById('secret-hint');
                if (secretSection) secretSection.style.display = 'block';
                if (hint) hint.textContent = 'Secret input unlocked';
                try { AudioManager.play('powerup'); } catch (e) {}
            }
        };

        // Keyboard support
        const onKey = (e) => {
            const key = e.key;
            const norm = (key === 'B') ? 'b' : (key === 'A') ? 'a' : key;
            buffer.push(norm);
            tryUnlock();
        };
        window.addEventListener('keydown', onKey, { passive: true });

        // Touch gesture support
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        const SWIPE_THRESHOLD = 30; // pixels

        const onTouchStart = (e) => {
            if (!e.touches || e.touches.length !== 1) return;
            const t = e.touches[0];
            touchStartX = t.clientX;
            touchStartY = t.clientY;
            touchStartTime = Date.now();
        };

        const onTouchEnd = (e) => {
            const t = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
            if (!t) return;
            const dx = t.clientX - touchStartX;
            const dy = t.clientY - touchStartY;
            const absX = Math.abs(dx);
            const absY = Math.abs(dy);

            let token = null;
            if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) {
                // Consider as tap: left half = 'b', right half = 'a'
                token = (t.clientX < window.innerWidth / 2) ? 'b' : 'a';
            } else if (absX > absY) {
                token = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
            } else {
                token = dy > 0 ? 'ArrowDown' : 'ArrowUp';
            }

            buffer.push(token);
            tryUnlock();
        };

        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchend', onTouchEnd, { passive: true });
    }

    startGame() {
        console.log('[Game] Starting new game');
        this.hideModal('menu');
        this.state = GameState.PLAYING;
        this.score = 0;
        // Pull cheats / level select from UI if unlocked
        const livesInput = document.getElementById('cheat-lives');
        const levelSel = document.getElementById('level-select');
        const dev = document.getElementById('dev-options');
        this.lives = this.debugUnlocked && livesInput ? Math.max(1, parseInt(livesInput.value || '3', 10)) : 3;
        if (this.debugUnlocked && levelSel && dev && dev.style.display !== 'none') {
            const selected = parseInt(levelSel.value || '1', 10);
            this.level = isNaN(selected) ? 1 : selected;
        } else {
            this.level = 1;
        }
        this.combo = 0;

        this.updateScore();
        this.updateLives();
        this.updateLevel();

        // Reset music powerup collection
        if (typeof PowerUpManager !== 'undefined') {
            PowerUpManager.reset();
        }

        this.initLevel();
        console.log('[Game] Game state:', this.state, 'Lives:', this.lives);
        // AudioManager.playMusic();  // Disabled - placeholder music causes constant beeping
    }

    initLevel() {
        console.log('[Game] Initializing level', this.level);

        // Clear existing objects
        this.clearLevel();

        // Create paddle and apply difficulty
        this.paddle = new Paddle(this.scene);
        DifficultyManager.applyToPaddle(this.paddle, this.level);
        console.log('[Game] Paddle created at', this.paddle.position);

        // Create ball attached to paddle and apply difficulty
        const ball = new Ball(this.scene, 0, 2, -1);  // Start above paddle at same Z
        DifficultyManager.applyToBall(ball, this.level);
        ball.attachToPaddle(this.paddle);
        this.balls.push(ball);
        console.log('[Game] Ball created and attached, position:', ball.position, 'attached:', ball.attached);

        // Create bricks for current level
        const bricks = LevelManager.createLevel(this.level, this.scene);

        // Apply difficulty to each brick
        bricks.forEach(brick => {
            DifficultyManager.applyToBrick(brick, this.level);
        });

        this.bricks = bricks;
        console.log('[Game] Created', this.bricks.length, 'bricks');

        // Apply starting cheats (laser/shield)
        const cheatLaser = document.getElementById('cheat-laser');
        const cheatShield = document.getElementById('cheat-shield');
        if (this.debugUnlocked && cheatLaser && cheatLaser.checked && this.paddle) {
            this.paddle.activateLaser(120); // 2 minutes for debugging
        }
        if (this.debugUnlocked && cheatShield && cheatShield.checked) {
            // Simulate shield activation
            try {
                // Use PowerUp helper to create shield visuals and effect
                const pu = new PowerUp(this.scene, 0, 0, -1, PowerUpManager.types.SHIELD);
                pu.activateShield(this);
                // Remove the visual powerup mesh as it isn't needed
                if (pu.mesh) this.scene.remove(pu.mesh);
            } catch (e) {
                // Fallback: minimal shield state
                this.hasShield = true;
                this.shieldHits = 1;
            }
        }

        if (this.bricks.length === 0) {
            console.error('[Game] ERROR: No bricks were created!');
        }
    }

    clearLevel() {
        // Remove all game objects
        if (this.paddle) this.paddle.destroy();
        this.balls.forEach(ball => ball.destroy());
        this.bricks.forEach(brick => brick.destroy());
        this.powerUps.forEach(powerUp => powerUp.destroy());
        this.particles.forEach(particle => particle.destroy());
        this.musicalCollectibles.forEach(collectible => collectible.destroy());

        this.balls = [];
        this.bricks = [];
        this.powerUps = [];
        this.particles = [];
        this.musicalCollectibles = [];
    }

    onMouseMove(event) {
        if (this.state !== GameState.PLAYING || !this.paddle) return;

        const mouse = {
            x: (event.clientX / window.innerWidth) * 2 - 1,
            y: -(event.clientY / window.innerHeight) * 2 + 1
        };

        // Convert mouse position to world position (10% larger: 36 * 1.1 = 39.6)
        const invert = this.controlsReversed ? -1 : 1;
        const targetX = mouse.x * 39.6 * invert; // Scaled for enlarged playfield, reversed when effect active
        this.paddle.setTargetX(targetX);
    }

    onMouseClick() {
        if (this.state === GameState.PLAYING) {
            this.launchBalls();
        }
    }

    onKeyDown(event) {
        // Launch ball
        if (event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            if (this.state === GameState.PLAYING) {
                this.launchBalls();
            }
        }

        // Pause
        if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
            event.preventDefault();
            if (this.state === GameState.PLAYING) {
                this.pauseGame();
            } else if (this.state === GameState.PAUSED) {
                this.resumeGame();
            }
        }

        // Paddle movement - Left
        if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
            event.preventDefault();
            this.keys.left = true;
        }

        // Paddle movement - Right
        if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
            event.preventDefault();
            this.keys.right = true;
        }
    }

    onKeyUp(event) {
        // Paddle movement - Left
        if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
            event.preventDefault();
            this.keys.left = false;
        }

        // Paddle movement - Right
        if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
            event.preventDefault();
            this.keys.right = false;
        }
    }

    launchBalls() {
        console.log('[Game] Launching balls, count:', this.balls.length);
        this.balls.forEach(ball => {
            if (ball.attached) {
                console.log('[Game] Launching ball from position:', ball.position);
                ball.launch();
                console.log('[Game] Ball launched with velocity:', ball.velocity);
                AudioManager.play('launch');
            }
        });
    }

    pauseGame() {
        this.state = GameState.PAUSED;
        this.showModal('pause-menu');
        AudioManager.pauseMusic();
    }

    resumeGame() {
        this.state = GameState.PLAYING;
        this.hideModal('pause-menu');
        AudioManager.resumeMusic();
    }

    restartGame() {
        this.hideModal('pause-menu');
        this.hideModal('game-over');
        this.startGame();
    }

    quitToMenu() {
        this.state = GameState.MENU;
        this.hideModal('pause-menu');
        this.hideModal('game-over');
        this.showModal('menu');
        this.clearLevel();
        AudioManager.stopMusic();
    }

    nextLevel() {
        this.level++;

        // Smooth fade out modal
        const modal = document.getElementById('level-complete');
        let opacity = 1;
        const fadeOut = setInterval(() => {
            opacity -= 0.05;
            modal.style.opacity = opacity.toString();
            if (opacity <= 0) {
                clearInterval(fadeOut);
                this.hideModal('level-complete');

                // Initialize new level with animation
                this.updateLevel();
                this.initLevelWithAnimation();
            }
        }, 16);
    }

    initLevelWithAnimation() {
        console.log('[Game] Initializing level', this.level, 'with smooth intro');

        // Show level preview
        this.showLevelPreview();

        // Clear existing objects
        this.clearLevel();

        // Update background color based on level tier
        this.updateBackgroundColor();

        // Create paddle and apply difficulty
        this.paddle = new Paddle(this.scene);
        DifficultyManager.applyToPaddle(this.paddle, this.level);

        // Create ball attached to paddle and apply difficulty
        const ball = new Ball(this.scene, 0, 2, -1);
        DifficultyManager.applyToBall(ball, this.level);
        ball.attachToPaddle(this.paddle);
        this.balls.push(ball);

        // Create bricks with fade-in animation
        const bricks = LevelManager.createLevel(this.level, this.scene);

        // Apply difficulty to each brick
        bricks.forEach(brick => {
            DifficultyManager.applyToBrick(brick, this.level);
        });

        this.bricks = bricks;

        // Show difficulty changes (if any)
        if (this.level > 1) {
            setTimeout(() => {
                DifficultyManager.showChanges(this.level);
            }, 500); // Show after level intro starts
        }

        // Fade in bricks row by row
        bricks.forEach((brick, index) => {
            if (brick.mesh) {
                brick.mesh.material.opacity = 0;
                brick.mesh.material.transparent = true;

                // Stagger fade-in based on Y position (row)
                const delay = index * 30;  // 30ms between each brick
                setTimeout(() => {
                    let opacity = 0;
                    const fadeIn = setInterval(() => {
                        opacity += 0.05;
                        if (brick.mesh && brick.mesh.material) {
                            brick.mesh.material.opacity = opacity;
                        }
                        if (opacity >= 1) {
                            clearInterval(fadeIn);
                            if (brick.mesh && brick.mesh.material) {
                                brick.mesh.material.transparent = false;
                            }
                        }
                    }, 16);
                }, delay);
            }
        });

        // Resume game after intro
        setTimeout(() => {
            this.state = GameState.PLAYING;
            console.log('[Game] Level intro complete, game resumed');
        }, bricks.length * 30 + 500);  // Wait for all bricks + buffer
    }

    showSettings() {
        this.hideModal('menu');
        this.showModal('settings-menu');
    }

    hideSettings() {
        this.hideModal('settings-menu');
        this.showModal('menu');
    }

    gameOver() {
        this.state = GameState.GAME_OVER;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-level').textContent = this.level;
        this.showModal('game-over');
        AudioManager.play('gameOver');
        AudioManager.stopMusic();
        // Render collected musical elements summary
        this.renderCollectedMusicSummary('collected-summary-gameover');
    }

    levelComplete() {
        this.state = GameState.LEVEL_COMPLETE;

        // Victory celebration phase (smooth slow-motion)
        this.timeScale = 0.5;  // Slow down for dramatic effect

        // Screen shake effect
        this.triggerScreenShake(1.0, 800);

        // Camera zoom effect
        this.triggerCameraZoom();

        // Create victory particles
        this.createVictoryEffect();

        // Flash background color
        this.flashBackgroundColor();

        // Calculate bonuses
        const levelBonus = this.level * 1000;
        this.score += levelBonus;

        // Update UI after short delay for celebration
        setTimeout(() => {
            this.timeScale = 1.0;  // Restore normal speed
            document.getElementById('level-score').textContent = this.score;
            document.getElementById('level-bonus').textContent = levelBonus;

            // Show collected music powerups summary
            this.showCollectedPowerups();
            // Also show musical collectible summary
            this.renderCollectedMusicSummary('collected-summary-level');

            // Smooth fade-in modal
            const modal = document.getElementById('level-complete');
            modal.style.opacity = '0';
            this.showModal('level-complete');

            // Fade in animation
            let opacity = 0;
            const fadeIn = setInterval(() => {
                opacity += 0.05;
                modal.style.opacity = opacity.toString();
                if (opacity >= 1) clearInterval(fadeIn);
            }, 16);

            AudioManager.play('levelComplete');
        }, 2000);  // 2 second celebration
    }

    createVictoryEffect() {
        // Create massive particle explosion at center
        if (this.paddle) {
            // Multiple waves of particles
            for (let wave = 0; wave < 3; wave++) {
                setTimeout(() => {
                    // Gold particles
                    for (let i = 0; i < 50; i++) {
                        const particle = new Particle(
                            this.scene,
                            this.paddle.position.x,
                            this.paddle.position.y + 8,
                            this.paddle.position.z,
                            wave === 0 ? 0xffd700 : (wave === 1 ? 0xff69b4 : 0x00ffff)  // Gold, pink, cyan
                        );
                        const angle = (i / 50) * Math.PI * 2 + wave * 0.5;
                        const speed = 10 + wave * 3;
                        particle.velocity.x = Math.cos(angle) * speed;
                        particle.velocity.y = Math.sin(angle) * speed + 8;
                        particle.velocity.z = (Math.random() - 0.5) * 6;
                        this.particles.push(particle);
                    }
                }, wave * 200);
            }
        }

        // Paddle victory glow pulse
        if (this.paddle && this.paddle.paddleMesh) {
            let glowIntensity = 0.5;
            const glowPulse = setInterval(() => {
                glowIntensity = glowIntensity === 0.5 ? 2.5 : 0.5;
                if (this.paddle && this.paddle.paddleMesh) {
                    this.paddle.paddleMesh.material.emissiveIntensity = glowIntensity;
                }
            }, 200);

            setTimeout(() => {
                clearInterval(glowPulse);
                if (this.paddle && this.paddle.paddleMesh) {
                    this.paddle.paddleMesh.material.emissiveIntensity = 0.5;
                }
            }, 2000);
        }
    }

    triggerScreenShake(intensity = 1.0, duration = 500) {
        // Screen shake effect via canvas transform
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;

        const startTime = Date.now();
        const originalTransform = canvas.style.transform || '';

        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > duration) {
                canvas.style.transform = originalTransform;
                return;
            }

            const progress = elapsed / duration;
            const currentIntensity = intensity * (1 - progress); // Fade out shake
            const x = (Math.random() - 0.5) * currentIntensity * 10;
            const y = (Math.random() - 0.5) * currentIntensity * 10;

            canvas.style.transform = `translate(${x}px, ${y}px)`;
            requestAnimationFrame(shake);
        };

        shake();
    }

    triggerCameraZoom() {
        // Smooth camera zoom in and out
        const originalZ = this.camera.position.z;
        const targetZ = originalZ - 5; // Zoom in
        let progress = 0;

        const zoomIn = setInterval(() => {
            progress += 0.05;
            if (progress >= 1) {
                clearInterval(zoomIn);
                this.camera.position.z = targetZ;

                // Zoom back out
                progress = 0;
                const zoomOut = setInterval(() => {
                    progress += 0.03;
                    if (progress >= 1) {
                        clearInterval(zoomOut);
                        this.camera.position.z = originalZ;
                    } else {
                        this.camera.position.z = targetZ + (originalZ - targetZ) * progress;
                    }
                }, 16);
            } else {
                this.camera.position.z = originalZ + (targetZ - originalZ) * progress;
            }
        }, 16);
    }

    flashBackgroundColor() {
        // Flash the background with victory colors
        const originalColor = this.scene.background;

        const colors = [
            new THREE.Color(0xffd700), // Gold
            new THREE.Color(0xff69b4), // Pink
            new THREE.Color(0x00ffff), // Cyan
            originalColor
        ];

        let colorIndex = 0;
        const flashInterval = setInterval(() => {
            this.scene.background = colors[colorIndex];
            colorIndex++;

            if (colorIndex >= colors.length) {
                clearInterval(flashInterval);
            }
        }, 200);
    }

    updateBackgroundColor() {
        // Gradually shift background color based on level tier
        let targetColor;

        if (this.level <= 3) {
            // Tutorial: Deep blue
            targetColor = new THREE.Color(0x001133);
        } else if (this.level <= 6) {
            // Early: Blue-purple
            targetColor = new THREE.Color(0x0a0a2e);
        } else if (this.level <= 10) {
            // Mid: Purple
            targetColor = new THREE.Color(0x1a0a3e);
        } else if (this.level <= 15) {
            // Advanced: Deep purple-red
            targetColor = new THREE.Color(0x2e0a2e);
        } else {
            // Master: Dark red
            targetColor = new THREE.Color(0x2e0a0a);
        }

        // Smooth color transition
        const currentColor = this.scene.background;
        let progress = 0;

        const colorTransition = setInterval(() => {
            progress += 0.02;
            if (progress >= 1) {
                clearInterval(colorTransition);
                this.scene.background = targetColor;
            } else {
                this.scene.background = new THREE.Color().lerpColors(currentColor, targetColor, progress);
            }
        }, 16);
    }

    showCollectedPowerups() {
        // Display collected music data in level complete screen
        const container = document.getElementById('collected-powerups');
        if (!container) return;

        container.innerHTML = '<h4>Music Collected:</h4>';

        if (typeof PowerUpManager !== 'undefined') {
            const collected = PowerUpManager.collected;

            // Show genres
            if (Object.keys(collected.genres).length > 0) {
                container.innerHTML += '<div class="collected-category">';
                container.innerHTML += '<strong>Genres:</strong> ';
                container.innerHTML += Object.entries(collected.genres)
                    .map(([genre, count]) => `${genre} (${count}x)`)
                    .join(', ');
                container.innerHTML += '</div>';
            }

            // Show style tags
            if (collected.styleTags.length > 0) {
                container.innerHTML += '<div class="collected-category">';
                container.innerHTML += '<strong>Styles:</strong> ' + collected.styleTags.join(', ');
                container.innerHTML += '</div>';
            }

            // Show keywords
            if (collected.keywords.length > 0) {
                container.innerHTML += '<div class="collected-category">';
                container.innerHTML += '<strong>Keywords:</strong> ' + collected.keywords.join(', ');
                container.innerHTML += '</div>';
            }
        }
    }

    renderCollectedMusicSummary(targetId) {
        const target = document.getElementById(targetId);
        if (!target) return;

        const categories = [
            { key: 'genre', label: 'Genres' },
            { key: 'style', label: 'Styles' },
            { key: 'beat', label: 'Beats' },
            { key: 'melody', label: 'Melodies' },
            { key: 'sfx', label: 'SFX' },
            { key: 'tempo', label: 'Tempos' },
        ];

        let html = '<h4>Musical Elements:</h4>';
        let any = false;
        categories.forEach(cat => {
            const items = (this.collectedMusic && this.collectedMusic[cat.key]) || [];
            if (items.length > 0) {
                any = true;
                html += `<div class="collected-category"><strong>${cat.label}:</strong> ${items.join(', ')}</div>`;
            }
        });

        if (!any) {
            html += '<div style="opacity:0.8">No musical elements collected yet.</div>';
        } else {
            const totalCount = Object.values(this.collectedMusic).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);
            html += `<div style=\"margin-top:8px; font-size:12px; opacity:0.8;\">Total saved: ${totalCount}. Open Music Generator to import.</div>`;
        }

        target.innerHTML = html;
    }

    showSaveConfirmation() {
        // Simple ephemeral toast centered at bottom
        const toast = document.createElement('div');
        toast.textContent = 'Saved to Music Generator';
        toast.style.position = 'fixed';
        toast.style.left = '50%';
        toast.style.bottom = '40px';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = 'rgba(0,0,0,0.8)';
        toast.style.color = '#00ff88';
        toast.style.padding = '10px 16px';
        toast.style.border = '1px solid #00ff88';
        toast.style.borderRadius = '8px';
        toast.style.zIndex = '1000';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.2s ease-in';
        document.body.appendChild(toast);
        requestAnimationFrame(() => { toast.style.opacity = '1'; });
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 250);
        }, 1500);
    }

    showModal(id) {
        document.getElementById(id).classList.remove('hidden');
    }

    hideModal(id) {
        document.getElementById(id).classList.add('hidden');
    }

    updateScore() {
        document.getElementById('score').textContent = this.score.toString().padStart(6, '0');
    }

    updateLives() {
        document.getElementById('lives').textContent = this.lives;
    }

    updateLevel() {
        document.getElementById('level').textContent = this.level;
    }

    updateCombo() {
        const comboEl = document.getElementById('combo');
        comboEl.textContent = this.combo > 0 ? `${this.combo}x` : '0x';

        if (this.combo > 1) {
            comboEl.classList.add('active');
            setTimeout(() => comboEl.classList.remove('active'), 500);
        }
    }

    addScore(points) {
        const multiplier = Math.max(1, this.combo);
        this.score += points * multiplier;
        this.updateScore();
        this.combo++;
        this.comboTimer = 2.0; // 2 seconds to keep combo
        this.updateCombo();
    }

    resetCombo() {
        this.combo = 0;
        this.comboTimer = 0;
        this.updateCombo();
    }

    loseLife() {
        // Infinite lives cheat
        if (this.cheats && this.cheats.infiniteLives) {
            // Reset ball without decrementing lives
            setTimeout(() => {
                const ball = new Ball(this.scene, 0, -8, 2);
                DifficultyManager.applyToBall(ball, this.level);
                ball.attachToPaddle(this.paddle);
                this.balls.push(ball);
            }, 500);
            AudioManager.play('powerup');
            return;
        }
        // Check if shield can absorb the hit
        if (this.hasShield && this.shieldHits > 0) {
            this.shieldHits--;

            // Show shield block effect
            if (this.shieldMesh) {
                this.shieldMesh.material.opacity = 0.6;
                setTimeout(() => {
                    if (this.shieldMesh) {
                        this.shieldMesh.material.opacity = 0.2;
                    }
                }, 200);
            }

            // If shield is depleted, remove it
            if (this.shieldHits <= 0) {
                this.hasShield = false;
                if (this.shieldMesh) {
                    this.shieldMesh.visible = false;
                }
                if (this.shieldTimeout) {
                    clearTimeout(this.shieldTimeout);
                }
            }

            AudioManager.play('powerup'); // Shield block sound

            // Reset ball without losing life
            setTimeout(() => {
                const ball = new Ball(this.scene, 0, -8, 2);
                DifficultyManager.applyToBall(ball, this.level);
                ball.attachToPaddle(this.paddle);
                this.balls.push(ball);
            }, 1000);

            return; // Don't lose a life
        }

        // No shield - lose a life
        this.lives--;
        this.updateLives();
        this.resetCombo();
        AudioManager.play('loseLife');

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset ball
            setTimeout(() => {
                const ball = new Ball(this.scene, 0, -8, 2);
                DifficultyManager.applyToBall(ball, this.level);
                ball.attachToPaddle(this.paddle);
                this.balls.push(ball);
            }, 1000);
        }
    }

    update(deltaTime) {
        if (this.state !== GameState.PLAYING) return;

        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }

        // Handle keyboard paddle movement (invert when controls are reversed)
        if (this.paddle) {
            const keyboardSpeed = 49.5; // Units per second (10% faster: 45 * 1.1)
            const dir = this.controlsReversed ? -1 : 1;

            if (this.keys.left) {
                const newX = this.paddle.position.x - keyboardSpeed * deltaTime * dir;
                this.paddle.setTargetX(newX);
            }

            if (this.keys.right) {
                const newX = this.paddle.position.x + keyboardSpeed * deltaTime * dir;
                this.paddle.setTargetX(newX);
            }
        }

        // Update paddle
        if (this.paddle) {
            this.paddle.update(deltaTime);
        }

        // Update bricks
        this.bricks.forEach(brick => {
            brick.update(deltaTime);
        });

        // Update balls
        this.balls.forEach((ball, index) => {
            ball.update(deltaTime);

            // Check if ball is out of bounds (below paddle area)
            if (ball.position.y < -3) {
                console.log('[Game] Ball out of bounds at position:', ball.position, 'attached:', ball.attached);
                ball.destroy();
                this.balls.splice(index, 1);

                if (this.balls.length === 0) {
                    console.log('[Game] All balls lost, losing life');
                    this.loseLife();
                }
            }

            // Update ball light position
            if (this.balls.length > 0) {
                this.ballLight.position.copy(this.balls[0].position);
            }
        });

        // Update power-ups
        this.powerUps.forEach((powerUp, index) => {
            powerUp.update(deltaTime);

            if (powerUp.position.y < -5 || powerUp.collected) {
                powerUp.destroy();
                this.powerUps.splice(index, 1);
            }
        });

        // Update particles
        this.particles.forEach((particle, index) => {
            particle.update(deltaTime);

            if (particle.isDead()) {
                particle.destroy();
                this.particles.splice(index, 1);
            }
        });

        // Update musical collectibles
        this.musicalCollectibles.forEach((collectible, index) => {
            const alive = collectible.update(deltaTime);

            // Check paddle collision
            if (this.paddle && collectible.checkPaddleCollision(this.paddle)) {
                this.musicalCollectibles.splice(index, 1);
                return;
            }

            // Remove if dead or out of bounds
            if (!alive || collectible.position.y < -10) {
                collectible.destroy();
                this.musicalCollectibles.splice(index, 1);
            }
        });

        // Update shield visual
        if (this.shieldMesh && this.hasShield) {
            // Pulse animation
            const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 0.2;
            this.shieldMesh.material.opacity = pulse;

            // Rotate shield
            this.shieldMesh.rotation.y += deltaTime * 0.5;
        }

        // Update obstacle effect timers
        if (this.reverseEffectTimer > 0) {
            this.reverseEffectTimer -= deltaTime;
            if (this.reverseEffectTimer <= 0) {
                this.controlsReversed = false;
                console.log('[Game] Reverse effect ended');
            }
        }

        // Check collisions
        PhysicsManager.checkCollisions(this);

        // Update active effects display every frame
        this.updateActiveEffectsDisplay();

        // Check level complete (exclude unbreakable obstacle bricks)
        const breakableBricks = this.bricks.filter(brick => !brick.destroyed && !brick.isUnbreakable);
        if (breakableBricks.length === 0) {
            console.log('[Game] All breakable bricks destroyed, level complete!');
            this.levelComplete();
        }
    }

    onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateGraphicsQuality() {
        switch (this.settings.quality) {
            case 'low':
                this.renderer.setPixelRatio(1);
                this.renderer.shadowMap.enabled = false;
                break;
            case 'medium':
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                this.renderer.shadowMap.enabled = true;
                break;
            case 'high':
                this.renderer.setPixelRatio(window.devicePixelRatio);
                this.renderer.shadowMap.enabled = true;
                break;
        }
    }

    // Active Effects Management
    addActiveEffect(id, name, type, duration, icon = '⚡') {
        this.activeEffects.set(id, {
            name,
            type, // 'positive' or 'negative'
            duration,
            startTime: Date.now(),
            icon
        });
        this.updateActiveEffectsDisplay();
    }

    removeActiveEffect(id) {
        this.activeEffects.delete(id);
        this.updateActiveEffectsDisplay();
    }

    updateActiveEffectsDisplay() {
        const container = document.getElementById('active-effects');
        if (!container) return;

        // Clear existing
        container.innerHTML = '';

        // Add each active effect
        this.activeEffects.forEach((effect, id) => {
            const elapsed = (Date.now() - effect.startTime) / 1000;
            const remaining = Math.max(0, effect.duration - elapsed);

            // Auto-remove expired effects
            if (remaining <= 0) {
                this.activeEffects.delete(id);
                return;
            }

            const effectEl = document.createElement('div');
            effectEl.className = `active-effect ${effect.type}`;
            effectEl.innerHTML = `
                <span class="icon">${effect.icon}</span>
                <span class="name">${effect.name}</span>
                <span class="timer">${Math.ceil(remaining)}s</span>
            `;

            container.appendChild(effectEl);
        });
    }

    showLevelPreview() {
        // Show level info on start
        const levelInfo = document.createElement('div');
        levelInfo.style.position = 'fixed';
        levelInfo.style.top = '30%';
        levelInfo.style.left = '50%';
        levelInfo.style.transform = 'translateX(-50%)';
        levelInfo.style.background = 'rgba(0, 0, 0, 0.9)';
        levelInfo.style.padding = '30px 50px';
        levelInfo.style.borderRadius = '20px';
        levelInfo.style.border = '3px solid #00ff88';
        levelInfo.style.zIndex = '1000';
        levelInfo.style.textAlign = 'center';
        levelInfo.style.fontSize = '36px';
        levelInfo.style.fontWeight = 'bold';
        levelInfo.style.color = '#00ff88';
        levelInfo.style.textShadow = '0 0 20px #00ff88';
        levelInfo.style.animation = 'pulse 0.5s ease';

        // Get level tier name
        let tierName = 'Tutorial';
        if (this.level > 15) tierName = 'Master';
        else if (this.level > 10) tierName = 'Advanced';
        else if (this.level > 6) tierName = 'Expert';
        else if (this.level > 3) tierName = 'Challenge';

        levelInfo.innerHTML = `
            <div style="font-size: 18px; opacity: 0.7; margin-bottom: 10px;">${tierName}</div>
            <div>LEVEL ${this.level}</div>
            <div style="font-size: 18px; opacity: 0.7; margin-top: 10px;">GET READY!</div>
        `;

        document.body.appendChild(levelInfo);

        // Remove after 2 seconds
        setTimeout(() => {
            levelInfo.style.opacity = '0';
            levelInfo.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (levelInfo.parentNode) {
                    document.body.removeChild(levelInfo);
                }
            }, 500);
        }, 2000);
    }

    collectMusicalElement(type, value, data) {
        // Add to collection
        if (!this.collectedMusic[type].includes(value)) {
            this.collectedMusic[type].push(value);
            console.log(`[Game] Collected ${type}: ${value}`);
        }

        // Update UI
        this.updateMusicalCollectionUI();

        // Auto-save to localStorage for Music Generator integration
        this.saveCollectionToLocalStorage();

        // Add score bonus
        this.addScore(50);
    }

    saveCollectionToLocalStorage() {
        try {
            const totalCount = Object.values(this.collectedMusic).reduce((sum, arr) => sum + arr.length, 0);

            const payload = {
                timestamp: Date.now(),
                version: '1.0',
                collections: this.collectedMusic,
                stats: {
                    totalGenres: this.collectedMusic.genre.length,
                    totalBeats: this.collectedMusic.beat.length,
                    totalMelodies: this.collectedMusic.melody.length,
                    totalSFX: this.collectedMusic.sfx.length,
                    totalTempos: this.collectedMusic.tempo.length,
                    totalStyles: this.collectedMusic.style.length,
                    total: totalCount
                }
            };

            localStorage.setItem('musicGenerator_brickBreakerCollected', JSON.stringify(payload));
            console.log('[Game] Saved', totalCount, 'musical elements to localStorage');
        } catch (e) {
            console.error('[Game] Failed to save to localStorage:', e);
        }
    }

    updateMusicalCollectionUI() {
        const collectionList = document.getElementById('collection-list');
        if (!collectionList) return;

        let html = '';

        // Display collected items by category
        const categories = [
            { key: 'genre', label: 'Genres', icon: '🎵', color: '#ff6b9d' },
            { key: 'beat', label: 'Beats', icon: '🥁', color: '#4ecdc4' },
            { key: 'melody', label: 'Melodies', icon: '🎹', color: '#ffe66d' },
            { key: 'sfx', label: 'SFX', icon: '🔊', color: '#95e1d3' },
            { key: 'tempo', label: 'Tempos', icon: '⏱️', color: '#f38181' },
            { key: 'style', label: 'Styles', icon: '✨', color: '#aa96da' }
        ];

        categories.forEach(cat => {
            const items = this.collectedMusic[cat.key];
            if (items.length > 0) {
                html += `<div style="margin-bottom: 10px;">`;
                html += `<strong style="color: ${cat.color};">${cat.icon} ${cat.label} (${items.length})</strong><br/>`;
                items.forEach(item => {
                    html += `<span style="font-size: 10px; opacity: 0.8;">• ${item}</span><br/>`;
                });
                html += `</div>`;
            }
        });

        if (html === '') {
            html = '<div style="opacity: 0.5; text-align: center;">Break bricks to collect<br/>musical elements!</div>';
        } else {
            // Add auto-save indicator
            const totalCount = Object.values(this.collectedMusic).reduce((sum, arr) => sum + arr.length, 0);
            html += `<div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(0,255,136,0.3); font-size: 10px; opacity: 0.7; text-align: center;">
                💾 ${totalCount} element${totalCount !== 1 ? 's' : ''} saved<br/>
                <span style="font-size: 9px; opacity: 0.8;">Open Music Generator to import</span>
            </div>`;
        }

        collectionList.innerHTML = html;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const baseDeltaTime = 0.016; // Approximately 60 FPS
        const deltaTime = baseDeltaTime * this.timeScale;  // Apply time scaling for smooth transitions

        // Rotate stars slowly
        if (this.stars) {
            this.stars.rotation.y += 0.0001;
        }

        this.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

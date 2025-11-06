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

        try {
            this.setupThreeJS();
            this.setupLighting();
            this.setupEventListeners();
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

        // Grid removed for cleaner visual aesthetic

        // Create side walls (10% larger: 45*1.1=49.5, 30*1.1=33, 120*1.1=132, 90*1.1=99)
        this.createWallEdge(-49.5, 33, 0, 132);  // Left wall (10% larger)
        this.createWallEdge(49.5, 33, 0, 132);   // Right wall (10% larger)
        this.createWallEdge(0, 33, -25, 99);  // Back wall (10% larger)
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
    }

    setupUI() {
        this.updateScore();
        this.updateLives();
        this.updateLevel();
        this.updateCombo();
    }

    startGame() {
        console.log('[Game] Starting new game');
        this.hideModal('menu');
        this.state = GameState.PLAYING;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
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
        AudioManager.playMusic();
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

        this.balls = [];
        this.bricks = [];
        this.powerUps = [];
        this.particles = [];
    }

    onMouseMove(event) {
        if (this.state !== GameState.PLAYING || !this.paddle) return;

        const mouse = {
            x: (event.clientX / window.innerWidth) * 2 - 1,
            y: -(event.clientY / window.innerHeight) * 2 + 1
        };

        // Convert mouse position to world position (10% larger: 36 * 1.1 = 39.6)
        const targetX = mouse.x * 39.6; // Scaled for enlarged playfield
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

        // Handle keyboard paddle movement
        if (this.paddle) {
            const keyboardSpeed = 49.5; // Units per second (10% faster: 45 * 1.1)

            if (this.keys.left) {
                const newX = this.paddle.position.x - keyboardSpeed * deltaTime;
                this.paddle.setTargetX(newX);
            }

            if (this.keys.right) {
                const newX = this.paddle.position.x + keyboardSpeed * deltaTime;
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

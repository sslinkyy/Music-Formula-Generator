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
        this.scene.fog = new THREE.Fog(0x0a0a1a, 40, 100);

        // Camera - 2.5D perspective
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(0, 25, 40);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
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
        // Create glowing floor
        const floorGeometry = new THREE.PlaneGeometry(30, 50);
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

        // Create grid lines on floor
        const gridHelper = new THREE.GridHelper(30, 30, 0x00ff88, 0x1a1a2e);
        gridHelper.position.y = -0.99;
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);

        // Create side walls (invisible but with glowing edges)
        this.createWallEdge(-15, 0, 0, 50);  // Left wall
        this.createWallEdge(15, 0, 0, 50);   // Right wall
        this.createWallEdge(0, 0, -25, 30);  // Back wall
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

        this.initLevel();
        console.log('[Game] Game state:', this.state, 'Lives:', this.lives);
        AudioManager.playMusic();
    }

    initLevel() {
        console.log('[Game] Initializing level', this.level);

        // Clear existing objects
        this.clearLevel();

        // Create paddle
        this.paddle = new Paddle(this.scene);
        console.log('[Game] Paddle created at', this.paddle.position);

        // Create ball attached to paddle
        const ball = new Ball(this.scene, 0, -8, 2);
        ball.attachToPaddle(this.paddle);
        this.balls.push(ball);
        console.log('[Game] Ball created and attached, position:', ball.position, 'attached:', ball.attached);

        // Create bricks for current level
        this.bricks = LevelManager.createLevel(this.level, this.scene);
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

        // Convert mouse position to world position
        const targetX = mouse.x * 12; // Limit to playfield width
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
        this.hideModal('level-complete');
        this.updateLevel();
        this.initLevel();
        this.state = GameState.PLAYING;
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
        const levelBonus = this.level * 1000;
        this.score += levelBonus;
        document.getElementById('level-score').textContent = this.score;
        document.getElementById('level-bonus').textContent = levelBonus;
        this.showModal('level-complete');
        AudioManager.play('levelComplete');
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
            const keyboardSpeed = 15; // Units per second

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

            // Check if ball is out of bounds
            if (ball.position.y < -15) {
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

            if (powerUp.position.y < -15 || powerUp.collected) {
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

        // Check collisions
        PhysicsManager.checkCollisions(this);

        // Check level complete
        const activeBricks = this.bricks.filter(brick => !brick.destroyed);
        if (activeBricks.length === 0 && this.bricks.length > 0) {
            console.log('[Game] All bricks destroyed, level complete!');
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

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = 0.016; // Approximately 60 FPS

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

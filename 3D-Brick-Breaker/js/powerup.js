const PowerUpManager = {
    types: {
        // Music Generation Powerups
        GENRE: {
            id: 'genre',
            name: 'Genre',
            color: 0xff00ff,
            chance: 0.20,
            category: 'music'
        },
        STYLE_TAG: {
            id: 'style-tag',
            name: 'Style Tag',
            color: 0x00ffff,
            chance: 0.20,
            category: 'music'
        },
        KEYWORD: {
            id: 'keyword',
            name: 'Keyword',
            color: 0xffff00,
            chance: 0.15,
            category: 'music'
        },
        PREMISE: {
            id: 'premise',
            name: 'Premise',
            color: 0xff8800,
            chance: 0.10,
            category: 'music'
        },
        LANGUAGE: {
            id: 'language',
            name: 'Language',
            color: 0x00ff88,
            chance: 0.05,
            category: 'music'
        },
        ACCENT: {
            id: 'accent',
            name: 'Accent',
            color: 0x88ff00,
            chance: 0.05,
            category: 'music'
        },
        FORBIDDEN: {
            id: 'forbidden',
            name: 'Forbidden Word',
            color: 0xff0000,
            chance: 0.05,
            category: 'music'
        },

        // Gameplay Powerups
        MULTI_BALL: {
            id: 'multi-ball',
            name: 'Multi-Ball',
            color: 0xff6b6b,
            chance: 0.08,
            category: 'gameplay'
        },
        EXPAND_PADDLE: {
            id: 'expand-paddle',
            name: 'Expand Paddle',
            color: 0x4ecdc4,
            chance: 0.07,
            category: 'gameplay'
        },
        LASER: {
            id: 'laser',
            name: 'Laser',
            color: 0xffe66d,
            chance: 0.03,
            category: 'gameplay'
        },
        SLOW_BALL: {
            id: 'slow-ball',
            name: 'Slow Ball',
            color: 0x95e1d3,
            chance: 0.02,
            category: 'gameplay'
        }
    },

    // Music data sources
    musicData: {
        genres: ['Trap', 'Drill', 'Afrobeats', 'R&B', 'House', 'UK Garage', 'Jersey Club', 'Amapiano', 'Dancehall', 'Reggaeton', 'Baile Funk', 'Hip-Hop', 'Pop', 'Electronic', 'Soul'],
        styleTags: ['anthemic rap', 'chant hook', 'confident bounce', 'aggressive flow', 'melodic singing', 'dark synth', 'heavy bass', 'rhythmic percussion', 'vocal chops', 'atmospheric pad', 'distorted 808', 'crisp hi-hats', 'catchy melody', 'hypnotic loop', 'energetic vibe'],
        keywords: ['hustle', 'grind', 'success', 'money', 'power', 'love', 'loyalty', 'ambition', 'celebration', 'struggle', 'triumph', 'night', 'city', 'dreams', 'desire', 'passion', 'fire', 'ice', 'gold', 'diamonds'],
        premises: ['love & loyalty', 'hustle & ambition', 'triumph & celebration', 'struggle & perseverance', 'power & respect', 'desire & temptation', 'pain & healing', 'revenge & redemption', 'party & escape', 'dreams & reality'],
        languages: ['English', 'Spanish', 'French', 'Portuguese', 'Patois', 'Nigerian Pidgin', 'Arabic', 'Japanese', 'Korean'],
        accents: ['Neutral / Standard', 'British (London)', 'American (Southern)', 'American (New York)', 'Caribbean', 'African', 'Australian', 'French', 'Spanish'],
        forbiddenWords: ['glow', 'glitch', 'hum', 'pulse', 'neon', 'shadow', 'echo', 'vibe', 'energy', 'aura']
    },

    // Collection tracking
    collected: {
        genres: {},      // { "Trap": 3, "R&B": 2 }
        styleTags: [],
        keywords: [],
        premises: [],
        languages: [],
        accents: [],
        forbidden: []
    },

    reset() {
        this.collected = {
            genres: {},
            styleTags: [],
            keywords: [],
            premises: [],
            languages: [],
            accents: [],
            forbidden: []
        };
    },

    getRandomType() {
        const roll = Math.random();
        let cumulative = 0;

        for (const type of Object.values(this.types)) {
            cumulative += type.chance;
            if (roll < cumulative) {
                return type;
            }
        }

        return this.types.GENRE;
    },

    getRandomData(type) {
        const data = this.musicData;
        switch (type.id) {
            case 'genre':
                return data.genres[Math.floor(Math.random() * data.genres.length)];
            case 'style-tag':
                return data.styleTags[Math.floor(Math.random() * data.styleTags.length)];
            case 'keyword':
                return data.keywords[Math.floor(Math.random() * data.keywords.length)];
            case 'premise':
                return data.premises[Math.floor(Math.random() * data.premises.length)];
            case 'language':
                return data.languages[Math.floor(Math.random() * data.languages.length)];
            case 'accent':
                return data.accents[Math.floor(Math.random() * data.accents.length)];
            case 'forbidden':
                return data.forbiddenWords[Math.floor(Math.random() * data.forbiddenWords.length)];
            default:
                return null;
        }
    },

    collectMusicData(type, data) {
        switch (type.id) {
            case 'genre':
                this.collected.genres[data] = (this.collected.genres[data] || 0) + 1;
                break;
            case 'style-tag':
                if (!this.collected.styleTags.includes(data)) {
                    this.collected.styleTags.push(data);
                }
                break;
            case 'keyword':
                if (!this.collected.keywords.includes(data)) {
                    this.collected.keywords.push(data);
                }
                break;
            case 'premise':
                this.collected.premises.push(data);
                break;
            case 'language':
                this.collected.languages.push(data);
                break;
            case 'accent':
                this.collected.accents.push(data);
                break;
            case 'forbidden':
                if (!this.collected.forbidden.includes(data)) {
                    this.collected.forbidden.push(data);
                }
                break;
        }
    }
};

class PowerUp {
    constructor(scene, x, y, z, type, data = null) {
        this.scene = scene;
        this.position = { x, y, z };
        this.velocity = { x: 0, y: -3, z: 0 };
        this.type = type;
        this.data = data;  // Music data (genre name, style tag, etc.)
        this.collected = false;
        this.size = 0.5;

        this.createMesh();
    }

    createMesh() {
        // Create a rotating icon
        const geometry = new THREE.OctahedronGeometry(this.size);
        const material = new THREE.MeshStandardMaterial({
            color: this.type.color,
            metalness: 0.8,
            roughness: 0.2,
            emissive: this.type.color,
            emissiveIntensity: 0.5
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.castShadow = true;

        // Add glow effect
        const glowGeometry = new THREE.OctahedronGeometry(this.size * 1.3);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.type.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });

        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(this.glow);

        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        if (this.collected) return;

        // Update position
        this.position.y += this.velocity.y * deltaTime;
        this.mesh.position.y = this.position.y;

        // Rotate
        this.mesh.rotation.x += deltaTime * 2;
        this.mesh.rotation.y += deltaTime * 3;

        // Pulsing glow
        const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.3;
        this.glow.material.opacity = pulse;

        // Check collection by paddle
        if (window.game && window.game.paddle) {
            const paddleBox = window.game.paddle.getBox();
            const powerUpBox = this.getBox();

            if (paddleBox.intersectsBox(powerUpBox)) {
                this.collect();
            }
        }
    }

    collect() {
        if (this.collected) return;

        this.collected = true;

        // Apply power-up effect
        this.applyEffect();

        // Show notification
        this.showNotification();

        // Collect animation
        const scale = { value: 1 };
        const collectAnimation = setInterval(() => {
            scale.value += 0.2;
            if (this.mesh) {
                this.mesh.scale.setScalar(scale.value);
                this.mesh.material.opacity = Math.max(0, 1 - scale.value * 0.5);
            }

            if (scale.value >= 2) {
                clearInterval(collectAnimation);
            }
        }, 16);

        AudioManager.play('powerup');
    }

    applyEffect() {
        const game = window.game;
        if (!game) return;

        // Handle music powerups
        if (this.type.category === 'music' && this.data) {
            PowerUpManager.collectMusicData(this.type, this.data);
            return;
        }

        // Handle gameplay powerups
        switch (this.type.id) {
            case 'multi-ball':
                this.activateMultiBall(game);
                break;
            case 'expand-paddle':
                game.paddle.expandPaddle(10);
                break;
            case 'laser':
                game.paddle.activateLaser(8);
                break;
            case 'slow-ball':
                game.balls.forEach(ball => ball.slowDown(8));
                break;
        }
    }

    activateMultiBall(game) {
        // Create two additional balls
        const originalBalls = [...game.balls];

        originalBalls.forEach(originalBall => {
            if (originalBall.attached) return;

            for (let i = 0; i < 2; i++) {
                const ball = new Ball(
                    this.scene,
                    originalBall.position.x,
                    originalBall.position.y,
                    originalBall.position.z
                );

                // Set velocity at different angles
                const angle = (i === 0 ? -30 : 30) * Math.PI / 180;
                const speed = originalBall.speed;

                ball.velocity.x = Math.sin(angle) * speed;
                ball.velocity.y = Math.cos(angle) * speed;
                ball.velocity.z = originalBall.velocity.z;

                ball.speed = speed;

                game.balls.push(ball);
            }
        });
    }

    showNotification() {
        const notification = document.createElement('div');
        notification.className = `power-up-indicator ${this.type.id}`;

        // Show music data if available
        const displayText = this.data ? `${this.type.name}: ${this.data}` : this.type.name;

        notification.innerHTML = `
            <span style="font-size: 20px;">⚡</span>
            <span>${displayText}</span>
        `;

        const container = document.getElementById('power-ups');
        if (container) {
            container.appendChild(notification);

            // Remove after duration
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }
    }

    getBox() {
        return new THREE.Box3().setFromObject(this.mesh);
    }

    destroy() {
        if (this.mesh) {
            if (this.glow) {
                this.glow.geometry.dispose();
                this.glow.material.dispose();
            }
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.scene.remove(this.mesh);
        }
    }
}

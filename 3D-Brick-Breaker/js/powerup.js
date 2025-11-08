const PowerUpManager = {
    types: {
        // Music Generation Powerups (55% total)
        GENRE: {
            id: 'genre',
            name: 'Genre',
            color: 0xff00ff,
            chance: 0.18,
            category: 'music'
        },
        STYLE_TAG: {
            id: 'style-tag',
            name: 'Style Tag',
            color: 0x00ffff,
            chance: 0.15,
            category: 'music'
        },
        KEYWORD: {
            id: 'keyword',
            name: 'Keyword',
            color: 0xffff00,
            chance: 0.10,
            category: 'music'
        },
        PREMISE: {
            id: 'premise',
            name: 'Premise',
            color: 0xff8800,
            chance: 0.07,
            category: 'music'
        },
        LANGUAGE: {
            id: 'language',
            name: 'Language',
            color: 0x00ff88,
            chance: 0.03,
            category: 'music'
        },
        ACCENT: {
            id: 'accent',
            name: 'Accent',
            color: 0x88ff00,
            chance: 0.02,
            category: 'music'
        },

        // Gameplay Powerups (45% total) - AMAZING!
        MULTI_BALL: {
            id: 'multi-ball',
            name: 'Multi-Ball x3',
            color: 0xff6b6b,
            chance: 0.10,
            category: 'gameplay',
            duration: 0
        },
        MEGA_PADDLE: {
            id: 'mega-paddle',
            name: 'Mega Paddle',
            color: 0x4ecdc4,
            chance: 0.10,
            category: 'gameplay',
            duration: 12
        },
        SHIELD: {
            id: 'shield',
            name: 'Shield',
            color: 0x00ddff,
            chance: 0.08,
            category: 'gameplay',
            duration: 15
        },
        TIME_SLOW: {
            id: 'time-slow',
            name: 'Time Slow',
            color: 0xaa44ff,
            chance: 0.08,
            category: 'gameplay',
            duration: 10
        },
        MAGNET: {
            id: 'magnet',
            name: 'Magnet',
            color: 0xff44aa,
            chance: 0.05,
            category: 'gameplay',
            duration: 12
        },
        LASER: {
            id: 'laser',
            name: 'Laser',
            color: 0xffe66d,
            chance: 0.04,
            category: 'gameplay',
            duration: 8
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
        this.velocity = { x: 0, y: -6, z: 0 };  // Increased from -3 to -6 for faster drop
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

        // Magnet effect - pull towards paddle
        if (window.game && window.game.hasMagnet && window.game.paddle) {
            const paddle = window.game.paddle;
            const dx = paddle.position.x - this.position.x;
            const dy = paddle.position.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0.5) {
                // Accelerate towards paddle
                const magnetStrength = 15;
                this.velocity.x = (dx / distance) * magnetStrength;
                this.velocity.y = (dy / distance) * magnetStrength;
            }
        }

        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.mesh.position.x = this.position.x;
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
            case 'mega-paddle':
                this.activateMegaPaddle(game);
                break;
            case 'shield':
                this.activateShield(game);
                break;
            case 'time-slow':
                this.activateTimeSlow(game);
                break;
            case 'magnet':
                this.activateMagnet(game);
                break;
            case 'laser':
                game.paddle.activateLaser(this.type.duration);
                break;
        }
    }

    activateMultiBall(game) {
        // Create THREE additional balls (x3 multi-ball!)
        const originalBalls = [...game.balls];

        originalBalls.forEach(originalBall => {
            if (originalBall.attached) return;

            // Spawn 3 new balls at different angles
            const angles = [-40, 0, 40]; // Degrees

            for (let i = 0; i < 3; i++) {
                const ball = new Ball(
                    this.scene,
                    originalBall.position.x,
                    originalBall.position.y,
                    originalBall.position.z
                );

                // Apply difficulty modifiers to new ball
                if (window.DifficultyManager && game.level) {
                    DifficultyManager.applyToBall(ball, game.level);
                }

                // Set velocity at different angles
                const angle = angles[i] * Math.PI / 180;
                const speed = originalBall.speed;

                ball.velocity.x = Math.sin(angle) * speed;
                ball.velocity.y = Math.cos(angle) * speed;
                ball.velocity.z = originalBall.velocity.z;

                ball.speed = speed;

                game.balls.push(ball);
            }
        });
    }

    activateMegaPaddle(game) {
        if (!game.paddle) return;

        const paddle = game.paddle;
        const duration = this.type.duration;

        // Add to active effects tracker
        game.addActiveEffect('mega-paddle', 'Mega Paddle', 'positive', duration, '📏');

        // Clear any existing paddle timer
        if (paddle.megaPaddleTimeout) {
            clearTimeout(paddle.megaPaddleTimeout);
        }

        // Animate to 3x size
        paddle.isMegaPaddle = true;
        const targetWidth = paddle.baseWidth * 3;
        const startWidth = paddle.width;

        // Smooth grow animation
        let progress = 0;
        const growInterval = setInterval(() => {
            progress += 0.05;
            if (progress >= 1) {
                progress = 1;
                clearInterval(growInterval);
            }

            paddle.width = startWidth + (targetWidth - startWidth) * progress;

            // Update geometry
            if (paddle.paddleMesh && paddle.paddleMesh.geometry) {
                paddle.paddleMesh.geometry.dispose();
                paddle.paddleMesh.geometry = new THREE.BoxGeometry(paddle.width, paddle.height, paddle.depth);
            }

            // Update glow
            if (paddle.glowMesh && paddle.glowMesh.geometry) {
                paddle.glowMesh.geometry.dispose();
                paddle.glowMesh.geometry = new THREE.PlaneGeometry(paddle.width + 1, paddle.depth + 1);
            }

            // Change color to cyan
            if (paddle.paddleMesh && paddle.paddleMesh.material) {
                paddle.paddleMesh.material.color.setHex(0x4ecdc4);
                paddle.paddleMesh.material.emissive.setHex(0x4ecdc4);
            }
        }, 16);

        // Revert after duration
        paddle.megaPaddleTimeout = setTimeout(() => {
            paddle.isMegaPaddle = false;

            // Smooth shrink animation
            const currentWidth = paddle.width;
            const targetWidth = paddle.baseWidth;
            let progress = 0;

            const shrinkInterval = setInterval(() => {
                progress += 0.05;
                if (progress >= 1) {
                    progress = 1;
                    clearInterval(shrinkInterval);
                }

                paddle.width = currentWidth + (targetWidth - currentWidth) * progress;

                if (paddle.paddleMesh && paddle.paddleMesh.geometry) {
                    paddle.paddleMesh.geometry.dispose();
                    paddle.paddleMesh.geometry = new THREE.BoxGeometry(paddle.width, paddle.height, paddle.depth);
                }

                if (paddle.glowMesh && paddle.glowMesh.geometry) {
                    paddle.glowMesh.geometry.dispose();
                    paddle.glowMesh.geometry = new THREE.PlaneGeometry(paddle.width + 1, paddle.depth + 1);
                }

                // Restore original color
                if (paddle.paddleMesh && paddle.paddleMesh.material && !paddle.hasLaser) {
                    paddle.paddleMesh.material.color.setHex(0x00ff88);
                    paddle.paddleMesh.material.emissive.setHex(0x00ff88);
                }
            }, 16);
        }, duration * 1000);
    }

    activateShield(game) {
        if (!game.paddle) return;

        const duration = this.type.duration;

        // Add to active effects tracker
        game.addActiveEffect('shield', 'Shield', 'positive', duration, '🛡️');

        // Activate shield
        game.hasShield = true;
        game.shieldHits = 1; // One free miss

        // Create shield visual
        if (!game.shieldMesh) {
            const shieldGeometry = new THREE.SphereGeometry(8, 32, 32);
            const shieldMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ddff,
                transparent: true,
                opacity: 0.2,
                side: THREE.BackSide,
                wireframe: true
            });

            game.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
            game.shieldMesh.position.set(0, 0, -1);
            game.scene.add(game.shieldMesh);
        }

        // Shield pulse animation
        game.shieldMesh.visible = true;

        // Remove after duration or when hit
        if (game.shieldTimeout) clearTimeout(game.shieldTimeout);

        game.shieldTimeout = setTimeout(() => {
            game.hasShield = false;
            game.shieldHits = 0;
            if (game.shieldMesh) {
                game.shieldMesh.visible = false;
            }
        }, duration * 1000);
    }

    activateTimeSlow(game) {
        const duration = this.type.duration;

        // Add to active effects tracker
        game.addActiveEffect('time-slow', 'Time Slow', 'positive', duration, '⏱️');

        // Slow down time to 50%
        game.timeScale = 0.5;

        // Add purple tint overlay
        const overlay = document.createElement('div');
        overlay.id = 'time-slow-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(170, 68, 255, 0.15)';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '900';
        overlay.style.transition = 'opacity 0.5s';
        overlay.style.opacity = '0';

        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 50);

        // Revert after duration
        if (game.timeSlowTimeout) clearTimeout(game.timeSlowTimeout);

        game.timeSlowTimeout = setTimeout(() => {
            game.timeScale = 1.0;

            // Fade out overlay
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                    document.body.removeChild(overlay);
                }
            }, 500);
        }, duration * 1000);
    }

    activateMagnet(game) {
        const duration = this.type.duration;

        // Add to active effects tracker
        game.addActiveEffect('magnet', 'Magnet', 'positive', duration, '🧲');

        // Activate magnet
        game.hasMagnet = true;

        // Change paddle color to pink
        if (game.paddle && game.paddle.paddleMesh && game.paddle.paddleMesh.material) {
            game.paddle.paddleMesh.material.color.setHex(0xff44aa);
            game.paddle.paddleMesh.material.emissive.setHex(0xff44aa);
        }

        // Revert after duration
        if (game.magnetTimeout) clearTimeout(game.magnetTimeout);

        game.magnetTimeout = setTimeout(() => {
            game.hasMagnet = false;

            // Restore paddle color
            if (game.paddle && game.paddle.paddleMesh && game.paddle.paddleMesh.material) {
                if (!game.paddle.isMegaPaddle && !game.paddle.hasLaser) {
                    game.paddle.paddleMesh.material.color.setHex(0x00ff88);
                    game.paddle.paddleMesh.material.emissive.setHex(0x00ff88);
                }
            }
        }, duration * 1000);
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

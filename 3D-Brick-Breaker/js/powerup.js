const PowerUpManager = {
    types: {
        MULTI_BALL: {
            id: 'multi-ball',
            name: 'Multi-Ball',
            color: 0xff6b6b,
            chance: 0.15
        },
        EXPAND_PADDLE: {
            id: 'expand-paddle',
            name: 'Expand Paddle',
            color: 0x4ecdc4,
            chance: 0.20
        },
        LASER: {
            id: 'laser',
            name: 'Laser',
            color: 0xffe66d,
            chance: 0.15
        },
        SLOW_BALL: {
            id: 'slow-ball',
            name: 'Slow Ball',
            color: 0x95e1d3,
            chance: 0.20
        },
        EXTRA_LIFE: {
            id: 'extra-life',
            name: 'Extra Life',
            color: 0xff0080,
            chance: 0.10
        },
        SCORE_MULTIPLIER: {
            id: 'score-multiplier',
            name: '2x Score',
            color: 0xffd700,
            chance: 0.20
        }
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

        return this.types.EXPAND_PADDLE;
    }
};

class PowerUp {
    constructor(scene, x, y, z, type) {
        this.scene = scene;
        this.position = { x, y, z };
        this.velocity = { x: 0, y: -3, z: 0 };
        this.type = type;
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
            case 'extra-life':
                game.lives++;
                game.updateLives();
                break;
            case 'score-multiplier':
                game.addScore(1000);
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
        notification.innerHTML = `
            <span style="font-size: 20px;">⚡</span>
            <span>${this.type.name}</span>
        `;

        const container = document.getElementById('power-ups');
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

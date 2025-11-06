class Ball {
    constructor(scene, x, y, z) {
        this.scene = scene;
        this.position = { x, y, z };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.radius = 0.6;  // Increased for better visibility
        this.speed = 15;
        this.baseSpeed = 15;
        this.maxSpeed = 30;

        this.attached = false;
        this.attachedPaddle = null;
        this.attachOffset = 0;

        this.createMesh();
    }

    createMesh() {
        // Create sphere with high detail
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);

        // Create material with realistic metallic look
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x00ccff,
            emissiveIntensity: 0.5
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = false;

        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);

        // Add trail effect
        this.createTrail();
    }

    createTrail() {
        // Create glowing trail effect
        const trailGeometry = new THREE.SphereGeometry(this.radius * 1.5, 16, 16);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ccff,
            transparent: true,
            opacity: 0.2
        });

        this.trail = new THREE.Mesh(trailGeometry, trailMaterial);
        this.mesh.add(this.trail);
    }

    attachToPaddle(paddle) {
        this.attached = true;
        this.attachedPaddle = paddle;
        this.attachOffset = 0;

        this.position.x = paddle.position.x;
        this.position.y = paddle.position.y + paddle.height / 2 + this.radius + 0.2;
        this.position.z = paddle.position.z;  // Fix: align ball with paddle in Z
        this.velocity = { x: 0, y: 0, z: 0 };
    }

    launch() {
        if (!this.attached) return;

        this.attached = false;
        this.attachedPaddle = null;

        // Launch at angle
        const angle = (Math.random() - 0.5) * Math.PI / 4; // -45 to 45 degrees
        this.velocity.x = Math.sin(angle) * this.speed;
        this.velocity.y = Math.cos(angle) * this.speed;
        this.velocity.z = 0;

        console.log('[Ball] Launched with angle:', angle, 'velocity:', JSON.stringify(this.velocity), 'position:', JSON.stringify(this.position));
    }

    update(deltaTime) {
        if (this.attached && this.attachedPaddle) {
            // Follow paddle when attached
            this.position.x = this.attachedPaddle.position.x + this.attachOffset;
            this.position.y = this.attachedPaddle.position.y + this.attachedPaddle.height / 2 + this.radius + 0.2;
            this.position.z = this.attachedPaddle.position.z;  // Fix: keep ball aligned with paddle in Z

            // Gentle bobbing animation
            this.position.y += Math.sin(Date.now() * 0.005) * 0.1;
        } else {
            // Update position based on velocity
            this.position.x += this.velocity.x * deltaTime;
            this.position.y += this.velocity.y * deltaTime;
            this.position.z += this.velocity.z * deltaTime;

            // Check wall collisions
            this.checkWallCollisions();

            // Rotate ball based on movement
            const rotationSpeed = this.speed * 0.1;
            this.mesh.rotation.x += this.velocity.y * deltaTime * rotationSpeed;
            this.mesh.rotation.z -= this.velocity.x * deltaTime * rotationSpeed;
        }

        // Update mesh position
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);

        // Pulsing glow effect
        const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
        this.mesh.material.emissiveIntensity = pulse * 0.5;

        // Update trail
        if (this.trail) {
            this.trail.scale.setScalar(1 + pulse * 0.2);
        }
    }

    checkWallCollisions() {
        const bounds = 16; // Game boundary (expanded)

        // Left wall
        if (this.position.x - this.radius < -bounds) {
            this.position.x = -bounds + this.radius;
            this.velocity.x = Math.abs(this.velocity.x);
            this.onWallHit();
        }

        // Right wall
        if (this.position.x + this.radius > bounds) {
            this.position.x = bounds - this.radius;
            this.velocity.x = -Math.abs(this.velocity.x);
            this.onWallHit();
        }

        // Back wall
        if (this.position.z - this.radius < -24) {
            this.position.z = -24 + this.radius;
            this.velocity.z = Math.abs(this.velocity.z);
            this.onWallHit();
        }

        // Top boundary (ceiling)
        if (this.position.y + this.radius > 22) {
            this.position.y = 22 - this.radius;
            this.velocity.y = -Math.abs(this.velocity.y);
            this.onWallHit();
        }
    }

    onWallHit() {
        // Add small random variation to prevent predictable patterns
        this.velocity.x += (Math.random() - 0.5) * 0.5;
        this.velocity.y += (Math.random() - 0.5) * 0.5;

        // Normalize and maintain speed
        this.normalizeVelocity();

        AudioManager.play('wallHit');
        this.createImpactEffect();
    }

    onPaddleHit(paddle) {
        // Calculate hit position on paddle (-1 to 1)
        const hitPos = (this.position.x - paddle.position.x) / (paddle.width / 2);

        // Adjust angle based on where ball hit paddle
        const angle = hitPos * (Math.PI / 3); // Max 60 degrees
        const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);

        this.velocity.x = Math.sin(angle) * currentSpeed;
        this.velocity.y = Math.abs(Math.cos(angle) * currentSpeed);

        // Add paddle velocity influence
        const paddleVelocity = (paddle.targetX - paddle.position.x) * 2;
        this.velocity.x += paddleVelocity;

        // Increase speed slightly with each hit (up to max)
        this.speed = Math.min(this.speed * 1.02, this.maxSpeed);
        this.normalizeVelocity();

        this.position.y = paddle.position.y + paddle.height / 2 + this.radius + 0.1;

        AudioManager.play('paddleHit');
        this.createImpactEffect();
    }

    onBrickHit(brick, normal) {
        // Reflect velocity based on collision normal
        const dot = this.velocity.x * normal.x + this.velocity.y * normal.y + this.velocity.z * normal.z;
        this.velocity.x -= 2 * dot * normal.x;
        this.velocity.y -= 2 * dot * normal.y;
        this.velocity.z -= 2 * dot * normal.z;

        // Add slight randomness
        this.velocity.x += (Math.random() - 0.5) * 0.3;
        this.velocity.y += (Math.random() - 0.5) * 0.3;

        this.normalizeVelocity();

        AudioManager.play('brickHit');
    }

    normalizeVelocity() {
        const currentSpeed = Math.sqrt(
            this.velocity.x ** 2 +
            this.velocity.y ** 2 +
            this.velocity.z ** 2
        );

        if (currentSpeed > 0) {
            this.velocity.x = (this.velocity.x / currentSpeed) * this.speed;
            this.velocity.y = (this.velocity.y / currentSpeed) * this.speed;
            this.velocity.z = (this.velocity.z / currentSpeed) * this.speed;
        }

        // Prevent ball from being too horizontal or vertical
        if (Math.abs(this.velocity.y) < this.speed * 0.3) {
            const sign = Math.sign(this.velocity.y) || 1;
            this.velocity.y = sign * this.speed * 0.3;
            this.normalizeVelocity();
        }
    }

    slowDown(duration = 8) {
        this.speed = this.baseSpeed * 0.6;
        this.normalizeVelocity();

        setTimeout(() => {
            this.speed = this.baseSpeed;
            this.normalizeVelocity();
        }, duration * 1000);
    }

    createImpactEffect() {
        // Create impact particles
        const particleCount = 5;
        for (let i = 0; i < particleCount; i++) {
            const particle = new Particle(
                this.scene,
                this.position.x,
                this.position.y,
                this.position.z,
                0x00ccff
            );
            particle.velocity.x = (Math.random() - 0.5) * 5;
            particle.velocity.y = (Math.random() - 0.5) * 5;
            particle.velocity.z = (Math.random() - 0.5) * 5;

            if (window.game) {
                window.game.particles.push(particle);
            }
        }
    }

    getBox() {
        return new THREE.Box3().setFromObject(this.mesh);
    }

    getSphere() {
        return new THREE.Sphere(
            new THREE.Vector3(this.position.x, this.position.y, this.position.z),
            this.radius
        );
    }

    destroy() {
        if (this.mesh) {
            if (this.trail) {
                this.trail.geometry.dispose();
                this.trail.material.dispose();
            }
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.scene.remove(this.mesh);
        }
    }
}

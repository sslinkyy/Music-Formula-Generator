class Paddle {
    constructor(scene) {
        this.scene = scene;
        this.position = { x: 0, y: 0, z: -1 };  // Bottom center of playfield
        this.targetX = 0;
        this.width = 10.56;  // 20% larger (8.8 * 1.2)
        this.baseWidth = 10.56;
        this.height = 1.98;  // 20% larger (1.65 * 1.2)
        this.depth = 3.96;  // 20% larger (3.3 * 1.2)
        this.speed = 66; // 10% faster (60 * 1.1)

        // Power-up states
        this.isExpanded = false;
        this.hasLaser = false;
        this.laserCooldown = 0;

        this.createMesh();
    }

    createMesh() {
        // Create paddle group
        this.mesh = new THREE.Group();

        // Main paddle body
        const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);

        // Create bright material with proper lighting support
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ff88,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0x00ff88,
            emissiveIntensity: 0.5
        });

        const paddle = new THREE.Mesh(geometry, material);
        paddle.castShadow = true;
        paddle.receiveShadow = true;
        this.mesh.add(paddle);

        // Add glowing edges
        const edgeGeometry = new THREE.EdgesGeometry(geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            linewidth: 2
        });
        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        paddle.add(edges);

        // Add glow effect underneath
        const glowGeometry = new THREE.PlaneGeometry(this.width + 1, this.depth + 1);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.rotation.x = Math.PI / 2;
        glow.position.y = -this.height / 2 - 0.1;
        this.mesh.add(glow);

        // Add bright point light to make paddle highly visible
        const light = new THREE.PointLight(0x00ff88, 2, 20);
        light.position.set(0, 0, 0);
        this.mesh.add(light);

        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);

        console.log('[Paddle] Created and added to scene at position:', JSON.stringify(this.position), 'size:', JSON.stringify({width: this.width, height: this.height, depth: this.depth}));
        console.log('[Paddle] Mesh visible:', this.mesh.visible, 'Children count:', this.mesh.children.length);

        // Store references
        this.paddleMesh = paddle;
        this.glowMesh = glow;
    }

    setTargetX(x) {
        // Clamp target position to game boundaries (10% larger: 48 * 1.1 = 52.8)
        const halfWidth = this.width / 2;
        this.targetX = Math.max(-52.8 + halfWidth, Math.min(52.8 - halfWidth, x));
    }

    update(deltaTime) {
        // Smooth movement towards target (input reversal is handled when setting targetX)
        const dx = this.targetX - this.position.x;
        const moveAmount = Math.sign(dx) * Math.min(Math.abs(dx), this.speed * deltaTime);

        this.position.x += moveAmount;
        this.mesh.position.x = this.position.x;

        // Update laser cooldown
        if (this.laserCooldown > 0) {
            this.laserCooldown -= deltaTime;
        }

        // Slight bobbing animation
        this.mesh.position.y = this.position.y + Math.sin(Date.now() * 0.003) * 0.1;
    }

    expandPaddle(duration = 10) {
        if (this.isExpanded) return;

        this.isExpanded = true;
        this.width = this.baseWidth * 1.5;

        // Update geometry
        this.paddleMesh.geometry.dispose();
        this.paddleMesh.geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);

        // Update glow
        this.glowMesh.geometry.dispose();
        this.glowMesh.geometry = new THREE.PlaneGeometry(this.width + 1, this.depth + 1);

        // Change color
        this.paddleMesh.material.color.setHex(0x4ecdc4);
        this.paddleMesh.material.emissive.setHex(0x4ecdc4);

        // Revert after duration
        setTimeout(() => {
            this.width = this.baseWidth;
            this.isExpanded = false;

            this.paddleMesh.geometry.dispose();
            this.paddleMesh.geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);

            this.glowMesh.geometry.dispose();
            this.glowMesh.geometry = new THREE.PlaneGeometry(this.width + 1, this.depth + 1);

            this.paddleMesh.material.color.setHex(0x00ff88);
            this.paddleMesh.material.emissive.setHex(0x00ff88);
        }, duration * 1000);
    }

    activateLaser(duration = 8) {
        if (this.hasLaser) return;

        this.hasLaser = true;

        // Change paddle color
        this.paddleMesh.material.color.setHex(0xffe66d);
        this.paddleMesh.material.emissive.setHex(0xffe66d);

        // Add to active effects tracker
        const game = window.game;
        if (game) {
            game.addActiveEffect('laser', 'Laser', 'positive', duration, '⚡');
        }

        // Revert after duration
        setTimeout(() => {
            this.hasLaser = false;
            if (!this.isExpanded) {
                this.paddleMesh.material.color.setHex(0x00ff88);
                this.paddleMesh.material.emissive.setHex(0x00ff88);
            }
        }, duration * 1000);
    }

    fireLaser() {
        if (!this.hasLaser || this.laserCooldown > 0) return;

        this.laserCooldown = 0.3; // 0.3 second cooldown

        // Create laser projectile
        const laserGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
        const laserMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 1
        });

        const laser = new THREE.Mesh(laserGeometry, laserMaterial);
        laser.position.set(this.position.x, this.position.y + 1, this.position.z);
        laser.rotation.z = Math.PI / 2;
        this.scene.add(laser);

        // Animate laser upwards
        const laserSpeed = 30;
        const animateLaser = () => {
            laser.position.y += laserSpeed * 0.016;

            // Check collision with bricks
            const game = window.game;
            if (game) {
                game.bricks.forEach((brick, index) => {
                    if (!brick.destroyed && this.checkLaserBrickCollision(laser, brick)) {
                        brick.hit();
                        if (brick.destroyed) {
                            game.addScore(brick.points);
                            game.bricks.splice(index, 1);
                        }
                        this.scene.remove(laser);
                        return;
                    }
                });
            }

            // Remove if out of bounds
            if (laser.position.y > 20) {
                this.scene.remove(laser);
            } else {
                requestAnimationFrame(animateLaser);
            }
        };

        animateLaser();
        AudioManager.play('laser');
    }

    checkLaserBrickCollision(laser, brick) {
        const laserBox = new THREE.Box3().setFromObject(laser);
        const brickBox = new THREE.Box3().setFromObject(brick.mesh);
        return laserBox.intersectsBox(brickBox);
    }

    getBox() {
        return new THREE.Box3().setFromObject(this.mesh);
    }

    destroy() {
        if (this.mesh) {
            this.paddleMesh.geometry.dispose();
            this.paddleMesh.material.dispose();
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
            this.scene.remove(this.mesh);
        }
    }
}

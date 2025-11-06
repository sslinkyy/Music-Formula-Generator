class Brick {
    constructor(scene, x, y, z, type = 'normal') {
        this.scene = scene;
        this.position = { x: x * 3.3, y: (y * 1.65) + 16.5, z };  // 10% larger scaling (3x->3.3x, 1.5x->1.65x, 15->16.5)
        this.width = 6.6;  // 10% larger (6 * 1.1)
        this.height = 1.32;  // 10% larger (1.2 * 1.1)
        this.depth = 2.2;  // 10% larger (2 * 1.1)
        this.type = type;
        this.destroyed = false;

        // Brick properties based on type
        this.setTypeProperties();
        this.createMesh();
    }

    setTypeProperties() {
        switch (this.type) {
            case 'weak':
                this.hits = 1;
                this.color = 0x4ecdc4;
                this.emissive = 0x4ecdc4;
                this.points = 10;
                break;
            case 'normal':
                this.hits = 1;
                this.color = 0x00ff88;
                this.emissive = 0x00ff88;
                this.points = 50;
                break;
            case 'strong':
                this.hits = 2;
                this.color = 0xff6b6b;
                this.emissive = 0xff6b6b;
                this.points = 100;
                break;
            case 'armored':
                this.hits = 3;
                this.color = 0x9b59b6;
                this.emissive = 0x9b59b6;
                this.points = 200;
                break;
            case 'explosive':
                this.hits = 1;
                this.color = 0xff8c00;
                this.emissive = 0xff8c00;
                this.points = 150;
                break;
            case 'powerup':
                this.hits = 1;
                this.color = 0xffe66d;
                this.emissive = 0xffe66d;
                this.points = 75;
                this.hasPowerUp = true;
                break;

            // Obstacle brick types
            case 'unbreakable':
                this.hits = 999;  // Effectively indestructible
                this.color = 0x808080;  // Gray
                this.emissive = 0x404040;
                this.points = 0;
                this.isUnbreakable = true;
                break;
            case 'warp':
                this.hits = 1;
                this.color = 0x9b30ff;  // Purple
                this.emissive = 0x9b30ff;
                this.points = 100;
                this.isWarp = true;
                break;
            case 'reverse':
                this.hits = 1;
                this.color = 0xff0066;  // Red/Pink
                this.emissive = 0xff0066;
                this.points = 100;
                this.isReverse = true;
                break;
            case 'crazy':
                this.hits = 1;
                this.color = 0xff00ff;  // Magenta (rainbow effect added in mesh)
                this.emissive = 0xff00ff;
                this.points = 100;
                this.isCrazy = true;
                break;
            case 'shrink':
                this.hits = 1;
                this.color = 0xff6600;  // Orange
                this.emissive = 0xff6600;
                this.points = 50;
                this.isShrink = true;
                break;

            default:
                this.hits = 1;
                this.color = 0x00ff88;
                this.emissive = 0x00ff88;
                this.points = 50;
        }

        this.maxHits = this.hits;
    }

    createMesh() {
        // Create brick geometry with beveled edges
        const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);

        // Apply bevel to edges
        geometry.computeBoundingBox();

        // Create material with realistic properties
        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            metalness: 0.7,
            roughness: 0.3,
            emissive: this.emissive,
            emissiveIntensity: 0.4
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Add edge highlights
        const edgeGeometry = new THREE.EdgesGeometry(geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        this.edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        this.mesh.add(this.edges);

        // Add glow layer
        const glowGeometry = new THREE.BoxGeometry(
            this.width + 0.1,
            this.height + 0.1,
            this.depth + 0.1
        );
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.emissive,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(this.glow);

        this.scene.add(this.mesh);

        // Subtle floating animation
        this.animationOffset = Math.random() * Math.PI * 2;
    }

    update(deltaTime) {
        if (this.destroyed) return;

        // Floating animation
        const time = Date.now() * 0.001 + this.animationOffset;
        this.mesh.position.y = this.position.y + Math.sin(time) * 0.05;

        // Pulsing glow
        const pulse = Math.sin(time * 2) * 0.1 + 0.4;
        this.mesh.material.emissiveIntensity = pulse;

        // Rotate glow slightly
        if (this.glow) {
            this.glow.rotation.y += deltaTime * 0.5;
        }

        // Power-up bricks rotate
        if (this.hasPowerUp) {
            this.mesh.rotation.y += deltaTime;
        }

        // Obstacle brick animations
        if (this.isUnbreakable) {
            // Metallic shimmer effect
            this.mesh.material.metalness = 0.9;
            this.mesh.material.roughness = 0.1;
        }

        if (this.isWarp) {
            // Swirling rotation
            this.mesh.rotation.x += deltaTime * 2;
            this.mesh.rotation.y += deltaTime * 2;
            this.mesh.rotation.z += deltaTime * 2;
        }

        if (this.isReverse) {
            // Split color pulsing (simulate red/blue split)
            const splitPulse = Math.sin(time * 4);
            const hue = splitPulse > 0 ? 0xff0000 : 0x0000ff;
            this.mesh.material.color.setHex(hue);
        }

        if (this.isCrazy) {
            // Rainbow color cycling
            const hue = (time * 0.5) % 1;
            this.mesh.material.color.setHSL(hue, 1, 0.5);
            this.mesh.material.emissive.setHSL(hue, 1, 0.3);
            this.mesh.rotation.y += deltaTime * 3;
        }

        if (this.isShrink) {
            // Warning pulse (orange flash)
            const warnPulse = Math.sin(time * 3) * 0.5 + 0.5;
            this.mesh.material.emissiveIntensity = warnPulse * 1.5;
        }
    }

    hit() {
        this.hits--;

        // Update color/intensity based on remaining hits
        if (this.hits > 0) {
            const hitRatio = this.hits / this.maxHits;
            this.mesh.material.emissiveIntensity = hitRatio * 0.4;
            this.mesh.material.opacity = 0.5 + hitRatio * 0.5;

            // Shake effect
            this.shake();

            AudioManager.play('brickHit');
        } else {
            this.destroy();
        }
    }

    shake() {
        const originalPos = { ...this.position };
        const shakeAmount = 0.2;
        let shakeTime = 0;
        const shakeDuration = 0.2;

        const shakeInterval = setInterval(() => {
            shakeTime += 0.016;

            if (shakeTime >= shakeDuration) {
                this.position = originalPos;
                this.mesh.position.set(this.position.x, this.position.y, this.position.z);
                clearInterval(shakeInterval);
            } else {
                this.mesh.position.x = this.position.x + (Math.random() - 0.5) * shakeAmount;
                this.mesh.position.z = this.position.z + (Math.random() - 0.5) * shakeAmount;
            }
        }, 16);
    }

    destroy() {
        if (this.destroyed) return;

        this.destroyed = true;

        // Create destruction particles
        this.createExplosion();

        // Drop power-up if this brick has one
        if (this.hasPowerUp && window.game) {
            const powerUpType = PowerUpManager.getRandomType();
            const powerUpData = PowerUpManager.getRandomData(powerUpType);
            const powerUp = new PowerUp(
                this.scene,
                this.position.x,
                this.position.y,
                this.position.z,
                powerUpType,
                powerUpData
            );
            window.game.powerUps.push(powerUp);
        }

        // Handle obstacle brick special effects
        if (this.isWarp && window.game) {
            this.applyWarpEffect();
        }

        if (this.isReverse && window.game) {
            this.applyReverseEffect();
        }

        if (this.isCrazy && window.game) {
            this.applyCrazyBallEffect();
        }

        if (this.isShrink && window.game) {
            this.applyShrinkEffect();
        }

        // Handle explosive bricks
        if (this.type === 'explosive' && window.game) {
            this.explode();
        }

        // Animate removal
        const scale = { value: 1 };
        const fadeOut = setInterval(() => {
            scale.value -= 0.1;
            if (this.mesh) {
                this.mesh.scale.setScalar(scale.value);
                this.mesh.material.opacity = scale.value;
            }

            if (scale.value <= 0) {
                clearInterval(fadeOut);
                this.remove();
            }
        }, 30);

        AudioManager.play('brickDestroy');
    }

    explode() {
        // Damage nearby bricks
        const explosionRadius = 3;
        const game = window.game;

        if (game) {
            game.bricks.forEach((brick) => {
                if (brick === this || brick.destroyed) return;

                const dx = brick.position.x - this.position.x;
                const dy = brick.position.y - this.position.y;
                const dz = brick.position.z - this.position.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (distance < explosionRadius) {
                    brick.hit();
                }
            });
        }

        // Create explosion effect
        this.createExplosionEffect();
        AudioManager.play('explosion');
    }

    createExplosion() {
        const particleCount = 20;
        const color = this.color;

        for (let i = 0; i < particleCount; i++) {
            const particle = new Particle(
                this.scene,
                this.position.x,
                this.position.y,
                this.position.z,
                color
            );

            // Random velocity in all directions
            const speed = 5 + Math.random() * 5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            particle.velocity.x = speed * Math.sin(phi) * Math.cos(theta);
            particle.velocity.y = speed * Math.sin(phi) * Math.sin(theta);
            particle.velocity.z = speed * Math.cos(phi);

            if (window.game) {
                window.game.particles.push(particle);
            }
        }
    }

    createExplosionEffect() {
        // Create shockwave
        const shockwaveGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        shockwave.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(shockwave);

        // Animate shockwave
        let scale = 1;
        const expandShockwave = setInterval(() => {
            scale += 0.3;
            shockwave.scale.setScalar(scale);
            shockwave.material.opacity = Math.max(0, 0.8 - scale * 0.15);

            if (shockwave.material.opacity <= 0) {
                clearInterval(expandShockwave);
                shockwave.geometry.dispose();
                shockwave.material.dispose();
                this.scene.remove(shockwave);
            }
        }, 16);
    }

    applyWarpEffect() {
        // Teleport ball to random position
        const game = window.game;
        if (!game || !game.balls.length) return;

        game.balls.forEach(ball => {
            if (!ball.attached) {
                // Random position within bounds
                ball.position.x = (Math.random() - 0.5) * 28;  // ±14 bounds
                ball.position.y = Math.random() * 15 + 5;  // 5-20 range
                ball.position.z = ball.position.z;  // Keep same Z

                // Create portal effect
                this.createPortalEffect(ball.position);

                console.log('[Brick] Warp effect! Ball teleported to:', ball.position);
            }
        });

        AudioManager.play('powerup');  // Use powerup sound for warp
    }

    applyReverseEffect() {
        // Reverse paddle controls for 5 seconds
        const game = window.game;
        if (!game || !game.paddle) return;

        game.controlsReversed = true;
        game.reverseEffectTimer = 5.0;

        // Add to active effects tracker
        game.addActiveEffect('reverse', 'Reversed Controls', 'negative', 5.0, '🔄');

        // Show warning indicator
        this.showEffectWarning('CONTROLS REVERSED!', '#ff0066', 5000);

        console.log('[Brick] Reverse effect activated for 5 seconds');
        AudioManager.play('powerup');
    }

    applyCrazyBallEffect() {
        // Make ball bounce erratically for 5 seconds
        const game = window.game;
        if (!game || !game.balls.length) return;

        game.balls.forEach(ball => {
            if (!ball.attached) {
                ball.isCrazy = true;
                ball.crazyTimer = 5.0;

                // Add random velocity components
                ball.velocity.x += (Math.random() - 0.5) * 5;
                ball.velocity.y += (Math.random() - 0.5) * 5;
                ball.normalizeVelocity();

                console.log('[Brick] Crazy ball effect activated');
            }
        });

        // Add to active effects tracker
        game.addActiveEffect('crazy', 'Crazy Ball', 'negative', 5.0, '🌀');

        this.showEffectWarning('CRAZY BALL!', '#ff00ff', 5000);
        AudioManager.play('powerup');
    }

    applyShrinkEffect() {
        // Shrink paddle for 5 seconds
        const game = window.game;
        if (!game || !game.paddle) return;

        const paddle = game.paddle;
        const originalWidth = paddle.width;

        // Shrink paddle
        paddle.width = originalWidth * 0.5;
        paddle.paddleMesh.geometry.dispose();
        paddle.paddleMesh.geometry = new THREE.BoxGeometry(paddle.width, paddle.height, paddle.depth);

        // Add to active effects tracker
        game.addActiveEffect('shrink', 'Shrink Paddle', 'negative', 5.0, '📉');

        // Restore after 5 seconds
        setTimeout(() => {
            if (paddle && paddle.paddleMesh) {
                paddle.width = originalWidth;
                paddle.paddleMesh.geometry.dispose();
                paddle.paddleMesh.geometry = new THREE.BoxGeometry(paddle.width, paddle.height, paddle.depth);
                console.log('[Brick] Paddle size restored');
            }
        }, 5000);

        this.showEffectWarning('PADDLE SHRUNK!', '#ff6600', 5000);
        console.log('[Brick] Shrink effect activated');
        AudioManager.play('powerup');
    }

    createPortalEffect(position) {
        // Create swirling portal particles
        for (let i = 0; i < 20; i++) {
            const particle = new Particle(
                this.scene,
                position.x,
                position.y,
                position.z,
                0x9b30ff  // Purple
            );
            const angle = (i / 20) * Math.PI * 2;
            particle.velocity.x = Math.cos(angle) * 5;
            particle.velocity.y = Math.sin(angle) * 5;
            particle.velocity.z = (Math.random() - 0.5) * 3;

            if (window.game) {
                window.game.particles.push(particle);
            }
        }
    }

    showEffectWarning(text, color, duration) {
        // Show warning text overlay
        const warning = document.createElement('div');
        warning.style.position = 'fixed';
        warning.style.top = '30%';
        warning.style.left = '50%';
        warning.style.transform = 'translateX(-50%)';
        warning.style.color = color;
        warning.style.fontSize = '48px';
        warning.style.fontWeight = 'bold';
        warning.style.textShadow = '0 0 10px black, 0 0 20px black';
        warning.style.zIndex = '1000';
        warning.style.pointerEvents = 'none';
        warning.textContent = text;

        document.body.appendChild(warning);

        // Fade out and remove
        setTimeout(() => {
            warning.style.transition = 'opacity 0.5s';
            warning.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(warning);
            }, 500);
        }, duration - 500);
    }

    getBox() {
        return new THREE.Box3().setFromObject(this.mesh);
    }

    remove() {
        if (this.mesh) {
            if (this.edges) {
                this.edges.geometry.dispose();
                this.edges.material.dispose();
            }
            if (this.glow) {
                this.glow.geometry.dispose();
                this.glow.material.dispose();
            }
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.scene.remove(this.mesh);
            this.mesh = null;
        }
    }
}

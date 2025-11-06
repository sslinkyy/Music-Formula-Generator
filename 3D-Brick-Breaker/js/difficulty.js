const DifficultyManager = {
    // Base values (level 1)
    base: {
        ballRadius: 0.6,
        paddleWidth: 5,
        ballSpeed: 15,
        brickHitsMultiplier: 1.0
    },

    // Scaling rates per level (max 10% changes)
    scaling: {
        ballRadiusPerLevel: -0.02,      // Shrinks by 0.02 per level (-3.3% per level)
        paddleWidthPerLevel: -0.15,     // Shrinks by 0.15 per level (-3% per level)
        ballSpeedPerLevel: 0.5,         // Increases by 0.5 per level (+3.3% per level)
        brickHitsPerLevel: 0.05         // Increases by 5% per level
    },

    // Minimum/maximum limits
    limits: {
        minBallRadius: 0.4,             // Don't go smaller than 0.4
        minPaddleWidth: 3.0,            // Don't go smaller than 3.0
        maxBallSpeed: 25,               // Cap at 25
        maxBrickHitsMultiplier: 2.0     // Cap at 2x
    },

    // Get difficulty modifiers for a specific level
    getModifiers(level) {
        const ballRadius = Math.max(
            this.limits.minBallRadius,
            this.base.ballRadius + (level - 1) * this.scaling.ballRadiusPerLevel
        );

        const paddleWidth = Math.max(
            this.limits.minPaddleWidth,
            this.base.paddleWidth + (level - 1) * this.scaling.paddleWidthPerLevel
        );

        const ballSpeed = Math.min(
            this.limits.maxBallSpeed,
            this.base.ballSpeed + (level - 1) * this.scaling.ballSpeedPerLevel
        );

        const brickHitsMultiplier = Math.min(
            this.limits.maxBrickHitsMultiplier,
            this.base.brickHitsMultiplier + (level - 1) * this.scaling.brickHitsPerLevel
        );

        return {
            ballRadius,
            paddleWidth,
            ballSpeed,
            brickHitsMultiplier
        };
    },

    // Get changes from previous level (for notifications)
    getChanges(level) {
        if (level === 1) return [];

        const current = this.getModifiers(level);
        const previous = this.getModifiers(level - 1);
        const changes = [];

        // Check ball radius change
        if (Math.abs(current.ballRadius - previous.ballRadius) > 0.001) {
            const direction = current.ballRadius < previous.ballRadius ? 'smaller' : 'larger';
            if (current.ballRadius > this.limits.minBallRadius + 0.01) {
                changes.push({
                    type: 'ball',
                    message: `Ball is ${direction}`,
                    color: '#00ccff'
                });
            }
        }

        // Check paddle width change
        if (Math.abs(current.paddleWidth - previous.paddleWidth) > 0.001) {
            const direction = current.paddleWidth < previous.paddleWidth ? 'smaller' : 'larger';
            if (current.paddleWidth > this.limits.minPaddleWidth + 0.1) {
                changes.push({
                    type: 'paddle',
                    message: `Paddle is ${direction}`,
                    color: '#00ff88'
                });
            }
        }

        // Check ball speed change
        if (Math.abs(current.ballSpeed - previous.ballSpeed) > 0.001) {
            const direction = current.ballSpeed > previous.ballSpeed ? 'faster' : 'slower';
            if (current.ballSpeed < this.limits.maxBallSpeed - 0.5) {
                changes.push({
                    type: 'speed',
                    message: `Ball is ${direction}`,
                    color: '#ffaa00'
                });
            }
        }

        // Check brick toughness change
        if (Math.abs(current.brickHitsMultiplier - previous.brickHitsMultiplier) > 0.001) {
            if (current.brickHitsMultiplier < this.limits.maxBrickHitsMultiplier - 0.05) {
                changes.push({
                    type: 'bricks',
                    message: 'Bricks are tougher',
                    color: '#ff6666'
                });
            }
        }

        return changes;
    },

    // Show difficulty changes as notifications
    showChanges(level) {
        const changes = this.getChanges(level);
        if (changes.length === 0) return;

        // Show each change as a notification
        changes.forEach((change, index) => {
            setTimeout(() => {
                this.showChangeNotification(change.message, change.color);
            }, index * 800); // Stagger notifications by 800ms
        });
    },

    showChangeNotification(message, color) {
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '40%';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.color = color;
        notification.style.fontSize = '32px';
        notification.style.fontWeight = 'bold';
        notification.style.textShadow = '0 0 10px black, 0 0 20px black';
        notification.style.zIndex = '999';
        notification.style.pointerEvents = 'none';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        notification.textContent = message;

        document.body.appendChild(notification);

        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 50);

        // Fade out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2000);
    },

    // Apply difficulty modifiers to game objects
    applyToBall(ball, level) {
        const modifiers = this.getModifiers(level);

        // Update ball size
        if (ball.mesh && ball.mesh.geometry) {
            const oldRadius = ball.radius;
            ball.radius = modifiers.ballRadius;

            // Recreate geometry with new size
            ball.mesh.geometry.dispose();
            ball.mesh.geometry = new THREE.SphereGeometry(ball.radius, 32, 32);

            // Update trail size
            if (ball.trail && ball.trail.geometry) {
                ball.trail.geometry.dispose();
                ball.trail.geometry = new THREE.SphereGeometry(ball.radius * 1.5, 16, 16);
            }
        }

        // Update ball speed
        ball.baseSpeed = modifiers.ballSpeed;
        ball.speed = modifiers.ballSpeed;
        ball.maxSpeed = modifiers.ballSpeed * 2;
    },

    applyToPaddle(paddle, level) {
        const modifiers = this.getModifiers(level);

        // Update paddle size
        paddle.baseWidth = modifiers.paddleWidth;

        if (!paddle.isExpanded) {
            paddle.width = modifiers.paddleWidth;

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
        }
    },

    applyToBrick(brick, level) {
        const modifiers = this.getModifiers(level);

        // Increase brick hits based on difficulty
        if (brick.hits && brick.hits < 999) {  // Don't modify unbreakable bricks
            const originalHits = brick.hits;
            brick.hits = Math.ceil(originalHits * modifiers.brickHitsMultiplier);
            brick.maxHits = brick.hits;
        }
    }
};

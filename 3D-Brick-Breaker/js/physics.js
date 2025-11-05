const PhysicsManager = {
    checkCollisions(game) {
        // Check ball collisions
        game.balls.forEach(ball => {
            if (ball.attached) return;

            // Check paddle collision
            if (game.paddle) {
                this.checkBallPaddleCollision(ball, game.paddle);
            }

            // Check brick collisions
            game.bricks.forEach((brick, index) => {
                if (brick.destroyed) return;

                if (this.checkBallBrickCollision(ball, brick)) {
                    brick.hit();

                    if (brick.destroyed) {
                        game.addScore(brick.points);
                        game.bricks.splice(index, 1);
                    }
                }
            });
        });

        // Check laser collisions with paddle
        if (game.paddle && game.paddle.hasLaser) {
            // Auto-fire laser periodically
            if (game.paddle.laserCooldown <= 0) {
                game.paddle.fireLaser();
            }
        }
    },

    checkBallPaddleCollision(ball, paddle) {
        const ballSphere = ball.getSphere();
        const paddleBox = paddle.getBox();

        // Simple sphere-box collision
        const closestPoint = new THREE.Vector3(
            Math.max(paddleBox.min.x, Math.min(ball.position.x, paddleBox.max.x)),
            Math.max(paddleBox.min.y, Math.min(ball.position.y, paddleBox.max.y)),
            Math.max(paddleBox.min.z, Math.min(ball.position.z, paddleBox.max.z))
        );

        const distance = closestPoint.distanceTo(
            new THREE.Vector3(ball.position.x, ball.position.y, ball.position.z)
        );

        if (distance < ball.radius) {
            // Check if ball is moving downward
            if (ball.velocity.y < 0) {
                ball.onPaddleHit(paddle);
                return true;
            }
        }

        return false;
    },

    checkBallBrickCollision(ball, brick) {
        const ballBox = ball.getBox();
        const brickBox = brick.getBox();

        if (!ballBox.intersectsBox(brickBox)) {
            return false;
        }

        // Calculate collision normal
        const ballCenter = new THREE.Vector3(
            ball.position.x,
            ball.position.y,
            ball.position.z
        );
        const brickCenter = new THREE.Vector3(
            brick.position.x,
            brick.position.y,
            brick.position.z
        );

        const normal = this.calculateCollisionNormal(ballCenter, brickCenter, brick);
        ball.onBrickHit(brick, normal);

        return true;
    },

    calculateCollisionNormal(ballPos, brickPos, brick) {
        // Calculate which face of the brick was hit
        const dx = ballPos.x - brickPos.x;
        const dy = ballPos.y - brickPos.y;
        const dz = ballPos.z - brickPos.z;

        const halfWidth = brick.width / 2;
        const halfHeight = brick.height / 2;
        const halfDepth = brick.depth / 2;

        // Normalized distances to each face
        const distLeft = Math.abs(dx + halfWidth);
        const distRight = Math.abs(dx - halfWidth);
        const distBottom = Math.abs(dy + halfHeight);
        const distTop = Math.abs(dy - halfHeight);
        const distBack = Math.abs(dz + halfDepth);
        const distFront = Math.abs(dz - halfDepth);

        // Find minimum distance (closest face)
        const minDist = Math.min(distLeft, distRight, distBottom, distTop, distBack, distFront);

        // Return normal based on closest face
        if (minDist === distLeft) return { x: -1, y: 0, z: 0 };
        if (minDist === distRight) return { x: 1, y: 0, z: 0 };
        if (minDist === distBottom) return { x: 0, y: -1, z: 0 };
        if (minDist === distTop) return { x: 0, y: 1, z: 0 };
        if (minDist === distBack) return { x: 0, y: 0, -1 };
        if (minDist === distFront) return { x: 0, y: 0, z: 1 };

        // Default to top face
        return { x: 0, y: 1, z: 0 };
    },

    // Advanced AABB collision detection
    checkAABBCollision(box1, box2) {
        return (
            box1.min.x <= box2.max.x &&
            box1.max.x >= box2.min.x &&
            box1.min.y <= box2.max.y &&
            box1.max.y >= box2.min.y &&
            box1.min.z <= box2.max.z &&
            box1.max.z >= box2.min.z
        );
    },

    // Sphere-sphere collision
    checkSphereCollision(sphere1, sphere2) {
        const distance = sphere1.center.distanceTo(sphere2.center);
        return distance < (sphere1.radius + sphere2.radius);
    },

    // Ray-box intersection for laser detection
    checkRayBoxIntersection(ray, box) {
        return ray.intersectsBox(box);
    }
};

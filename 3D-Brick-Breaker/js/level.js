const LevelManager = {
    createLevel(levelNumber, scene) {
        const bricks = [];
        const pattern = this.getLevelPattern(levelNumber);

        pattern.forEach(row => {
            row.bricks.forEach(brickData => {
                const brick = new Brick(
                    scene,
                    brickData.x,
                    brickData.y,
                    brickData.z,
                    brickData.type
                );
                bricks.push(brick);
            });
        });

        return bricks;
    },

    getLevelPattern(levelNumber) {
        // Select pattern based on level
        const patternIndex = (levelNumber - 1) % this.patterns.length;
        return this.patterns[patternIndex](levelNumber);
    },

    patterns: [
        // Pattern 1: Classic rows
        function(level) {
            const rows = [];
            const types = ['weak', 'normal', 'strong'];
            const rowCount = Math.min(5 + Math.floor(level / 3), 8);

            for (let row = 0; row < rowCount; row++) {
                const bricks = [];
                const bricksPerRow = 10;  // Increased from 6
                const startX = -(bricksPerRow - 1) * 2.2 / 2;  // Adjusted spacing
                const y = 18 - row * 1.2;  // Tighter vertical spacing
                const typeIndex = Math.min(row % types.length, types.length - 1);

                for (let col = 0; col < bricksPerRow; col++) {
                    const x = startX + col * 2.2;  // Tighter spacing

                    // Determine brick type with priorities
                    let type = types[typeIndex];
                    const roll = Math.random();

                    if (roll < 0.08 && level > 1) {  // 8% obstacle bricks (after level 1)
                        const obstacles = ['warp', 'reverse', 'crazy', 'unbreakable'];
                        type = obstacles[Math.floor(Math.random() * obstacles.length)];
                    } else if (roll < 0.20) {  // 12% powerups
                        type = 'powerup';
                    }

                    bricks.push({ x, y, z: -1, type });  // Same Z as paddle
                }

                rows.push({ bricks });
            }

            return rows;
        },

        // Pattern 2: Pyramid
        function(level) {
            const rows = [];
            const maxBricks = 7;
            const types = ['weak', 'normal', 'strong', 'armored'];

            for (let row = 0; row < maxBricks; row++) {
                const bricks = [];
                const bricksInRow = maxBricks - row;
                const startX = -(bricksInRow - 1) * 3.3 / 2;  // Adjusted spacing
                const y = 20 - row * 1.6;  // Higher position, more spacing
                const type = types[Math.min(row, types.length - 1)];

                for (let col = 0; col < bricksInRow; col++) {
                    const x = startX + col * 3.3;  // Wider spacing

                    let brickType = type;
                    const roll = Math.random();

                    if (roll < 0.08 && level > 1) {  // 8% obstacle bricks
                        const obstacles = ['warp', 'reverse', 'crazy', 'unbreakable'];
                        brickType = obstacles[Math.floor(Math.random() * obstacles.length)];
                    } else if (roll < 0.20) {  // 12% powerups
                        brickType = 'powerup';
                    }

                    bricks.push({ x, y, z: -1, type: brickType });  // Same Z as paddle
                }

                rows.push({ bricks });
            }

            return rows;
        },

        // Pattern 3: Diamond
        function(level) {
            const rows = [];
            const centerRow = 3;
            const types = ['normal', 'strong', 'armored'];

            for (let row = 0; row < 7; row++) {
                const bricks = [];
                const distance = Math.abs(row - centerRow);
                const bricksInRow = 7 - distance * 2;

                if (bricksInRow <= 0) continue;

                const startX = -(bricksInRow - 1) * 3.3 / 2;  // Adjusted spacing
                const y = 20 - row * 1.6;  // Higher position
                const type = types[Math.min(distance, types.length - 1)];

                for (let col = 0; col < bricksInRow; col++) {
                    const x = startX + col * 3.3;  // Wider spacing

                    let brickType = type;
                    if (row === centerRow && col === Math.floor(bricksInRow / 2)) {
                        brickType = 'explosive';
                    } else {
                        const roll = Math.random();
                        if (roll < 0.08 && level > 1) {  // 8% obstacle bricks
                            const obstacles = ['warp', 'reverse', 'crazy', 'unbreakable'];
                            brickType = obstacles[Math.floor(Math.random() * obstacles.length)];
                        } else if (roll < 0.18) {  // 10% powerups
                            brickType = 'powerup';
                        }
                    }

                    bricks.push({ x, y, z: -1, type: brickType });  // Same Z as paddle
                }

                rows.push({ bricks });
            }

            return rows;
        },

        // Pattern 4: Checkerboard
        function(level) {
            const rows = [];
            const rowCount = 6;
            const colCount = 6;
            const types = ['normal', 'strong'];

            for (let row = 0; row < rowCount; row++) {
                const bricks = [];
                const y = 20 - row * 1.6;  // Higher position
                const startX = -(colCount - 1) * 3.3 / 2;  // Adjusted spacing

                for (let col = 0; col < colCount; col++) {
                    // Checkerboard pattern
                    if ((row + col) % 2 === 1) continue;

                    const x = startX + col * 3.3;  // Wider spacing
                    let type = types[(row + col) % types.length];

                    if (Math.random() < 0.08) {
                        type = 'explosive';
                    } else if (Math.random() < 0.12) {
                        type = 'powerup';
                    }

                    bricks.push({ x, y, z: -1, type });  // Same Z as paddle
                }

                rows.push({ bricks });
            }

            return rows;
        },

        // Pattern 5: Fortress
        function(level) {
            const rows = [];
            const types = ['strong', 'armored'];

            // Top walls
            for (let row = 0; row < 2; row++) {
                const bricks = [];
                const y = 20 - row * 1.6;  // Higher position
                const positions = [-9.9, -6.6, 6.6, 9.9]; // Walls (adjusted spacing)

                positions.forEach(x => {
                    bricks.push({ x, y, z: -1, type: 'armored' });  // Same Z as paddle
                });

                rows.push({ bricks });
            }

            // Middle section with gap
            for (let row = 2; row < 5; row++) {
                const bricks = [];
                const y = 20 - row * 1.6;  // Higher position

                for (let col = 0; col < 6; col++) {
                    // Leave gap in middle
                    if (col === 2 || col === 3) continue;

                    const x = -8.25 + col * 3.3;  // Wider spacing
                    let type = types[row % types.length];

                    if (Math.random() < 0.15) {
                        type = 'explosive';
                    }

                    bricks.push({ x, y, z: -1, type });  // Same Z as paddle
                }

                rows.push({ bricks });
            }

            // Bottom filled
            const bricks = [];
            const y = 20 - 5 * 1.6;  // Higher position
            for (let col = 0; col < 6; col++) {
                const x = -8.25 + col * 3.3;  // Wider spacing

                let type = 'strong';
                if (col === 2 || col === 3) {
                    type = 'powerup';
                }

                bricks.push({ x, y, z: -1, type });  // Same Z as paddle
            }
            rows.push({ bricks });

            return rows;
        },

        // Pattern 6: Spiral
        function(level) {
            const rows = [];
            const types = ['normal', 'strong', 'armored'];

            // Create a spiral pattern
            const bricks = [];
            const centerX = 0;
            const centerY = 14;  // Higher center position
            const turns = 3;
            const bricksPerTurn = 8;

            for (let i = 0; i < turns * bricksPerTurn; i++) {
                const angle = (i / bricksPerTurn) * Math.PI * 2;
                const radius = 3 + (i / bricksPerTurn) * 2;  // Larger spiral

                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius * 0.7;

                let type = types[Math.floor(i / bricksPerTurn) % types.length];

                if (i % 10 === 0) {
                    type = 'explosive';
                } else if (Math.random() < 0.1) {
                    type = 'powerup';
                }

                bricks.push({ x, y, z: -1, type });  // Same Z as paddle
            }

            rows.push({ bricks });
            return rows;
        },

        // Pattern 7: Random chaos
        function(level) {
            const rows = [];
            const bricks = [];
            const brickCount = 30 + level * 2;
            const types = ['weak', 'normal', 'strong', 'armored', 'explosive'];

            for (let i = 0; i < brickCount; i++) {
                const x = (Math.random() - 0.5) * 28;  // Wider spread
                const y = 8 + Math.random() * 10;  // Higher position range

                // Weighted random type
                let type;
                const roll = Math.random();
                if (roll < 0.3) type = 'weak';
                else if (roll < 0.6) type = 'normal';
                else if (roll < 0.8) type = 'strong';
                else if (roll < 0.92) type = 'armored';
                else type = 'explosive';

                if (Math.random() < 0.15) {
                    type = 'powerup';
                }

                bricks.push({ x, y, z: -1, type });  // Same Z as paddle
            }

            rows.push({ bricks });
            return rows;
        }
    ]
};

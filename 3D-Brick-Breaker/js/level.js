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
                const bricksPerRow = 6;
                const startX = -(bricksPerRow - 1) * 2.2 / 2;
                const y = 8 - row * 1.2;
                const typeIndex = Math.min(row % types.length, types.length - 1);

                for (let col = 0; col < bricksPerRow; col++) {
                    const x = startX + col * 2.2;

                    // Add power-up brick occasionally
                    let type = types[typeIndex];
                    if (Math.random() < 0.1) {
                        type = 'powerup';
                    }

                    bricks.push({ x, y, z: -15, type });
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
                const startX = -(bricksInRow - 1) * 2.2 / 2;
                const y = 10 - row * 1.2;
                const type = types[Math.min(row, types.length - 1)];

                for (let col = 0; col < bricksInRow; col++) {
                    const x = startX + col * 2.2;

                    let brickType = type;
                    if (Math.random() < 0.12) {
                        brickType = 'powerup';
                    }

                    bricks.push({ x, y, z: -15, type: brickType });
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

                const startX = -(bricksInRow - 1) * 2.2 / 2;
                const y = 10 - row * 1.2;
                const type = types[Math.min(distance, types.length - 1)];

                for (let col = 0; col < bricksInRow; col++) {
                    const x = startX + col * 2.2;

                    let brickType = type;
                    if (row === centerRow && col === Math.floor(bricksInRow / 2)) {
                        brickType = 'explosive';
                    } else if (Math.random() < 0.1) {
                        brickType = 'powerup';
                    }

                    bricks.push({ x, y, z: -15, type: brickType });
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
                const y = 10 - row * 1.2;
                const startX = -(colCount - 1) * 2.2 / 2;

                for (let col = 0; col < colCount; col++) {
                    // Checkerboard pattern
                    if ((row + col) % 2 === 1) continue;

                    const x = startX + col * 2.2;
                    let type = types[(row + col) % types.length];

                    if (Math.random() < 0.08) {
                        type = 'explosive';
                    } else if (Math.random() < 0.12) {
                        type = 'powerup';
                    }

                    bricks.push({ x, y, z: -15, type });
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
                const y = 10 - row * 1.2;
                const positions = [-6.6, -4.4, 4.4, 6.6]; // Walls

                positions.forEach(x => {
                    bricks.push({ x, y, z: -15, type: 'armored' });
                });

                rows.push({ bricks });
            }

            // Middle section with gap
            for (let row = 2; row < 5; row++) {
                const bricks = [];
                const y = 10 - row * 1.2;

                for (let col = 0; col < 6; col++) {
                    // Leave gap in middle
                    if (col === 2 || col === 3) continue;

                    const x = -5.5 + col * 2.2;
                    let type = types[row % types.length];

                    if (Math.random() < 0.15) {
                        type = 'explosive';
                    }

                    bricks.push({ x, y, z: -15, type });
                }

                rows.push({ bricks });
            }

            // Bottom filled
            const bricks = [];
            const y = 10 - 5 * 1.2;
            for (let col = 0; col < 6; col++) {
                const x = -5.5 + col * 2.2;

                let type = 'strong';
                if (col === 2 || col === 3) {
                    type = 'powerup';
                }

                bricks.push({ x, y, z: -15, type });
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
            const centerY = 7;
            const turns = 3;
            const bricksPerTurn = 8;

            for (let i = 0; i < turns * bricksPerTurn; i++) {
                const angle = (i / bricksPerTurn) * Math.PI * 2;
                const radius = 2 + (i / bricksPerTurn) * 1.5;

                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius * 0.7;

                let type = types[Math.floor(i / bricksPerTurn) % types.length];

                if (i % 10 === 0) {
                    type = 'explosive';
                } else if (Math.random() < 0.1) {
                    type = 'powerup';
                }

                bricks.push({ x, y, z: -15, type });
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
                const x = (Math.random() - 0.5) * 24;
                const y = 4 + Math.random() * 8;

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

                bricks.push({ x, y, z: -15, type });
            }

            rows.push({ bricks });
            return rows;
        }
    ]
};

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
        // Use specific pattern for level (no cycling - 20 unique levels)
        const patternIndex = Math.min(levelNumber - 1, this.patterns.length - 1);
        return this.patterns[patternIndex](levelNumber);
    },

    // Helper: Get obstacle chance based on level
    getObstacleChance(level) {
        if (level === 1) return 0;       // No obstacles in level 1 (tutorial)
        if (level === 2) return 0;       // No obstacles in level 2
        if (level === 3) return 0;       // No obstacles in level 3
        if (level <= 6) return 0.05;     // 5% in levels 4-6 (gentle intro)
        if (level <= 10) return 0.08;    // 8% in levels 7-10
        if (level <= 15) return 0.12;    // 12% in levels 11-15
        return 0.15;                      // 15% in levels 16+
    },

    // Helper: Add obstacle/powerup to brick type
    addSpecialBricks(baseType, level, forceObstacle = false) {
        const roll = Math.random();
        const obstacleChance = this.getObstacleChance(level);

        if (forceObstacle || roll < obstacleChance) {
            // Progressive obstacle introduction
            const obstacles = [];
            if (level >= 4) obstacles.push('unbreakable');  // Level 4+
            if (level >= 5) obstacles.push('warp');          // Level 5+
            if (level >= 7) obstacles.push('reverse');       // Level 7+
            if (level >= 9) obstacles.push('crazy');         // Level 9+

            if (obstacles.length > 0) {
                return obstacles[Math.floor(Math.random() * obstacles.length)];
            }
        } else if (roll < obstacleChance + 0.12) {  // 12% powerups after obstacles
            return 'powerup';
        }

        return baseType;
    },

    patterns: [
        // Level 1: Simple Rows (Tutorial - no obstacles)
        function(level) {
            const rows = [];
            const bricks = [];
            const rowCount = 5;
            const bricksPerRow = 8;

            for (let row = 0; row < rowCount; row++) {
                const startX = -(bricksPerRow - 1) * 2.5 / 2;
                const y = 16 - row * 1.5;

                for (let col = 0; col < bricksPerRow; col++) {
                    const x = startX + col * 2.5;
                    let type = row < 2 ? 'weak' : (row < 4 ? 'normal' : 'strong');
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 2: Easy Pyramid
        function(level) {
            const rows = [];
            const bricks = [];
            const maxBricks = 7;

            for (let row = 0; row < maxBricks; row++) {
                const bricksInRow = maxBricks - row;
                const startX = -(bricksInRow - 1) * 3 / 2;
                const y = 18 - row * 1.6;

                for (let col = 0; col < bricksInRow; col++) {
                    const x = startX + col * 3;
                    let type = row < 2 ? 'weak' : (row < 5 ? 'normal' : 'strong');
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 3: Diamond Shape
        function(level) {
            const rows = [];
            const bricks = [];
            const centerRow = 3;

            for (let row = 0; row < 7; row++) {
                const distance = Math.abs(row - centerRow);
                const bricksInRow = 7 - distance * 2;
                if (bricksInRow <= 0) continue;

                const startX = -(bricksInRow - 1) * 3 / 2;
                const y = 18 - row * 1.8;

                for (let col = 0; col < bricksInRow; col++) {
                    const x = startX + col * 3;
                    let type = distance === 0 ? 'strong' : (distance === 1 ? 'normal' : 'weak');

                    // Center brick is explosive
                    if (row === centerRow && col === Math.floor(bricksInRow / 2)) {
                        type = 'explosive';
                    } else {
                        type = LevelManager.addSpecialBricks(type, level);
                    }

                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 4: Checkerboard (First Unbreakable obstacles!)
        function(level) {
            const rows = [];
            const bricks = [];
            const gridSize = 7;

            for (let row = 0; row < gridSize; row++) {
                const startX = -(gridSize - 1) * 2.5 / 2;
                const y = 18 - row * 1.8;

                for (let col = 0; col < gridSize; col++) {
                    if ((row + col) % 2 === 1) continue; // Checkerboard gaps

                    const x = startX + col * 2.5;
                    let type = 'normal';
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 5: Fortress (Warp bricks introduced!)
        function(level) {
            const rows = [];
            const bricks = [];

            // Top walls (armored)
            for (let row = 0; row < 2; row++) {
                const y = 18 - row * 1.6;
                const positions = [-10, -6, 6, 10];

                positions.forEach(x => {
                    let type = 'armored';
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                });
            }

            // Middle section with gap
            for (let row = 2; row < 5; row++) {
                const y = 18 - row * 1.6;

                for (let col = 0; col < 7; col++) {
                    if (col === 3) continue; // Middle gap

                    const x = -9 + col * 3;
                    let type = 'strong';
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            // Bottom filled with powerups
            const y = 18 - 5 * 1.6;
            for (let col = 0; col < 7; col++) {
                const x = -9 + col * 3;
                let type = col === 3 ? 'powerup' : 'normal';
                type = LevelManager.addSpecialBricks(type, level);
                bricks.push({ x, y, z: -1, type });
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 6: Spiral
        function(level) {
            const rows = [];
            const bricks = [];
            const centerX = 0;
            const centerY = 14;
            const turns = 3;
            const bricksPerTurn = 10;

            for (let i = 0; i < turns * bricksPerTurn; i++) {
                const angle = (i / bricksPerTurn) * Math.PI * 2;
                const radius = 2 + (i / bricksPerTurn) * 2.5;

                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius * 0.6;

                let type = i < 10 ? 'weak' : (i < 20 ? 'normal' : 'strong');
                if (i % 12 === 0) {
                    type = 'explosive';
                } else {
                    type = LevelManager.addSpecialBricks(type, level);
                }

                bricks.push({ x, y, z: -1, type });
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 7: Cross Pattern (Reverse controls introduced!)
        function(level) {
            const rows = [];
            const bricks = [];

            // Vertical line
            for (let row = 0; row < 8; row++) {
                const x = 0;
                const y = 18 - row * 1.5;
                let type = 'normal';
                type = LevelManager.addSpecialBricks(type, level);
                bricks.push({ x, y, z: -1, type });
            }

            // Horizontal line
            for (let col = 0; col < 9; col++) {
                if (col === 4) continue; // Skip center (already has vertical)

                const x = -10 + col * 2.5;
                const y = 14;
                let type = 'strong';
                type = LevelManager.addSpecialBricks(type, level);
                bricks.push({ x, y, z: -1, type });
            }

            // Corner decorations
            const corners = [
                { x: -10, y: 18 }, { x: 10, y: 18 },
                { x: -10, y: 8 }, { x: 10, y: 8 }
            ];

            corners.forEach(corner => {
                let type = 'armored';
                type = LevelManager.addSpecialBricks(type, level);
                bricks.push({ x: corner.x, y: corner.y, z: -1, type });
            });

            rows.push({ bricks });
            return rows;
        },

        // Level 8: Walls and Corridors
        function(level) {
            const rows = [];
            const bricks = [];

            // Create vertical walls with gaps
            for (let wall = 0; wall < 3; wall++) {
                const x = -9 + wall * 9;

                for (let row = 0; row < 8; row++) {
                    // Create gaps at different heights for each wall
                    if (row === 2 + wall || row === 5 + wall) continue;

                    const y = 18 - row * 1.6;
                    let type = 'strong';
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 9: Random Chaos (Crazy ball introduced!)
        function(level) {
            const rows = [];
            const bricks = [];
            const brickCount = 45;

            for (let i = 0; i < brickCount; i++) {
                const x = (Math.random() - 0.5) * 26;
                const y = 8 + Math.random() * 12;

                const roll = Math.random();
                let type;
                if (roll < 0.3) type = 'weak';
                else if (roll < 0.6) type = 'normal';
                else if (roll < 0.85) type = 'strong';
                else type = 'armored';

                type = LevelManager.addSpecialBricks(type, level);
                bricks.push({ x, y, z: -1, type });
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 10: Maze
        function(level) {
            const rows = [];
            const bricks = [];

            // Create maze walls
            const mazePattern = [
                [1, 1, 1, 0, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 0, 1, 1, 1, 0, 1],
                [0, 0, 1, 0, 1, 0, 0],
                [1, 0, 1, 0, 1, 0, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 0, 1, 1, 1]
            ];

            for (let row = 0; row < mazePattern.length; row++) {
                for (let col = 0; col < mazePattern[row].length; col++) {
                    if (mazePattern[row][col] === 0) continue;

                    const x = -9 + col * 3;
                    const y = 18 - row * 1.8;
                    let type = 'strong';
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 11: Target Practice (Bullseye)
        function(level) {
            const rows = [];
            const bricks = [];
            const centerX = 0;
            const centerY = 14;
            const rings = 4;

            for (let ring = 0; ring < rings; ring++) {
                const radius = (ring + 1) * 2.5;
                const bricksInRing = 8 + ring * 4;

                for (let i = 0; i < bricksInRing; i++) {
                    const angle = (i / bricksInRing) * Math.PI * 2;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius * 0.6;

                    let type = ring === 0 ? 'explosive' : (ring === 1 ? 'strong' : 'normal');
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 12: Hourglass
        function(level) {
            const rows = [];
            const bricks = [];

            for (let row = 0; row < 9; row++) {
                const distance = Math.abs(row - 4);
                const bricksInRow = 3 + distance;

                const startX = -(bricksInRow - 1) * 2.5 / 2;
                const y = 18 - row * 1.5;

                for (let col = 0; col < bricksInRow; col++) {
                    const x = startX + col * 2.5;
                    let type = distance < 2 ? 'armored' : (distance < 4 ? 'strong' : 'normal');
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 13: Double Diamond
        function(level) {
            const rows = [];
            const bricks = [];

            // Left diamond
            for (let row = 0; row < 5; row++) {
                const distance = Math.abs(row - 2);
                const bricksInRow = 5 - distance * 2;
                if (bricksInRow <= 0) continue;

                const startX = -12 - (bricksInRow - 1) * 1.5 / 2;
                const y = 16 - row * 2;

                for (let col = 0; col < bricksInRow; col++) {
                    const x = startX + col * 1.5;
                    let type = 'normal';
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            // Right diamond
            for (let row = 0; row < 5; row++) {
                const distance = Math.abs(row - 2);
                const bricksInRow = 5 - distance * 2;
                if (bricksInRow <= 0) continue;

                const startX = 12 - (bricksInRow - 1) * 1.5 / 2;
                const y = 16 - row * 2;

                for (let col = 0; col < bricksInRow; col++) {
                    const x = startX + col * 1.5;
                    let type = 'strong';
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 14: Staircase
        function(level) {
            const rows = [];
            const bricks = [];
            const steps = 7;

            for (let step = 0; step < steps; step++) {
                const y = 18 - step * 1.8;
                const bricksInStep = 3;

                for (let col = 0; col < bricksInStep; col++) {
                    const x = -10 + step * 3 + col * 1.5;
                    let type = step < 3 ? 'normal' : (step < 5 ? 'strong' : 'armored');
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 15: Grid with Holes
        function(level) {
            const rows = [];
            const bricks = [];
            const gridSize = 8;

            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    // Create holes in a pattern
                    if ((row === 2 && col === 2) || (row === 2 && col === 5) ||
                        (row === 5 && col === 2) || (row === 5 && col === 5)) {
                        continue; // Holes
                    }

                    const x = -10 + col * 2.5;
                    const y = 18 - row * 1.6;
                    let type = 'normal';
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 16: Zigzag
        function(level) {
            const rows = [];
            const bricks = [];

            for (let row = 0; row < 10; row++) {
                const offset = (row % 2) * 6; // Alternating offset
                const y = 18 - row * 1.4;

                for (let col = 0; col < 5; col++) {
                    const x = -12 + offset + col * 2.5;
                    let type = 'strong';
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 17: Flower Pattern
        function(level) {
            const rows = [];
            const bricks = [];
            const centerX = 0;
            const centerY = 14;
            const petals = 6;

            // Center
            bricks.push({ x: centerX, y: centerY, z: -1, type: 'explosive' });

            // Petals
            for (let petal = 0; petal < petals; petal++) {
                const angle = (petal / petals) * Math.PI * 2;
                const petalRadius = 5;

                for (let i = 0; i < 4; i++) {
                    const r = (i + 1) * 1.5;
                    const x = centerX + Math.cos(angle) * r;
                    const y = centerY + Math.sin(angle) * r * 0.7;

                    let type = i < 2 ? 'normal' : 'strong';
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 18: Castle
        function(level) {
            const rows = [];
            const bricks = [];

            // Towers
            for (let tower = 0; tower < 2; tower++) {
                const x = tower === 0 ? -10 : 10;

                for (let row = 0; row < 6; row++) {
                    const y = 18 - row * 1.6;
                    let type = 'armored';
                    type = LevelManager.addSpecialBricks(type, level, true); // Force obstacles
                    bricks.push({ x, y, z: -1, type });
                }

                // Tower top (battlements)
                bricks.push({ x: x - 2, y: 18 + 1.6, z: -1, type: 'strong' });
                bricks.push({ x: x + 2, y: 18 + 1.6, z: -1, type: 'strong' });
            }

            // Castle wall
            for (let col = 0; col < 7; col++) {
                if (col === 3) continue; // Gate

                const x = -8 + col * 2.5;
                const y = 13;
                let type = 'strong';
                type = LevelManager.addSpecialBricks(type, level);
                bricks.push({ x, y, z: -1, type });
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 19: Wave Pattern
        function(level) {
            const rows = [];
            const bricks = [];
            const waves = 3;
            const bricksPerWave = 30;

            for (let i = 0; i < bricksPerWave; i++) {
                const x = -12 + (i / bricksPerWave) * 24;
                const waveOffset = Math.sin(i * 0.5) * 4;
                const y = 14 + waveOffset;

                let type = i < 10 ? 'normal' : (i < 20 ? 'strong' : 'armored');
                type = LevelManager.addSpecialBricks(type, level);
                bricks.push({ x, y, z: -1, type });
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 20: Final Boss (Dense, all obstacles!)
        function(level) {
            const rows = [];
            const bricks = [];
            const gridSize = 10;

            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    const x = -11.25 + col * 2.5;
                    const y = 18 - row * 1.4;

                    // Center explosive
                    if (row === 4 && col === 4) {
                        bricks.push({ x, y, z: -1, type: 'explosive' });
                        continue;
                    }

                    let type = row < 3 ? 'normal' : (row < 7 ? 'strong' : 'armored');
                    type = LevelManager.addSpecialBricks(type, level, true); // Force many obstacles
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        }
    ]
};

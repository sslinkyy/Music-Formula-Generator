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

    // Helper: Add only powerups (for tutorial levels 1-3)
    addPowerupsOnly(baseType) {
        const roll = Math.random();
        if (roll < 0.08) {  // 8% chance for powerups in tutorial levels
            return 'powerup';
        }
        return baseType;
    },

    patterns: [
        // Level 1: Simple Rows (Tutorial - no obstacles)
        function(level) {
            const rows = [];
            const bricks = [];
            const rowCount = 18;  // Increased to fill top space (was 15)
            const bricksPerRow = 10;  // Increased to fill horizontal space (was 8)

            for (let row = 0; row < rowCount; row++) {
                const startX = -(bricksPerRow - 1) * 2.5 / 2;
                const y = 25 - row * 1.5;  // Higher starting Y to fill top space

                for (let col = 0; col < bricksPerRow; col++) {
                    const x = startX + col * 2.5;
                    let type = row < 6 ? 'weak' : (row < 12 ? 'normal' : 'strong');
                    type = LevelManager.addPowerupsOnly(type);  // Add powerups but no obstacles
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 2: Easy Pyramid (No obstacles - tutorial level)
        function(level) {
            const rows = [];
            const bricks = [];
            const maxBricks = 11;  // Reduced to fit within ball reach (was 13, ±15*3.3=±49.5 < ±52.8)

            for (let row = 0; row < maxBricks; row++) {
                const bricksInRow = maxBricks - row;
                const startX = -(bricksInRow - 1) * 3 / 2;
                const y = 28 - row * 1.6;  // Higher starting Y to fill top space

                for (let col = 0; col < bricksInRow; col++) {
                    const x = startX + col * 3;
                    let type = row < 4 ? 'weak' : (row < 8 ? 'normal' : 'strong');
                    type = LevelManager.addPowerupsOnly(type);  // Add powerups but no obstacles
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 3: Diamond Shape (No obstacles - tutorial level)
        function(level) {
            const rows = [];
            const bricks = [];
            const centerRow = 5;  // Increased from 3 to 5

            for (let row = 0; row < 11; row++) {  // Increased from 7 to 11 rows (~61 bricks)
                const distance = Math.abs(row - centerRow);
                const bricksInRow = 11 - distance * 2;
                if (bricksInRow <= 0) continue;

                const startX = -(bricksInRow - 1) * 3 / 2;
                const y = 26 - row * 1.8;  // Adjusted starting Y position

                for (let col = 0; col < bricksInRow; col++) {
                    const x = startX + col * 3;
                    let type = distance === 0 ? 'strong' : (distance <= 2 ? 'normal' : 'weak');

                    // Center brick is explosive
                    if (row === centerRow && col === Math.floor(bricksInRow / 2)) {
                        type = 'explosive';
                    } else {
                        type = LevelManager.addPowerupsOnly(type);  // Add powerups but no obstacles
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
            const gridSize = 10;  // Increased from 7 to 10 (~50 bricks)

            for (let row = 0; row < gridSize; row++) {
                const startX = -(gridSize - 1) * 2.5 / 2;
                const y = 24 - row * 1.8;  // Adjusted starting Y position

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

            // Top walls (armored) - doubled rows
            for (let row = 0; row < 4; row++) {  // Increased from 2 to 4
                const y = 28 - row * 1.6;  // Higher starting Y to fill top space
                const positions = [-10, -6, 6, 10];

                positions.forEach(x => {
                    let type = 'armored';
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                });
            }

            // Middle section with gap - doubled rows
            for (let row = 4; row < 10; row++) {  // Increased from 3 to 6 rows
                const y = 28 - row * 1.6;

                for (let col = 0; col < 7; col++) {
                    if (col === 3) continue; // Middle gap

                    const x = -9 + col * 3;
                    let type = 'strong';
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            // Bottom filled with powerups - doubled rows
            for (let bottomRow = 10; bottomRow < 12; bottomRow++) {  // Added 2 rows instead of 1
                const y = 28 - bottomRow * 1.6;
                for (let col = 0; col < 7; col++) {
                    const x = -9 + col * 3;
                    let type = col === 3 ? 'powerup' : 'normal';
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 6: Spiral
        function(level) {
            const rows = [];
            const bricks = [];
            const centerX = 0;
            const centerY = 25;  // Higher center Y to fill top space
            const turns = 6;  // Doubled from 3 to 6 turns (~60 bricks)
            const bricksPerTurn = 10;

            for (let i = 0; i < turns * bricksPerTurn; i++) {
                const angle = (i / bricksPerTurn) * Math.PI * 2;
                const radius = 2 + (i / bricksPerTurn) * 2.5;

                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius * 0.6;

                let type = i < 20 ? 'weak' : (i < 40 ? 'normal' : 'strong');
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

            // Double vertical lines (two parallel lines)
            for (let row = 0; row < 8; row++) {
                for (let offset of [-1.5, 1.5]) {  // Two vertical lines
                    const x = offset;
                    const y = 26 - row * 1.5;  // Adjusted starting Y
                    let type = 'normal';
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            // Double horizontal lines (two parallel lines)
            for (let horizontalRow of [0, 1]) {  // Two horizontal lines
                for (let col = 0; col < 9; col++) {
                    if (col === 4) continue; // Skip center

                    const x = -10 + col * 2.5;
                    const y = 18 - horizontalRow * 2;
                    let type = 'strong';
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            // Double corner decorations (2 bricks per corner)
            const corners = [
                { x: -12, y: 26 }, { x: -10, y: 26 }, { x: 10, y: 26 }, { x: 12, y: 26 },
                { x: -12, y: 10 }, { x: -10, y: 10 }, { x: 10, y: 10 }, { x: 12, y: 10 }
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

            // Create vertical walls with gaps - doubled to 6 walls
            for (let wall = 0; wall < 6; wall++) {  // Increased from 3 to 6 walls
                const x = -13.5 + wall * 5.4;  // Adjusted spacing

                for (let row = 0; row < 8; row++) {
                    // Create gaps at different heights for each wall
                    if (row === 2 + (wall % 3) || row === 5 + (wall % 3)) continue;

                    const y = 28 - row * 1.6;  // Higher starting Y to fill top space
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
            const brickCount = 120;  // Increased to fill expanded area (was 90)

            for (let i = 0; i < brickCount; i++) {
                const x = (Math.random() - 0.5) * 30;  // Wider spread
                const y = 15 + Math.random() * 25;  // Taller spread to fill top space (Y 15-40)

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

            // Create maze walls - expanded to 10x10 pattern (~64 bricks)
            const mazePattern = [
                [1, 1, 1, 0, 1, 1, 1, 0, 1, 1],
                [1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
                [1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
                [0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
                [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 0, 1, 1, 1, 0, 1, 1],
                [1, 0, 1, 0, 0, 0, 1, 0, 0, 1],
                [1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
                [1, 1, 1, 0, 1, 1, 1, 0, 1, 1]
            ];

            for (let row = 0; row < mazePattern.length; row++) {
                for (let col = 0; col < mazePattern[row].length; col++) {
                    if (mazePattern[row][col] === 0) continue;

                    const x = -13.5 + col * 3;
                    const y = 28 - row * 1.8;  // Adjusted starting Y
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
            const centerY = 25;  // Higher center Y to fill top space
            const rings = 8;  // Doubled from 4 to 8 rings (~120 bricks)

            for (let ring = 0; ring < rings; ring++) {
                const radius = (ring + 1) * 2.5;
                const bricksInRing = 8 + ring * 4;

                for (let i = 0; i < bricksInRing; i++) {
                    const angle = (i / bricksInRing) * Math.PI * 2;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius * 0.6;

                    let type = ring === 0 ? 'explosive' : (ring <= 2 ? 'strong' : 'normal');
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

            for (let row = 0; row < 17; row++) {  // Doubled from 9 to 17 rows (~90 bricks)
                const distance = Math.abs(row - 8);  // Center at row 8
                const bricksInRow = 3 + distance;

                const startX = -(bricksInRow - 1) * 2.5 / 2;
                const y = 30 - row * 1.5;  // Adjusted starting Y

                for (let col = 0; col < bricksInRow; col++) {
                    const x = startX + col * 2.5;
                    let type = distance < 3 ? 'armored' : (distance < 6 ? 'strong' : 'normal');
                    type = LevelManager.addSpecialBricks(type, level);
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        },

        // Level 13: Quad Diamond (doubled to 4 diamonds)
        function(level) {
            const rows = [];
            const bricks = [];

            const diamondPositions = [
                { centerX: -12, centerY: 28, type: 'normal' },
                { centerX: 12, centerY: 28, type: 'strong' },
                { centerX: -12, centerY: 18, type: 'strong' },
                { centerX: 12, centerY: 18, type: 'armored' }
            ];

            diamondPositions.forEach(diamond => {
                for (let row = 0; row < 5; row++) {
                    const distance = Math.abs(row - 2);
                    const bricksInRow = 5 - distance * 2;
                    if (bricksInRow <= 0) continue;

                    const startX = diamond.centerX - (bricksInRow - 1) * 1.5 / 2;
                    const y = diamond.centerY - row * 2;

                    for (let col = 0; col < bricksInRow; col++) {
                        const x = startX + col * 1.5;
                        let type = diamond.type;
                        type = LevelManager.addSpecialBricks(type, level);
                        bricks.push({ x, y, z: -1, type });
                    }
                }
            });

            rows.push({ bricks });
            return rows;
        },

        // Level 14: Staircase
        function(level) {
            const rows = [];
            const bricks = [];
            const steps = 14;  // Doubled from 7 to 14 steps (~42 bricks)

            for (let step = 0; step < steps; step++) {
                const y = 30 - step * 1.6;  // Adjusted starting Y and spacing
                const bricksInStep = 3;

                for (let col = 0; col < bricksInStep; col++) {
                    const x = -16 + step * 2.5 + col * 1.5;  // Adjusted starting X
                    let type = step < 5 ? 'normal' : (step < 10 ? 'strong' : 'armored');
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
            const gridSize = 11;  // Increased from 8 to 11 (~112 bricks)

            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    // Create holes in a pattern (9 holes total)
                    if ((row === 2 && col === 2) || (row === 2 && col === 5) || (row === 2 && col === 8) ||
                        (row === 5 && col === 2) || (row === 5 && col === 5) || (row === 5 && col === 8) ||
                        (row === 8 && col === 2) || (row === 8 && col === 5) || (row === 8 && col === 8)) {
                        continue; // Holes
                    }

                    const x = -13 + col * 2.5;
                    const y = 26 - row * 1.6;  // Adjusted starting Y
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

            for (let row = 0; row < 20; row++) {  // Doubled from 10 to 20 rows (~100 bricks)
                const offset = (row % 2) * 6; // Alternating offset
                const y = 32 - row * 1.4;  // Adjusted starting Y

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
            const centerY = 25;  // Higher center Y to fill top space
            const petals = 12;  // Doubled from 6 to 12 petals (~50 bricks)

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

            // Towers (doubled height and added 2 more towers)
            for (let tower = 0; tower < 4; tower++) {  // Increased from 2 to 4 towers
                const x = tower === 0 ? -14 : (tower === 1 ? -6 : (tower === 2 ? 6 : 14));

                for (let row = 0; row < 10; row++) {  // Doubled from 6 to 10 rows
                    const y = 28 - row * 1.6;  // Adjusted starting Y
                    let type = 'armored';
                    type = LevelManager.addSpecialBricks(type, level, true); // Force obstacles
                    bricks.push({ x, y, z: -1, type });
                }

                // Tower top (battlements)
                bricks.push({ x: x - 2, y: 28 + 1.6, z: -1, type: 'strong' });
                bricks.push({ x: x + 2, y: 28 + 1.6, z: -1, type: 'strong' });
            }

            // Castle wall (doubled length)
            for (let col = 0; col < 13; col++) {  // Increased from 7 to 13
                if (col === 6) continue; // Gate (center)

                const x = -15 + col * 2.5;
                const y = 14;
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
            const bricksPerWave = 60;  // Doubled from 30 to 60

            for (let i = 0; i < bricksPerWave; i++) {
                const x = -14 + (i / bricksPerWave) * 28;
                const waveOffset = Math.sin(i * 0.5) * 5;  // Increased amplitude
                const y = 25 + waveOffset;  // Higher center Y to fill top space

                let type = i < 20 ? 'normal' : (i < 40 ? 'strong' : 'armored');
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
            const gridSize = 18;  // Increased to fill expanded area (was 14, ~324 bricks)

            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    const x = -20 + col * 2.5;
                    const y = 35 - row * 1.5;  // Adjusted starting Y

                    // Center explosive
                    if (row === 9 && col === 9) {
                        bricks.push({ x, y, z: -1, type: 'explosive' });
                        continue;
                    }

                    let type = row < 6 ? 'normal' : (row < 12 ? 'strong' : 'armored');
                    type = LevelManager.addSpecialBricks(type, level, true); // Force many obstacles
                    bricks.push({ x, y, z: -1, type });
                }
            }

            rows.push({ bricks });
            return rows;
        }
    ]
};

// Ballz - Brick Breaker Game
// Launch balls to break numbered bricks, collect ball powerups, and survive!

import { GENRE_LIBRARY } from '../../data/genres.js';

export function buildBallzGameDialog(onFinish, options = {}) {
  const wrap = document.createElement('div');
  const difficulty = options.difficulty || 'normal';

  // Calculate responsive canvas size
  const maxWidth = Math.min(500, window.innerWidth - 40);
  const CANVAS_WIDTH = maxWidth;
  const CANVAS_HEIGHT = Math.min(700, window.innerHeight - 300);

  // Game constants
  const GRID_COLS = 7;
  const GRID_ROWS = 10;
  const BRICK_SIZE = CANVAS_WIDTH / GRID_COLS;
  const BALL_RADIUS = 5;
  const PLATFORM_Y = CANVAS_HEIGHT - 40;
  const BASE_BALL_SPEED = 6;
  const LAUNCH_DELAY = 50; // ms between each ball launch
  const MAX_TRAJECTORY_BOUNCES = 3;

  // Controls
  const controls = document.createElement('div');
  controls.className = 'inline-buttons';
  controls.style.marginBottom = '10px';

  const startBtn = document.createElement('button');
  startBtn.className = 'btn-primary';
  startBtn.textContent = 'Start Game';

  const restartBtn = document.createElement('button');
  restartBtn.textContent = 'Restart';
  restartBtn.disabled = true;

  const quitBtn = document.createElement('button');
  quitBtn.textContent = 'Quit';

  controls.appendChild(startBtn);
  controls.appendChild(restartBtn);
  controls.appendChild(quitBtn);
  wrap.appendChild(controls);

  // Score display
  const scoreDiv = document.createElement('div');
  scoreDiv.className = 'hint';
  scoreDiv.style.margin = '10px 0';
  scoreDiv.style.fontSize = '16px';
  scoreDiv.textContent = 'Balls: 1 | Turn: 1 | Score: 0';
  wrap.appendChild(scoreDiv);

  // Canvas
  const canvas = document.createElement('canvas');
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  canvas.style.width = CANVAS_WIDTH + 'px';
  canvas.style.height = CANVAS_HEIGHT + 'px';
  canvas.style.background = '#1a1a2e';
  canvas.style.borderRadius = '12px';
  canvas.style.display = 'block';
  canvas.style.cursor = 'crosshair';
  canvas.style.margin = '0 auto';
  canvas.style.touchAction = 'none'; // Prevent scrolling on touch

  wrap.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Instructions
  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.style.margin = '10px 0';
  hint.textContent = 'Desktop: Move mouse to aim, click to launch. Mobile: Touch and drag to aim, release to launch!';
  wrap.appendChild(hint);

  // Game state
  let running = false;
  let gameOver = false;
  let turn = 1;
  let score = 0;
  let ballCount = 1;
  let platformX = CANVAS_WIDTH / 2;
  let aimAngle = -Math.PI / 2; // Up
  let balls = []; // Active balls in flight
  let bricks = []; // {row, col, hits, isBall, isLife, isMetal}
  let launchInProgress = false;
  let ballsToLaunch = 0;
  let launchTimer = 0;
  let returnX = platformX; // Where balls will return to
  let collecting = false; // Are balls returning?
  let tags = new Set();
  let keywords = new Set();
  let isAiming = false; // Track if user is aiming
  let isTouching = false; // Track touch state
  let touchStartX = 0;
  let touchStartY = 0;

  // Mouse/touch position
  let mouseX = CANVAS_WIDTH / 2;
  let mouseY = CANVAS_HEIGHT / 2;

  // Difficulty scaling functions
  function getBallSpeed() {
    // Slightly increase speed every 10 turns (max +50%)
    return BASE_BALL_SPEED * (1 + Math.min(0.5, turn / 50));
  }

  function getMinHits() {
    // Minimum hits increases: 1, 1, 2, 3, 5, 8, 12...
    return Math.max(1, Math.floor(turn / 3));
  }

  function getMaxHits() {
    // Maximum hits scales faster
    return Math.min(Math.ceil(turn * 2), 50);
  }

  function getNumBricks() {
    // Start with 2-3, increase to fill most columns
    return Math.min(2 + Math.floor(turn / 2), GRID_COLS - 1);
  }

  function getBallPowerupChance() {
    // Start at 25%, decrease to 10% by turn 30
    return Math.max(0.10, 0.25 - (turn * 0.005));
  }

  function getExtraLifeChance() {
    // Very rare: 6% chance, only after turn 5
    return turn > 5 ? 0.06 : 0;
  }

  function shouldSpawnSecondRow() {
    // After turn 15, 30% chance to spawn bricks in row 1 too
    return turn > 15 && Math.random() < 0.3;
  }

  function getMetalBrickChance() {
    // After turn 10, 15% chance for a brick to be "metal" (extra tough)
    return turn > 10 ? 0.15 : 0;
  }

  // Add new row of bricks at the top
  function addBrickRow() {
    const numBricks = getNumBricks();
    const minHits = getMinHits();
    const maxHits = getMaxHits();
    const ballChance = getBallPowerupChance();
    const lifeChance = getExtraLifeChance();
    const metalChance = getMetalBrickChance();

    const positions = [];
    for (let col = 0; col < GRID_COLS; col++) {
      positions.push(col);
    }

    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Determine what special items to add
    let hasLife = false;
    let hasBall = false;
    const specialSlots = [];

    // Very rare extra life (only one per row, very infrequent)
    if (Math.random() < lifeChance && ballCount > 1) {
      hasLife = true;
      specialSlots.push({ type: 'life', index: Math.floor(Math.random() * numBricks) });
    }

    // Ball powerups (can have multiple)
    for (let i = 0; i < numBricks; i++) {
      if (Math.random() < ballChance && !specialSlots.find(s => s.index === i)) {
        specialSlots.push({ type: 'ball', index: i });
      }
    }

    // Add bricks to row 0 (and maybe row 1)
    const rows = shouldSpawnSecondRow() ? [0, 1] : [0];

    rows.forEach(rowNum => {
      for (let i = 0; i < numBricks; i++) {
        const col = positions[i];
        const special = specialSlots.find(s => s.index === i);

        if (special && rowNum === 0) { // Only add powerups to top row
          if (special.type === 'life') {
            bricks.push({
              row: rowNum,
              col: col,
              hits: 0,
              isBall: false,
              isLife: true,
              isMetal: false
            });
          } else if (special.type === 'ball') {
            bricks.push({
              row: rowNum,
              col: col,
              hits: 0,
              isBall: true,
              isLife: false,
              isMetal: false
            });
          }
        } else {
          // Normal brick
          const isMetal = Math.random() < metalChance;
          const hits = isMetal
            ? Math.ceil(minHits + Math.random() * (maxHits - minHits)) * 2 // Metal = 2x hits
            : Math.ceil(minHits + Math.random() * (maxHits - minHits));

          bricks.push({
            row: rowNum,
            col: col,
            hits: hits,
            isBall: false,
            isLife: false,
            isMetal: isMetal
          });
        }
      }
    });
  }

  // Drop all bricks down one row
  function dropBricks() {
    bricks.forEach(brick => {
      brick.row++;
    });

    // Check game over - if any brick reaches the bottom
    const bottomBrick = bricks.find(b => !b.isBall && !b.isLife && b.row >= GRID_ROWS);
    if (bottomBrick) {
      endGame();
      return false;
    }
    return true;
  }

  // Start new turn
  function startNewTurn() {
    turn++;

    // Drop all existing bricks
    const canContinue = dropBricks();
    if (!canContinue) return;

    // Add new row at top
    addBrickRow();
  }

  // Ball class
  class Ball {
    constructor(x, y, vx, vy) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.radius = BALL_RADIUS;
      this.returning = false;
    }

    update() {
      if (this.returning) {
        // Move toward return point
        const dx = returnX - this.x;
        const dy = PLATFORM_Y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const speed = getBallSpeed();
        if (dist < speed) {
          return true; // Reached destination
        }

        this.x += (dx / dist) * speed;
        this.y += (dy / dist) * speed;
        return false;
      }

      // Normal movement
      this.x += this.vx;
      this.y += this.vy;

      // Wall collisions
      if (this.x - this.radius < 0) {
        this.x = this.radius;
        this.vx = Math.abs(this.vx);
      }
      if (this.x + this.radius > CANVAS_WIDTH) {
        this.x = CANVAS_WIDTH - this.radius;
        this.vx = -Math.abs(this.vx);
      }
      if (this.y - this.radius < 0) {
        this.y = this.radius;
        this.vy = Math.abs(this.vy);
      }

      // Check brick collisions
      this.checkBrickCollisions();

      // Check if ball reached bottom
      if (this.y >= PLATFORM_Y && !this.returning) {
        this.returning = true;
        if (!collecting) {
          collecting = true;
          returnX = this.x; // First ball sets the return point
        }
      }

      return false;
    }

    checkBrickCollisions() {
      for (let i = bricks.length - 1; i >= 0; i--) {
        const brick = bricks[i];
        const brickX = brick.col * BRICK_SIZE + BRICK_SIZE / 2;
        const brickY = brick.row * BRICK_SIZE + BRICK_SIZE / 2;
        const brickHalfSize = BRICK_SIZE / 2 - 2;

        // Simple circle-rectangle collision
        const closestX = Math.max(brickX - brickHalfSize, Math.min(this.x, brickX + brickHalfSize));
        const closestY = Math.max(brickY - brickHalfSize, Math.min(this.y, brickY + brickHalfSize));

        const dx = this.x - closestX;
        const dy = this.y - closestY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radius) {
          if (brick.isBall) {
            // Collect ball powerup
            ballCount++;
            bricks.splice(i, 1);
            score += 10;
            collectGenreTag();
          } else if (brick.isLife) {
            // Collect extra life (adds 1 ball)
            ballCount++;
            bricks.splice(i, 1);
            score += 25;
            collectGenreTag();
          } else {
            // Hit brick
            brick.hits--;
            score += brick.isMetal ? 2 : 1; // Metal bricks worth more points

            if (brick.hits <= 0) {
              bricks.splice(i, 1);
              score += brick.isMetal ? 10 : 5;
              collectGenreTag();
            }

            // Bounce ball based on hit side
            const centerDx = this.x - brickX;
            const centerDy = this.y - brickY;

            if (Math.abs(centerDx) > Math.abs(centerDy)) {
              this.vx = -this.vx;
            } else {
              this.vy = -this.vy;
            }
          }
          break;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.returning ? '#4CAF50' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = this.returning ? '#45a049' : '#cccccc';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Collect genre tags/keywords
  function collectGenreTag() {
    const genres = Object.keys(GENRE_LIBRARY);
    if (genres.length > 0) {
      const genre = genres[Math.floor(Math.random() * genres.length)];
      const genreData = GENRE_LIBRARY[genre];

      if (genreData.tags && genreData.tags.length > 0) {
        const tag = genreData.tags[Math.floor(Math.random() * genreData.tags.length)];
        tags.add(tag);
      }

      if (genreData.keywords && genreData.keywords.length > 0) {
        const kw = genreData.keywords[Math.floor(Math.random() * genreData.keywords.length)];
        keywords.add(kw);
      }
    }
  }

  // Calculate trajectory with bounces
  function calculateTrajectory(startX, startY, angle, maxBounces = MAX_TRAJECTORY_BOUNCES) {
    const points = [{x: startX, y: startY}];
    let x = startX;
    let y = startY;
    const speed = getBallSpeed();
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    let bounces = 0;
    const maxSteps = 200;

    for (let step = 0; step < maxSteps && bounces < maxBounces; step++) {
      x += vx;
      y += vy;

      // Check walls
      if (x < 0) {
        x = 0;
        vx = Math.abs(vx);
        bounces++;
        points.push({x, y});
      } else if (x > CANVAS_WIDTH) {
        x = CANVAS_WIDTH;
        vx = -Math.abs(vx);
        bounces++;
        points.push({x, y});
      }

      if (y < 0) {
        y = 0;
        vy = Math.abs(vy);
        bounces++;
        points.push({x, y});
      }

      // Stop if we hit platform level or go below
      if (y >= PLATFORM_Y) {
        points.push({x, y: PLATFORM_Y});
        break;
      }

      // Add points every few steps for smooth line
      if (step % 8 === 0) {
        points.push({x, y});
      }
    }

    return points;
  }

  // Draw functions
  function drawBricks() {
    bricks.forEach(brick => {
      const x = brick.col * BRICK_SIZE;
      const y = brick.row * BRICK_SIZE;

      if (brick.isBall) {
        // Draw ball collectible
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + BRICK_SIZE / 2, y + BRICK_SIZE / 2, BRICK_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw "+" symbol
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const plusSize = 6;
        ctx.moveTo(x + BRICK_SIZE / 2, y + BRICK_SIZE / 2 - plusSize);
        ctx.lineTo(x + BRICK_SIZE / 2, y + BRICK_SIZE / 2 + plusSize);
        ctx.moveTo(x + BRICK_SIZE / 2 - plusSize, y + BRICK_SIZE / 2);
        ctx.lineTo(x + BRICK_SIZE / 2 + plusSize, y + BRICK_SIZE / 2);
        ctx.stroke();
      } else if (brick.isLife) {
        // Draw extra life (heart)
        ctx.fillStyle = '#FF1493';
        ctx.beginPath();
        const cx = x + BRICK_SIZE / 2;
        const cy = y + BRICK_SIZE / 2;
        const size = BRICK_SIZE / 4;
        // Simple heart shape
        ctx.moveTo(cx, cy + size / 2);
        ctx.bezierCurveTo(cx, cy, cx - size, cy - size / 2, cx - size, cy);
        ctx.bezierCurveTo(cx - size, cy + size / 2, cx, cy + size, cx, cy + size);
        ctx.bezierCurveTo(cx, cy + size, cx + size, cy + size / 2, cx + size, cy);
        ctx.bezierCurveTo(cx + size, cy - size / 2, cx, cy, cx, cy + size / 2);
        ctx.fill();
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Draw numbered brick with color based on hits
        const maxHits = getMaxHits();
        const hitRatio = Math.max(0, Math.min(1, brick.hits / maxHits));

        let fillColor;
        if (brick.isMetal) {
          // Metal bricks are gray/silver
          fillColor = `hsl(0, 0%, ${30 + hitRatio * 30}%)`;
        } else {
          // Normal bricks: red (low) to green (high)
          const hue = hitRatio * 120;
          fillColor = `hsl(${hue}, 70%, 50%)`;
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(x + 2, y + 2, BRICK_SIZE - 4, BRICK_SIZE - 4);

        // Metal bricks have special border
        ctx.strokeStyle = brick.isMetal ? '#C0C0C0' : '#ffffff';
        ctx.lineWidth = brick.isMetal ? 2 : 1;
        ctx.strokeRect(x + 2, y + 2, BRICK_SIZE - 4, BRICK_SIZE - 4);

        // Draw number
        ctx.fillStyle = '#ffffff';
        ctx.font = brick.isMetal ? 'bold 16px Arial' : 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(brick.hits, x + BRICK_SIZE / 2, y + BRICK_SIZE / 2);
      }
    });
  }

  function drawPlatform() {
    const platformWidth = 30;
    const platformHeight = 6;

    // Draw platform
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(
      platformX - platformWidth / 2,
      PLATFORM_Y - platformHeight / 2,
      platformWidth,
      platformHeight
    );

    // Draw ball count indicator on platform
    if (balls.length === 0 && !launchInProgress) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(ballCount, platformX, PLATFORM_Y - 10);
    }
  }

  function drawTrajectory() {
    if (launchInProgress || balls.length > 0 || !isAiming) return;

    const points = calculateTrajectory(platformX, PLATFORM_Y, aimAngle);

    // Draw trajectory line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
    ctx.setLineDash([]);

    // Draw aiming dots along trajectory
    for (let i = 0; i < points.length; i += 3) {
      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
    }
  }

  function drawBalls() {
    balls.forEach(ball => ball.draw());
  }

  function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid lines (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * BRICK_SIZE, 0);
      ctx.lineTo(i * BRICK_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Draw danger zone line
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, GRID_ROWS * BRICK_SIZE);
    ctx.lineTo(CANVAS_WIDTH, GRID_ROWS * BRICK_SIZE);
    ctx.stroke();
    ctx.setLineDash([]);

    drawBricks();
    drawPlatform();
    drawTrajectory();
    drawBalls();

    // Update score display
    scoreDiv.textContent = `Balls: ${ballCount} | Turn: ${turn} | Score: ${score}`;
  }

  // Game loop
  function gameLoop() {
    if (!running) return;

    // Update balls
    for (let i = balls.length - 1; i >= 0; i--) {
      const done = balls[i].update();
      if (done) {
        balls.splice(i, 1);

        // All balls returned
        if (balls.length === 0 && !launchInProgress) {
          collecting = false;
          platformX = returnX;
          startNewTurn();
        }
      }
    }

    // Launch balls with delay
    if (launchInProgress && ballsToLaunch > 0) {
      launchTimer -= 16;
      if (launchTimer <= 0) {
        const speed = getBallSpeed();
        const vx = Math.cos(aimAngle) * speed;
        const vy = Math.sin(aimAngle) * speed;
        balls.push(new Ball(platformX, PLATFORM_Y, vx, vy));
        ballsToLaunch--;
        launchTimer = LAUNCH_DELAY;

        if (ballsToLaunch === 0) {
          launchInProgress = false;
        }
      }
    }

    draw();
    requestAnimationFrame(gameLoop);
  }

  // Update aim angle from position
  function updateAimFromPosition(posX, posY) {
    // Only allow aiming when not launching
    if (launchInProgress || balls.length > 0) return;

    // Calculate angle from platform to position
    const dx = posX - platformX;
    const dy = posY - PLATFORM_Y;
    aimAngle = Math.atan2(dy, dx);

    // Angle limits: 10 degrees minimum from horizontal on each side
    // This prevents near-horizontal shots that take too long
    const MIN_ANGLE_FROM_HORIZONTAL = Math.PI / 18; // 10 degrees
    const LEFT_LIMIT = -Math.PI + MIN_ANGLE_FROM_HORIZONTAL;  // -170 degrees
    const RIGHT_LIMIT = -MIN_ANGLE_FROM_HORIZONTAL;           // -10 degrees

    // Clamp angle to allowed range (-170 to -10 degrees)
    if (aimAngle > 0) {
      // If aiming downward, snap to nearest allowed angle
      if (aimAngle <= Math.PI / 2) {
        aimAngle = RIGHT_LIMIT; // Snap to right limit (-10 degrees)
      } else {
        aimAngle = LEFT_LIMIT; // Snap to left limit (-170 degrees)
      }
    } else {
      // Aiming upward - clamp to allowed range
      if (aimAngle > RIGHT_LIMIT) {
        aimAngle = RIGHT_LIMIT; // Too far right, clamp to -10 degrees
      } else if (aimAngle < LEFT_LIMIT) {
        aimAngle = LEFT_LIMIT; // Too far left, clamp to -170 degrees
      }
    }
  }

  // Mouse input
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    mouseY = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    isAiming = true;
    updateAimFromPosition(mouseX, mouseY);
  });

  canvas.addEventListener('click', (e) => {
    if (!running || launchInProgress || balls.length > 0) return;

    // Launch all balls
    ballsToLaunch = ballCount;
    launchInProgress = true;
    launchTimer = 0;
    isAiming = false;
  });

  // Touch input (tap and hold to aim, release to launch)
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!running || launchInProgress || balls.length > 0) return;

    isTouching = true;
    isAiming = true;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    touchStartX = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    touchStartY = ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    mouseX = touchStartX;
    mouseY = touchStartY;
    updateAimFromPosition(mouseX, mouseY);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isTouching || !running || launchInProgress || balls.length > 0) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    mouseX = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    mouseY = ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    isAiming = true;
    updateAimFromPosition(mouseX, mouseY);
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!running || !isTouching) return;

    isTouching = false;

    // Launch balls if we were aiming
    if (isAiming && !launchInProgress && balls.length === 0) {
      ballsToLaunch = ballCount;
      launchInProgress = true;
      launchTimer = 0;
      isAiming = false;
    }
  }, { passive: false });

  canvas.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    isTouching = false;
    isAiming = false;
  }, { passive: false });

  // Button handlers
  function startGame() {
    running = true;
    gameOver = false;
    turn = 1;
    score = 0;
    ballCount = 1;
    platformX = CANVAS_WIDTH / 2;
    balls = [];
    bricks = [];
    tags.clear();
    keywords.clear();

    // Add first row of bricks
    addBrickRow();

    startBtn.disabled = true;
    restartBtn.disabled = false;

    gameLoop();
  }

  function endGame() {
    running = false;
    gameOver = true;

    const genres = buildGenresFromTags();

    setTimeout(() => {
      const result = {
        genres: genres,
        premise: `Ballz: Survived ${turn} turns with ${ballCount} balls`,
        styleTags: Array.from(tags).slice(0, 8),
        keywords: Array.from(keywords).slice(0, 8),
        mood: score > 100 ? 'triumphant' : 'energetic',
        seed: Date.now()
      };

      onFinish(result);
    }, 100);
  }

  function buildGenresFromTags() {
    const genreList = Object.keys(GENRE_LIBRARY);
    const selected = [];

    // Pick 2-3 random genres
    for (let i = 0; i < Math.min(3, genreList.length); i++) {
      const idx = Math.floor(Math.random() * genreList.length);
      if (!selected.includes(genreList[idx])) {
        selected.push(genreList[idx]);
      }
    }

    return selected;
  }

  startBtn.onclick = startGame;
  restartBtn.onclick = () => {
    if (running) {
      running = false;
    }
    setTimeout(startGame, 100);
  };

  quitBtn.onclick = () => {
    running = false;
    endGame();
  };

  // Initial draw
  draw();

  return wrap;
}

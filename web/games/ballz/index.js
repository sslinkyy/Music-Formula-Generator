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
  const BALL_SPEED = 6;
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

  wrap.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Instructions
  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.style.margin = '10px 0';
  hint.textContent = 'Move mouse to aim. Click to launch. Collect golden ball powerups!';
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
  let bricks = []; // {row, col, hits, isBall} - isBall means it's a ball collectible
  let launchInProgress = false;
  let ballsToLaunch = 0;
  let launchTimer = 0;
  let returnX = platformX; // Where balls will return to
  let collecting = false; // Are balls returning?
  let tags = new Set();
  let keywords = new Set();
  let isAiming = false; // Track if user is aiming

  // Mouse/touch position
  let mouseX = CANVAS_WIDTH / 2;
  let mouseY = CANVAS_HEIGHT / 2;

  // Add new row of bricks at the top
  function addBrickRow() {
    const numBricks = Math.min(2 + Math.floor(turn / 2), GRID_COLS - 1);
    const maxHits = Math.min(Math.ceil(turn * 1.5), 30);

    const positions = [];
    for (let col = 0; col < GRID_COLS; col++) {
      positions.push(col);
    }

    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    for (let i = 0; i < numBricks; i++) {
      const col = positions[i];
      // 25% chance to be a ball collectible
      if (Math.random() < 0.25) {
        bricks.push({
          row: 0,
          col: col,
          hits: 0,
          isBall: true
        });
      } else {
        bricks.push({
          row: 0,
          col: col,
          hits: Math.ceil(Math.random() * maxHits),
          isBall: false
        });
      }
    }
  }

  // Drop all bricks down one row
  function dropBricks() {
    bricks.forEach(brick => {
      brick.row++;
    });

    // Check game over - if any brick reaches the bottom
    const bottomBrick = bricks.find(b => !b.isBall && b.row >= GRID_ROWS);
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

        if (dist < BALL_SPEED) {
          return true; // Reached destination
        }

        this.x += (dx / dist) * BALL_SPEED;
        this.y += (dy / dist) * BALL_SPEED;
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
          } else {
            // Hit brick
            brick.hits--;
            score += 1;

            if (brick.hits <= 0) {
              bricks.splice(i, 1);
              score += 5;
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
    let vx = Math.cos(angle) * BALL_SPEED;
    let vy = Math.sin(angle) * BALL_SPEED;
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
      } else {
        // Draw numbered brick with color based on hits
        const maxHits = Math.ceil(turn * 1.5);
        const hitRatio = Math.max(0, Math.min(1, brick.hits / maxHits));
        const hue = hitRatio * 120; // 0 (red) to 120 (green)
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.fillRect(x + 2, y + 2, BRICK_SIZE - 4, BRICK_SIZE - 4);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, BRICK_SIZE - 4, BRICK_SIZE - 4);

        // Draw number
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
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
        const vx = Math.cos(aimAngle) * BALL_SPEED;
        const vy = Math.sin(aimAngle) * BALL_SPEED;
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

  // Mouse/touch input
  function updateAim(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    mouseY = ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    isAiming = true;

    // Only allow aiming when not launching
    if (launchInProgress || balls.length > 0) return;

    // Calculate angle from platform to mouse
    const dx = mouseX - platformX;
    const dy = mouseY - PLATFORM_Y;
    aimAngle = Math.atan2(dy, dx);

    // Clamp angle to upward hemisphere only (-180 to 0 degrees)
    if (aimAngle > 0) {
      // If aiming downward, clamp to nearest side
      if (aimAngle <= Math.PI / 2) {
        aimAngle = -Math.PI / 20; // Small angle down-right
      } else {
        aimAngle = -Math.PI + Math.PI / 20; // Small angle down-left
      }
    }
  }

  canvas.addEventListener('mousemove', (e) => {
    updateAim(e.clientX, e.clientY);
  });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      updateAim(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  canvas.addEventListener('click', (e) => {
    if (!running || launchInProgress || balls.length > 0) return;

    // Launch all balls
    ballsToLaunch = ballCount;
    launchInProgress = true;
    launchTimer = 0;
    isAiming = false;
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!running || launchInProgress || balls.length > 0) return;

    ballsToLaunch = ballCount;
    launchInProgress = true;
    launchTimer = 0;
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

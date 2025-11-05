# 3D Brick Breaker

A modern 3D brick breaker game built with Three.js featuring realistic graphics, physics, and engaging gameplay.

## Features

### Graphics
- **Realistic 3D Graphics**: Built with Three.js using PBR materials
- **Dynamic Lighting**: Multiple light sources including point lights, directional lights, and ambient lighting
- **Particle Effects**: Explosion effects, impact particles, and trail effects
- **Starfield Background**: Animated space background
- **Glowing Effects**: Neon-style emissive materials on game objects
- **Shadows**: Real-time shadow mapping for depth

### Gameplay
- **2.5D Perspective**: 3D graphics with 2D gameplay for intuitive controls
- **Realistic Physics**: Ball physics with proper collision detection and response
- **Multiple Brick Types**:
  - Weak (Cyan) - 1 hit, 10 points
  - Normal (Green) - 1 hit, 50 points
  - Strong (Red) - 2 hits, 100 points
  - Armored (Purple) - 3 hits, 200 points
  - Explosive (Orange) - 1 hit, 150 points, damages nearby bricks
  - Power-up (Yellow) - 1 hit, 75 points, drops power-up

### Power-Ups
- **Multi-Ball**: Splits ball into 3 balls
- **Expand Paddle**: Increases paddle width by 50%
- **Laser**: Fires projectiles that destroy bricks
- **Slow Ball**: Reduces ball speed for easier control
- **Extra Life**: Adds one life
- **Score Multiplier**: Instant 1000 point bonus

### Game Modes
- **7 Unique Level Patterns**:
  1. Classic Rows
  2. Pyramid
  3. Diamond
  4. Checkerboard
  5. Fortress
  6. Spiral
  7. Random Chaos

### Scoring System
- Combo multiplier for consecutive hits
- Bonus points for level completion
- Score increases with brick value
- Extra life at specific score milestones

## Controls

### Paddle Movement
- **Mouse Movement**: Move paddle with mouse cursor
- **Arrow Keys**: Left/Right arrows to move paddle
- **A / D Keys**: Alternative keyboard controls

### Actions
- **Click / Space**: Launch ball
- **P / Escape**: Pause game

## Installation

1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. No build process or dependencies needed!

## File Structure

```
3D-Brick-Breaker/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Styles and UI
├── js/
│   ├── main.js         # Game loop and initialization
│   ├── paddle.js       # Paddle class
│   ├── ball.js         # Ball physics and movement
│   ├── brick.js        # Brick types and destruction
│   ├── particles.js    # Particle effects system
│   ├── powerup.js      # Power-up system
│   ├── level.js        # Level generator
│   ├── physics.js      # Collision detection
│   └── audio.js        # Sound effects manager
└── assets/
    └── sounds/         # (Optional) Custom sound files
```

## Technical Details

### Built With
- **Three.js r128**: 3D graphics library
- **Web Audio API**: Procedural sound generation
- **Vanilla JavaScript**: No framework dependencies
- **CSS3**: Modern UI styling

### Graphics Features
- PBR (Physically Based Rendering) materials
- Real-time shadows (PCF Soft Shadow Map)
- Bloom/glow effects via emissive materials
- Edge detection and highlighting
- Particle systems for effects
- Dynamic camera positioning

### Physics
- AABB (Axis-Aligned Bounding Box) collision detection
- Sphere-box collision for ball-paddle
- Normal-based reflection for realistic bounces
- Velocity normalization to maintain consistent speed
- Paddle influence on ball direction

## Browser Compatibility

Works best in modern browsers with WebGL support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

### Graphics Quality Settings
- **Low**: 1x pixel ratio, no shadows
- **Medium**: 2x pixel ratio, soft shadows (recommended)
- **High**: Full pixel ratio, soft shadows

## Future Enhancements

Potential features for future versions:
- [ ] Online leaderboards
- [ ] Custom level editor
- [ ] More power-up types
- [ ] Boss levels
- [ ] Multiplayer mode
- [ ] Mobile touch controls
- [ ] Custom themes/skins
- [ ] Achievement system

## Credits

Created with Claude Code - An AI-powered development assistant

## License

Free to use and modify for personal and educational purposes.

---

**Enjoy the game!** 🎮✨

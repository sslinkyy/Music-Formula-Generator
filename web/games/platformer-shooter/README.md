# 3D Platformer Shooter

A retro-styled third-person 3D platformer shooter built with Three.js that integrates with the Music Formula Generator.

## Features

### Gameplay
- **Third-person perspective** with mouse-look camera controls
- **WASD movement** with platforming physics
- **Jumping** - Space bar to jump between platforms
- **Shooting** - Click to shoot projectiles at enemies
- **Enemy AI** - Multiple enemy types based on music genres (Synthwave, Cyberpunk, Industrial, etc.)
- **Powerups** - Collect powerups for temporary buffs:
  - Health Boost - Restore HP
  - Speed Boost - Move faster
  - Rapid Fire - Shoot faster
  - Shield - Temporary invincibility
  - Damage Boost - Deal more damage

### Retro Aesthetic
- **Neon grid floor** with magenta and cyan colors
- **Glowing enemies** with emissive materials
- **Particle effects** on hits and powerup collection
- **Synthwave/Cyberpunk color palette** (pink, cyan, purple, gold)
- **Fog effects** for depth
- **Dynamic lighting** with colored point lights

### Music Integration
The game collects musical metadata during gameplay:

- **Genres** - Based on enemy types killed (Synthwave, Cyberpunk, Industrial, Vaporwave, Trap)
- **Style Tags** - Collected from powerups ("healing vibes", "fast tempo", "rapid fire beats", etc.)
- **Keywords** - Generated from gameplay ("neon", "retro", "cyber", "synth", "digital", "future", "grid", "electric")
- **Premise** - Randomly generated theme pairs
- **Forbidden** - Penalties (like "enemy contact" if you take damage)

The game output conforms to the RGF Game Output schema and feeds directly into the Music Formula Generator.

## Controls

- **WASD** - Move player
- **Space** - Jump
- **Mouse** - Look around (after clicking to lock pointer)
- **Left Click** - Shoot projectiles
- **P** - Pause/Resume
- **Difficulty Selector** - Adjust challenge (Easy/Normal/Hard)

## Difficulty Levels

- **Easy**: 5 HP, slower enemies, 8 movement speed
- **Normal**: 3 HP, normal enemies, 10 movement speed
- **Hard**: 2 HP, faster enemies, 12 movement speed

## Architecture

### Files
- `index.js` - Main entry point, UI controls, game loop coordinator
- `game.js` - Three.js scene setup, physics, collision detection, enemy AI
- `README.md` - This file

### Game Loop
1. Player movement with WASD
2. Gravity and jumping physics
3. Platform collision detection
4. Enemy spawning and AI (move toward player)
5. Projectile physics and collision
6. Powerup spawning and collection
7. Particle effects
8. Camera following player in third-person
9. HUD updates (time, HP, kills, combo, accuracy, score)

### Scoring System
- **100 points** per enemy kill (multiplied by combo multiplier)
- **50 points** per powerup collected
- **Combo system** - Chain kills without taking damage
- **Accuracy tracking** - Shots fired vs shots hit
- **Final score** = (kills × 100) + (best combo × 20) - (forbidden × 50)

## Integration with Music Formula Generator

After the game ends, it outputs a JSON object conforming to the schema:

```json
{
  "genres": [
    { "name": "Synthwave", "influence": 60 },
    { "name": "Cyberpunk", "influence": 40 }
  ],
  "premise": "freedom & defiance",
  "styleTags": ["healing vibes", "fast tempo", "rapid fire beats"],
  "keywords": ["neon", "cyber", "digital", "grid"],
  "language": "English",
  "accent": "Neutral / Standard",
  "forbidden": ["enemy contact"],
  "meta": {
    "mode": "platformer-shooter",
    "difficulty": "normal",
    "duration": 120,
    "score": 8500,
    "accuracy": 85,
    "bestCombo": 25
  }
}
```

This data is used to generate unique music based on your gameplay performance!

## Future Enhancements

- Multiple levels with different layouts
- Boss enemies
- More weapon types
- Multiplayer support
- Leaderboards
- Level editor
- Music synchronization (beat-matched shooting)

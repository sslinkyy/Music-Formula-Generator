Assets Directory
================

Place optional 3D models, textures, and HDRIs here to enhance visuals.

Recommended structure
- models/
- textures/
- hdris/

Snake 3D pickups (optional)
- Drop small GLB models in `models/` and name them as follows:
  - `food_apple.glb`   (used for tag pickups)
  - `food_grape.glb`   (used for keyword pickups)
  - `food_banana.glb`  (used for genre pickups)
  - `spike.glb`        (used for hazard)

Suggested CC0 sources (no attribution required, but appreciated)
- Kenney Assets: https://kenney.nl/assets
- Quaternius: https://quaternius.com
- Poly Haven (HDRIs/Textures/Some Models): https://polyhaven.com
- ambientCG (Textures): https://ambientcg.com

If you choose non‑CC0 assets (e.g., CC‑BY), please ensure you add a credit entry. The app includes a Credits dialog (Settings → Credits) powered by a small registry. When you load assets in code, call:

  import { addCredit } from '../js/utils/assets.js';
  addCredit({ name: 'Pack Name', url: 'https://...', license: 'CC‑BY 4.0', author: 'Author', notes: 'Used in Snake 3D' });

The Snake 3D module auto‑adds credits for these local files with generic CC0 metadata when loading succeeds. You can adjust names/notes as needed.


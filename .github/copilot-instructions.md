# Copilot Instructions

## Commands

This repository does not currently have a package manager, build script, test runner, or lint configuration.

- Syntax check the game script: `node --check script.js`
- Run the app: open `index.html` directly in a browser
- Manual verification: play through the stage in the browser and confirm movement, jumping, hazards, collectibles, HUD updates, win state, and restart behavior still work

## High-level architecture

The app is a single-page, dependency-free browser game split across three files:

- `index.html` provides the fixed DOM contract that the game relies on: the `#game` canvas, HUD fields (`#lives`, `#score`, `#message`), and the `#restartButton`
- `styles.css` only handles layout and presentation around the canvas; the canvas keeps a fixed internal resolution of `960x540` while CSS scales it responsively
- `script.js` contains the full game implementation: state objects, level data, input handling, physics, collision detection, HUD syncing, and rendering

The game loop lives in `frame()`, which runs `updatePlayer()`, `updateHud()`, `drawBackground()`, `drawWorld()`, and `drawOverlay()` on every animation frame. Side-scrolling is implemented with a camera offset (`game.cameraX`): gameplay updates happen in world coordinates, then `drawWorld()` translates the canvas by `-game.cameraX` before drawing the level.

Level structure is data-driven inside `script.js`. Platforms are defined in `solids`, hazards in `hazards`, collectibles in `collectibles`, and the finish point in `goal`. If you add or rebalance content, update those arrays first before changing movement or rendering logic.

## Key conventions

- Keep the project as plain HTML/CSS/JS unless the repository gains tooling; `index.html` loads `script.js` with `defer`, and the current code assumes browser globals rather than modules
- Preserve the DOM IDs used by `script.js`; renaming HUD or control elements in HTML requires matching JS updates
- Keep gameplay text in Japanese to match the existing UI and status messages
- Update player-facing status through `game.message` and `updateHud()` instead of writing directly to the DOM in multiple places
- Preserve the current separation of concerns in `script.js`: top-level data for the stage, small helpers like `clamp()` / `intersects()`, update logic for state changes, and draw functions for rendering
- Collision handling is split by axis with `resolveHorizontalCollisions()` and `resolveVerticalCollisions()`; extend those paths instead of replacing them with ad hoc collision checks

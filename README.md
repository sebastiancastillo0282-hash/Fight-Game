# Quetzal vs Jaguar

A minimal 1v1 prototype that fuses MediaPipe Pose input with a keyboard fighter. Built with Vite + TypeScript + Three.js r158.

## Getting Started

```bash
npm install
npm run dev
```

The dev server opens automatically at [http://localhost:5173](http://localhost:5173). Allow webcam access when prompted so MediaPipe Pose can drive Player 1.

> **Note:** MediaPipe's Pose and camera utilities load from jsDelivr at runtime because the npm packages are access-restricted in this environment. Keep the machine online for the initial pose initialisation; the game automatically falls back to keyboard controls if the CDN request fails.

For a production build:

```bash
npm run build
npm run preview
```

## Controls

### Player 1 — Pose Gestures

All angles use Mediapipe's right-handed coordinate space (origin at the camera, Y up). Thresholds include hysteresis to reduce jitter.

```
Punch:  right wrist above right shoulder      Kick: knee snaps straight
         __                                      _______
        /  \   > 12 cm rise & upward speed      /  |   \
shoulder|  |                                     hip knee ankle
        \__/                                     angle > 165°
```

```
Block: left wrist crosses torso              Walk: torso lean
Left wrist X at least 10 cm left of shoulder  Lean > ±6° around pelvis
```

### Player 1 — Keyboard Fallback

If the pose pipeline stops tracking, Player 1 automatically swaps to keyboard input:

| Action | Keys |
| ------ | ---- |
| Walk left / right | `ArrowLeft` / `ArrowRight` |
| Punch / Kick | `Numpad1` / `Numpad2` |
| Block (hold) | `Numpad3` |
| Pause | `P` |

### Player 2 — Keyboard

| Action | Keys |
| ------ | ---- |
| Walk left / right | `A` / `D` |
| Punch / Kick | `J` / `K` |
| Block (hold) | `L` |
| Pause | `P` |

## Gameplay Loop

* Fixed-step simulation at 60 Hz (deterministic updates, render on `requestAnimationFrame`).
* Round timer: 99 seconds, best of 3. When the timer expires the higher health fighter wins the round.
* Punch and kick attacks spawn capsule hitboxes in front of the active limb. Each hit applies damage, knockback, and hit-stun (reduced when blocking).
* Blocking reduces incoming damage by 70% and softens knockback by ~65%.
* Camera rig eases zoom and focus between fighters.
* HUD shows health bars, round pips, timer, pose status, FPS, and a mirrored video preview.

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| Webcam feed does not start | Ensure the page has camera permissions. If denied, reload the page and accept. The HUD indicator shows `POSE: OFF` until permission is granted. |
| Frequent false positives | Stand about 1.5 m from the camera, keep the full body visible, and slow down between gestures. EMA smoothing and hysteresis are tuned for ~30 FPS Pose throughput. |
| Low frame rate | Close other GPU-intensive tabs. Three.js renderer automatically caps pixel ratio to 1.8 to protect laptops. |
| Pose stalls mid-round | The HUD flips to `POSE: BLOCKED` and Player 1 falls back to the keyboard bindings above after ~2 seconds without detections. |

## Design Notes

* MediaPipe Pose is throttled to ~30 FPS and smoothed with exponential moving averages to avoid GC churn.
* Capsule vs capsule sweep tests prevent multi-hits during a single active window.
* Characters share a deterministic state machine for attacks, stun, and KO to maintain clean transitions.
* Meshes are generated procedurally (no external assets) for a low-poly aesthetic with jade/obsidian palettes.

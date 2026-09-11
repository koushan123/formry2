# Anger Release

**Release what you cannot say.** A first-person arcade boxing game about leaving a bad day in the ring, restyled as a personal, dark-romantic anger-release experience. You play as KUSEAN (portrait-backed avatar) and fight Static — a dark robot silhouette with rose-glowing eyes that symbolizes frustration. Block its warning, hit its opening, build combos, and enter a faster, heavier release mode. One scenario with immediate retry.

## Visual identity (Stage 2.5)

The game uses a consistent rose/mauve color system across menus, HUD, meters, lighting, effects and the arena:

| Role | Color |
| --- | --- |
| Rose Pink (primary) | `#D46A8C` |
| Muted Mauve | `#B7849C` |
| Dark Mauve | `#4A2638` |
| Deep Background | `#1A1018` |
| Highlight Pink | `#FF8FB1` |
| Soft Pink | `#E8A8BC` |

- Neon-lit arena: pink spotlight/fill lights, mauve fog, neon ceiling strips, glowing "RELEASE YOUR ANGER" wall text, dark reflective floor accents and pink impact particles.
- Static is a dark metal robot with pink glowing eyes (red-pink when attacking, white when staggered).
- Release mode surrounds the player in pulsing pink light and a rose screen glow.
- Title screen: large glowing typography ("ANGER RELEASE — Release what you cannot say."), player profile portrait, rose buttons on a dark background.
- HUD shows the player portrait, name KUSEAN, health, release meter and combo; victory reads "ANGER RELEASED."
- Three selectable themes in Settings: **Rose Pink** (default), **Muted Mauve**, **Dark Mode** — stored in settings and extensible via CSS variables in `src/style.css`.
- Player customization: your portrait (`public/player-portrait.jpg`) appears on the main menu and in the HUD. Replace that file to change the avatar — no code changes needed.

## Run locally

Use Node.js 22.12+ (tested on Node 24).

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. Click **STEP INTO THE RING**, then start or skip the short controls overlay. The mouse is captured only after you enter the round. The tutorial appears once and can be reopened from the pause menu.

```sh
npm test
node scripts/balance.js
npm run test:browser
npm run build
npm run preview
```

Browser tests use installed Google Chrome and Microsoft Edge via Playwright. Install those browsers if unavailable; each runs in a separate automated profile. Tests reserve ports 5186 and 4187 and fail if those ports are occupied. `npm run test:browser` builds production first. Full browser testing takes several minutes because it plays full-length fights.

`dist/` is the deployable static site. Serve over HTTPS or localhost for mouse capture. No backend, account, API keys, CDN, or external asset requests are required. If preview port 4173 is occupied, use `npm run preview -- --port 4187`.

## Controls

| Input | Action |
| --- | --- |
| WASD / left joystick | Move |
| Mouse / right look pad | Look |
| Left click / FIRE tap | Punch with alternating gloves; one follow-up click can be buffered |
| Hold right click / FIRE hold | Block frontal attacks and slow movement |
| Shift + movement / FIRE swipe | Dodge in that direction |
| Shift alone / FIRE swipe down | Dodge backward |
| Esc / pause pad | Pause and release mouse |

**Mobile:** on touch devices the game shows on-screen pads (joystick, look pad, FIRE button, pause) and skips pointer lock — no keyboard or mouse needed. Share your LAN address (`npm run dev -- --host`, then `http://<your-ip>:5173`) or deploy `dist/` to any static host to play on a phone. Desktop mouse/keyboard remains unchanged and is still the fully tuned experience.

Get within reach and aim at Static. **Orange warning:** block or dodge. **Green opening:** punch for bonus damage. Static commits to its attack direction, so moving aside matters. Fifth consecutive hits deal extra damage and can stagger the opponent. Missing or waiting 2.6 seconds resets the combo; the thin line beneath the counter shows remaining combo time.

Twenty landed hits fill release mode: six seconds of faster punches, stronger damage, heavier impacts, a bass layer, and a restrained screen tint. The meter drains while active. Reduced motion removes camera recoil, shake, dodge lean/dip, combo scaling, and rage FOV changes while retaining gameplay cues.

## Stage 2 features and balance

- Animated glove contact, 35–65 ms impact freeze, head/body recoil, sparks and camera feedback.
- Responsive single-input punch buffer, current-aim hit detection, and clear miss/block hints.
- Simple AI with distance maintenance, sidesteps, locked attack direction, telegraphed windup and recovery openings.
- Easy, Normal and Hard difficulty; a difficulty change during a round takes effect on restart.
- Layered randomized synthesized audio, six reusable noise buffers, bounded polyphony and node cleanup.
- Full HUD, combo timer, attack warning, release countdown, low-health cue, score and results.
- Main menu, scenario selection, tutorial, pause/settings, victory, defeat and immediate retry.
- Local fonts, reusable mesh geometry and a fixed 48-particle pool.

Normal targets 1–2 minutes for experienced play and 2–4 minutes for newer play. Reproducible simulated playstyles currently finish in about 63 seconds and 201–230 seconds respectively. These are modelled outcomes, not human playtest findings. Hard is substantially less forgiving of late blocks. See [PLAYTEST_REPORT.md](PLAYTEST_REPORT.md) for values, assumptions, before/after analysis and difficulty comparison.

## Technology and structure

Three.js renders the scene; Vite bundles JavaScript and CSS. Web Audio generates all sound. All models and ring graphics are procedural.

| File | Responsibility |
| --- | --- |
| `src/config.js` | Combat constants, difficulty presets, scenario descriptors and selection |
| `src/game.js` | Health, contact timing, hit-stop, movement, enemy AI and round state |
| `src/input.js` | Keyboard/mouse, capture, blocking and focus handling |
| `src/scene.js` | Room, robot, gloves, animation, camera, shared geometry and particles |
| `src/audio.js` | Reusable noise, impact layers, rage sound and voice lifecycle |
| `src/ui.js` | Cached HUD updates, meters, warnings and event feedback |
| `src/settings.js` | Validated settings and persistence |
| `src/main.js` | Menus, tutorial, round lifecycle and render loop |
| `tests/game.test.js` | Original gameplay checks plus Stage 2 timing/balance regressions |
| `tests/browser/` | Chrome/Edge gameplay, production and resource checks |
| `scripts/balance.js` | Deterministic playstyle simulation |

## Extending and tuning

Change `CONFIG` for player damage, timing, range, combo, rage, recoil and dodge values. `DIFFICULTIES` holds enemy presets; the opponent health baseline lives in its scenario descriptor. The round snapshots its difficulty at reset so menu changes cannot alter an ongoing fight. Run unit tests and the balance script after tuning.

Add a scenario descriptor to `SCENARIOS` with its ID, name, description, environment key, opponent, objective, difficulty and completion predicate. Add its selection card and an environment builder. The current renderer implements boxing only; object destruction or different objectives need their own interaction controller.

Replace `buildRobot()`/`buildHands()` in `src/scene.js` with production models while preserving the animation interface. The separate head pivot supports hit reactions. `AudioManager.play()` is the insertion point for recorded impacts; `buildRoom()` contains environment geometry. Combat rules do not depend on asset geometry.

## Known limitations

- Touch support is functional but basic: fixed pad positions, no landscape-lock prompt, no controller or haptics. Desktop remains the reference experience; mobile tuning (look speed, pad sizes) may need on-device adjustment.
- Chrome and Edge are the tested browser targets. Firefox and Safari are unverified, not certified as supported; mobile browsers are untested on real hardware.
- One room, one opponent. Next scenario remains explicitly locked.
- Simplified collision and cone/range hit detection; no physics engine, ragdoll or anatomically exact hitboxes.
- Procedural models and sounds; no music, voice acting or imported animations.
- Duration has synthetic/browser evidence; subjective satisfaction and audible mix still need human playtesting.
- Performance figures are local samples, not guarantees for other hardware.
- Quit cannot close a tab opened by the user. Only settings persist; round scores do not.

## Roadmap

1. Human playtest: judge impact, repetition, sound mix and difficulty, then tune using the existing constants.
2. Validate additional desktop hardware, Firefox/Safari and accessibility options.
3. Improve production sound/animation where playtests show a clear benefit.
4. Add a second scenario only after the boxing experience is validated.

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for Stage 2 test results and measured performance.

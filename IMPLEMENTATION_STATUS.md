# Stage 2.5 status — visual identity, player identity and mobile touch support

## Completed

- Touch support: on touch devices the game now shows four on-screen pads — left joystick (movement, same axes contract as WASD), right look pad (rate-based yaw/pitch), FIRE pad (tap = punch, hold = block, swipe = dodge in that direction) and a pause pad. Pointer lock is skipped on touch; desktop keyboard/mouse flow is unchanged.
- `src/touch.js` added as an isolated module mirroring the existing InputManager actions; no combat, movement or round code was modified (verified by the unchanged 20/20 unit tests).

- Rose pink / muted mauve visual identity applied consistently: menu, HUD, health/release/combo meters, buttons, pause, victory, defeat, toasts, dialogs, damage flash and release overlay.
- Neon arena restyle: pink key/fill/rim lights, mauve fog and background, neon ceiling strips, glowing "RELEASE YOUR ANGER" wall title, dark mauve robot and rose-lit ring accents.
- Static redesigned as an intimidating dark metal silhouette with pink glowing eyes (red-pink on attack, white on stagger, emissive pulse on hit).
- Release mode now presents as pink energy: pulsing rim light, rose screen glow and highlighted release HUD.
- Title screen rebuilt: "ANGER RELEASE / Release what you cannot say.", glowing typography, rose buttons, dark background.
- Player identity: portrait avatar (from provided photos, `public/player-portrait.jpg`) on the main menu and in the HUD, with the player name KUSEAN; victory screen is personalized ("ANGER RELEASED.", combo/hits stats).
- Theme selector in Settings: Rose Pink (default), Muted Mauve, Dark Mode; persisted and validated like other settings; CSS-variable based for future customization.

## Visual changes

- All colors flow from six CSS variables (`--rose`, `--mauve`, `--mauve-dark`, `--bg`, `--hi`, `--soft`) in `src/style.css`; scene colors in `src/scene.js` use the same palette.
- Impact particles are now pink; combat cue states (threat/opening) use rose backgrounds.
- No gameplay, combat, AI, or timing values were changed.

## Player customization

- Replace `public/player-portrait.jpg` to change the avatar everywhere (menu + HUD); an alternate photo is kept at `public/player-portrait-alt.jpg`.
- Player name is a single constant in `index.html`/`src/main.js`, ready to become a setting later.

## Testing

- 20/20 unit tests pass (gameplay unchanged).
- Production build passes (~123 KB combined gzip JS + CSS with local fonts).
- Menu verified visually in-browser: glowing title, portrait, mauve arena, no console errors.
- Full browser gameplay suites were not rerun for this visual-only change; combat logic was not modified.

## Known limitations

- Touch pads are functional but untested on real phone hardware (verified via module-level simulation and pad rendering only); look-speed and pad sizes may need on-device tuning. The in-world player remains first-person hands only; the portrait is used in menu/HUD rather than a 3D face model.
- Mauve/Dark themes currently shift accent variables only; the 3D arena lighting stays rose-based.
- Firefox/Safari still unverified; desktop keyboard/mouse only.

## Next stage

- Human playtest of the new atmosphere, then optional full 3D player avatar and per-theme 3D lighting presets before adding a second scenario.

---

# Stage 2 status — playtest, balance and polish

## Completed

The existing Three.js/Vite boxing scenario is polished without adding another scenario or changing the stack. Stage 1's ten gameplay checks and two browser flows were retained and adapted to contact timing, the new balance and tutorial; new regressions and performance checks were added.

- Scheduled glove contact, single follow-up input buffer, 35 ms normal / 65 ms strong hit-stop, camera recoil, separate robot head/body reactions, stagger animation and sparks.
- Current-aim hit checks, range/miss feedback, and visible buffered/blocked input feedback.
- Timed recovery/stagger vulnerability, with an interruption lockout that prevents permanent stun-lock.
- Enemy distance maintenance and sidesteps, directional attack commitment, orange warning, readable attack motion, and green counterattack openings.
- Faster release punches, stronger impacts, a separate bass layer, screen-edge tint, mild FOV change and a clear countdown. Reduced-motion alternatives retain useful cues.
- Combo timeout indicator, milestone messages, low-health feedback and prioritized announcements that avoid overwriting rage/victory with ordinary hit text.
- Easy/Normal/Hard presets, persisted settings, first-use skippable tutorial, pause-menu controls, and next-round difficulty application.
- Shared geometry, six cached noise buffers, fixed 48-particle pool, bounded 32-voice audio, explicit ended-node cleanup and cached HUD text updates.
- README, reproducible balance simulation, playtest analysis, local favicon and production build.

## Gameplay changes

Normal now has 2300 opponent health, 10 base damage, a 0.38-second punch cooldown and 0.075-second contact delay. Enemy attacks have a 0.85-second windup, 1.35-second recovery and 1.1-second spacing interval, with 5 base damage. A 2.6-second combo window is more forgiving; release fills after 20 landed hits and lasts six seconds, with a 0.25-second punch cooldown and 1.65× damage.

See [PLAYTEST_REPORT.md](PLAYTEST_REPORT.md) for the full before/after table, difficulty values and the tradeoff behind longer rounds.

## Tests

- **20/20 gameplay tests pass.** Original health, hit/miss, cooldown, combo, release, AI, block/dodge, walls/body collision, victory, defeat, reset, pause and scenario coverage is preserved. Additional checks cover delayed contact, one-input buffering, hit-stop, vulnerability, stagger immunity, faster rage, directional enemy attacks, difficulty, malformed settings and duration guardrails.
- **4/4 functional browser checks pass:** full gameplay and production checks in both installed Chrome and Edge. Actual mouse/keyboard actions exercise movement, mouse lock/look, attack, block, dodge, combos, release, victory, retry and menu return. Idle-player defeat is exercised by accelerating the unchanged simulation. No console errors or failed production requests remain.
- **2/2 performance/resource checks pass** in the targeted rerun after warming particle geometry before the baseline measurement. This completes all six browser check outcomes; the full-round tests did not need rerunning for this test-only correction.
- **Production build passes.** Approximately 132 KB combined gzip JavaScript, plus local CSS/fonts. The opt-in development test bridge is absent from production.
- **120 seeded balance simulations** cover two declared playstyles across three difficulties. Normal's experienced playstyle wins in 62.9–63.1 seconds; the newer playstyle wins in 200.7–229.7 seconds. All 40 Normal runs win and fall within their target durations. These are synthetic playstyles, not human participants.
- Screenshots of menu, fight, release mode, victory and defeat were captured. Menu, release and final victory presentation were visually inspected.

### Full browser round evidence

| Browser | Version | Normal victory | Hits | Releases |
| --- | --- | --- | ---: | ---: |
| Google Chrome | 152.0.7977.83 | 1:22 | 152 | 4 |
| Microsoft Edge | 152.0.4191.66 | 1:25 | 156 | 4 |

The browser fighter uses programmatic aiming but actual keyboard/mouse movement, blocks and punches; it does not reduce health or change combat tuning. Its cadence includes browser automation overhead, so these round times differ from the simulation's experienced playstyle.

### Local performance sample

Eight seconds at 1440 × 900, repeatedly spawning strong impacts and audio while rendering the arena and release effects, followed by ten real UI restarts:

| Metric | Chrome | Edge |
| --- | ---: | ---: |
| Average FPS | 80.5 | 81.1 |
| 95th-percentile frame time | 14.2 ms | 14.1 ms |
| Largest sampled frame | 41.6 ms | 41.7 ms |
| Retained geometries before → after | 13 → 13 | 13 → 13 |
| Retained textures before → after | 6 → 6 | 6 → 6 |
| Audio voices after cleanup | 0 | 0 |
| Post-GC JS heap before → after | 4.86 → 5.19 MiB | 4.80 → 5.24 MiB |
| Heap change | +338 KiB | +450 KiB |

Both retained the same six noise buffers and 48-particle pool. Heap changes remained small and below the test's 8 MiB growth guardrail. This short local sample found no growing graphics-resource counts or uncollected audio voices; it is not a proof of zero leaks or a guarantee on other hardware. Renderer snapshots had about 145–148 draw calls and 5700 triangles. Raw measurements are in `reports/stage2-chrome-performance.json` and `reports/stage2-edge-performance.json`.

## Issues resolved during Stage 2

- Fixed an enemy spacing dead zone that could prevent attacks just outside range.
- Corrected contact timing and added buffering for clicks during recovery.
- Prevented queued punches from surviving pause or a newly raised guard.
- Added the favicon to eliminate browser resource errors.
- Isolated test servers from an older development server that had stopped.
- Corrected the resource-test baseline: the first visible particle uploads one shared geometry once; subsequent retries retain it without growth.

## Known issues and limitations

No known blocker remains in the tested Chrome/Edge desktop flows. Firefox and Safari are unverified and are not certified supported targets. Touch/controller input is not implemented.

Human playtesting remains necessary: roughly 150–180 hits per Normal win may still feel repetitive to some players despite the improved timing and feedback. Audio activation and lifecycle are verified, but the mix has not been evaluated by listening. Hard defeats most of the late-reacting synthetic beginner runs; Easy can slightly exceed four minutes because it offers fewer attack/recovery cycles. Additional GPU/hardware and longer-session profiling remain outstanding.

Only one room and opponent exist. Models/audio are procedural, collision is simplified, and there is no ragdoll, music or persistent high score. The browser cannot close a user-opened tab through Quit.

## Next recommended stage

A small human playtest focused on impact satisfaction, perceived repetition, block readability, sound mix and difficulty. Tune the existing constants from those findings, then validate additional hardware/browsers. Keep new scenarios deferred until the boxing experience is validated.

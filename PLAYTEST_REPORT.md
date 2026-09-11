# Stage 2 playtest and balance report

## Current game feel analysis (before changes)

**Strengths:** Direct controls, a complete win/lose/retry loop, an isolated simulation, procedural assets, pooled particles, and working pointer lock. All ten original gameplay tests passed before modification.

**Problems:** The recorded MVP browser win lasted about eight seconds. Damage occurred at mouse-down before the glove reached contact. Cooldown clicks disappeared. Rage altered damage but barely changed cadence or presentation. The opponent stayed in place at attack range and its windup/recovery were hard to distinguish. No first-use introduction or difficulty choices existed. Repeated sound events allocated fresh noise buffers, and most meshes allocated their own geometry.

**Recommended changes:** Delayed contact matched to glove motion, one buffered follow-up, short hit-stop, separate head/body recoil, legible attack and vulnerability cues, faster/layered rage, a forgiving combo window, simple difficulty presets, and longer rounds verified with explicit simulated playstyles. Keep one opponent and one room.

## Balance values

| Value | MVP | Stage 2 Normal |
| --- | ---: | ---: |
| Opponent health | 240 | 2300 |
| Base punch damage | 10 | 10 |
| Punch cooldown | 0.28 s | 0.38 s |
| Punch contact delay | immediate | 0.075 s |
| Punch range | 2.5 | 2.65 |
| Player movement | 3.6 | 3.8 |
| Opponent windup | 0.6 s | 0.85 s |
| Opponent recovery | 0.85 s | 1.35 s |
| Opponent spacing interval | none | 1.1 s |
| Opponent damage | 12 | 5 |
| Dodge cooldown / duration | 1.1 / 0.24 s | 1.0 / 0.3 s |
| Combo timeout | 1.7 s | 2.6 s |
| Release gain | 10 per hit | 5 per hit |
| Release duration | 5 s | 6 s |
| Release damage | ×2 | ×1.65 |
| Release punch cooldown | 0.28 s | 0.25 s |

Fifth hits deal ×1.5 damage. Recovery/stagger openings grant ×1.25 damage, rounded to whole hit points. Fifth hits can stagger for 0.75 seconds, with a 2.2-second interruption lockout. Rage hits do not each reset stagger. These mechanics reward timing while leaving the opponent able to retaliate. Normal hit-stop is 35 ms, strong hit-stop 65 ms, and knockout hold 120 ms. Contact is checked against current aim and distance; a swing cannot hit twice.

The health increase intentionally replaces the eight-second win with sustained exchanges. The risk is repetitive punching despite the richer reactions: a real player trial is still needed to judge whether roughly 150–180 landed hits feels satisfying. Duration alone is not proof of enjoyable balance.

## Difficulty

| Preset | Enemy health | Damage | Windup | Recovery | Spacing interval | Speed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Easy | 2300 | 3 | 1.1 s | 1.6 s | 1.35 s | 1.6 |
| Normal | 2300 | 5 | 0.85 s | 1.35 s | 1.1 s | 1.6 |
| Hard | 2760 | 5 | 0.65 s | 1.05 s | 0.65 s | 2.0 |

Difficulty is fixed for a round. Changes made while paused apply on restart. Player rules are identical across presets.

## Reproducible simulated playstyles

Run `node scripts/balance.js`. Each combination uses 20 seeded runs without modifying health, damage, or AI during play. Simulations run the same `Game.update()` as the browser at 120 steps per second.

- **Experienced:** Aims accurately, punches every 0.38–0.44 seconds (0.26–0.275 in rage), blocks after a 0.15-second reaction, and maintains distance.
- **New:** Punches every 0.8–1.15 seconds, intentionally mis-aims 18% of attempts, attempts to defend 88% of enemy windups after a 0.35–0.7-second reaction, and maintains distance. This models a cautious player who understands block, not an entirely untrained person.

| Difficulty / synthetic playstyle | Wins | Successful round duration |
| --- | --- | --- |
| Easy / Experienced | 20/20 | 66.4–67.3 s |
| Easy / New | 20/20 | 203.4–243.1 s |
| Normal / Experienced | 20/20 | 62.9–63.1 s |
| Normal / New | 20/20 | 200.7–229.7 s |
| Hard / Experienced | 20/20 | 72.0–72.4 s |
| Hard / New | 3/20 | 253.0–264.7 s (wins only) |

Normal satisfies the requested ranges for these declared playstyles. Hard is deliberately punishing to late reactions; it is not covered by the beginner duration guarantee. Easy may take slightly longer because slower attacks also mean fewer recovery openings. These are reproducible synthetic checks, not measured human completion times.

## Browser and performance methodology

Installed Google Chrome and Microsoft Edge are tested through Playwright with isolated browser profiles. Full fight tests use actual mouse/keyboard input, with programmatic aim assistance. They retain the full health pool and real-time simulation, activate rage, win, retry, then accelerate the unmodified simulation for intentional idle-player defeat. Production tests separately cover tutorial, difficulty persistence and next-round application, mouse capture, settings, UI at 1280 × 720, and runtime/resource errors.

The performance test uses a 1440 × 900 viewport, an eight-second effects/audio stress sample, and ten restarts. It compares renderer geometry/texture counts, the fixed particle/noise pools, ended audio voices, and post-GC JavaScript heap. This is a local sample, not a guarantee across hardware. Final measured results are recorded in `IMPLEMENTATION_STATUS.md`.

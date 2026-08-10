# Adversarial player-experience audit

## Scope

Independent read-only review of the deployed singedTerra game as a skeptical first-time and returning player. This was explicitly a fun, usability, retention, and visual-coherence assessment. It was not a security, cheating, exploit, authentication, or source-quality review.

## Grade: C+

**Thesis:** The game has real tactical texture and visual identity, but it makes players prepare before they play, then gives them too little help turning a miss into a better next shot.

## Evidence-led findings

### P0: Solo fun is too indirect

The entry presents Hot Seat and online framing before an obvious “fight a CPU now” path. The fastest route to the core artillery loop is obscured by crew, vehicle, and configuration work. A first-time player can leave before the game demonstrates its strongest moment.

**Smallest useful outcome:** a prominent Quick Duel vs CPU entry that starts a sensible match with no extra setup. **Scope:** M.

### P0: Misses do not teach enough

After firing, the player needs a clear impact readout: distance/direction from target, trajectory or impact marker, or concise correction language. Without that feedback, artillery can feel arbitrary rather than learnable.

**Smallest useful outcome:** a post-impact marker plus one concise correction cue after early shots. **Scope:** M.

### P1: Pre-game asks for trust before it earns it

Vehicle Bay, configuration, economy, Advanced Settings, account/progression, and online routes compete before the first shot. The result reads as a capable prototype console rather than a confident game front door.

**Current response:** the active `pregame-operations-overlay` slice turns account and Advanced Settings into contained overlays so the core route remains stable. It does not remove tactical depth.

### P1: Battle UI is over-instrumented

The game exposes substantial information without a hierarchy tuned to the immediate decision: aim, select weapon, fire, learn. The density is especially fragile on mobile.

**Smallest useful outcome:** collapse secondary in-game HUD material and foreground active-player decisions. **Scope:** M.

### P1: Mobile has two gates before play

Splash and orientation handling feel like separate conditions to negotiate. The player should encounter one decisive landscape-ready handoff.

**Smallest useful outcome:** replace the double gate with one landscape handoff. **Scope:** S–M.

### P2: Progression lacks immediate aspiration

XP and Player Record exist, but a first-time player does not quickly learn what a level earns, what milestone is close, or why another match matters.

**Smallest useful outcome:** post-match XP that names the next visible milestone. **Scope:** L.

## Journey diagnosis

**First session:** strong atmosphere, then too much ceremony. The first shot is satisfying, but an unexplained miss does not create mastery. A player can leave thinking the game is handsome but opaque.

**Returning session:** terrain destruction, weapon variety, and turn tension support replay, but setup friction and weak long-term pull leave no crisp “one more duel” promise.

## Preserve

- Post-apocalyptic artillery mood and terrain deformation.
- Tactile aiming and firing.
- Keyboard, mouse, and touch support.
- Reactive coaching tone.
- Tactical weapon and vehicle variety; surface it progressively rather than removing it.

## SMARTS ordering after the active overlay slice

1. Quick Duel vs CPU.
2. Post-impact learning feedback.
3. In-match HUD decision hierarchy.
4. Mobile single handoff.
5. Visible progression milestone.

The explicit account/Advanced Settings layering repair remains the active slice because it addresses a current production-visible player report and is already test-driven in progress.

# Keyboard Focus Recovery

## User value

After a player clicks a non-text HUD control, Space must remain a reliable game
fire shortcut. A focused control must not permanently capture the primary game
key or force the player back to the Fire button.

## Scope

- Treat Space and the legacy Spacebar alias as game fire keys when focus is on
  a non-text UI control, including buttons and selects.
- Preserve native editing behavior for input, textarea, and contenteditable
  controls.
- Preserve the dedicated Fire button's native semantic activation so one key
  press cannot create a duplicate fire.
- Recognize the browser's `code === "Space"` form in addition to `key` aliases.
- Leave Enter, movement, aim, weapon selection, and action protocol behavior
  unchanged.

Out of scope: auth, secrets, cryptography, database, migrations, dependencies,
server behavior, and focus-management redesign.

## Acceptance criteria

1. Space fires after a non-fire button or select has focus.
2. Space and Spacebar aliases remain covered; `code: Space` is supported.
3. Text-entry controls retain native Space behavior.
4. The dedicated Fire control still produces exactly one semantic activation.
5. Focused InputHandler tests fail before the implementation and pass after it.

## SMARTS decision

Selected over the already-delivered rematch recovery candidate because this is a
direct player-facing regression reported during live play. It scores highest on
Signal and User value, is Available in one input seam, Maintainable without a
new abstraction, Reliable because existing text-entry and duplicate-fire
boundaries remain explicit, Testable with focused DOM events, and Small with no
network or deployment contract change. Confidence: high.

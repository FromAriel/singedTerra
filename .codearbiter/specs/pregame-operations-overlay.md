# Pre-game operations overlays

## Decision

SMARTS selects the explicitly reported pre-game layering defect as the next slice. The account record and Advanced Settings are currently ordinary layout children: opening either can push the Vehicle Bay and setup route, or reveal competing preview art beneath it. The result reads as stacked browser content rather than a coherent game command surface.

Standing goal approval covers this bounded spec and plan. The malformed UTF-8 sprint-log marker-root defect remains excluded under its sanctioned override; this slice must not read or modify that log. The account surface is presentation-only: the existing Supabase Auth boundary, credentials, session handling, and progression calculations are out of scope and remain governed by `security-controls.md`.

## Outcome

From either primary pre-game route, a player opens Account/Player Record or Advanced Settings into one contained, dimmed, keyboard-accessible command overlay. The setup beneath remains in place. Closing returns focus to the originating control. Advanced settings become a deliberately aligned operations form rather than a long, drifting browser disclosure.

## Requirements

1. Account/Player Record opens as a modal overlay above the full lobby stage, with a backdrop, a labelled dialog, a visible Close control, Escape support, and focus containment/restoration. It must not change the bounding geometry of the masthead, route, Vehicle Bay preview, or controls beneath it.
2. Existing account behavior is preserved exactly: unavailable state is absent; anonymous users can create/sign in; authenticated users see their record and can sign out; credentials still submit only to the existing AccountSession port and password inputs clear immediately after submission.
3. Advanced Settings becomes one modal Operations Settings overlay for Local Battery and Open Operation. Its entry control is visible in each route, names its dialog, and preserves every existing field, current raw value, validation constraint, hint, and serialization behavior.
4. The Advanced Settings overlay uses an intentional three-column field grid (label, control, explanation) at desktop and collapses legibly at narrow widths without overlap or clipped controls. It groups the existing choices as concise operational sections without adding or removing settings.
5. Open Operation keeps Command Vehicle, Operation Profile, and Battlefield Protocol as a coherent command sequence: visible controls remain inside their own section at every supported viewport and cannot overlap a neighbouring section.
6. Exactly one pre-game overlay can be open at a time. Opening/closing never exposes an interactive control behind the modal; backdrop, Escape, Close, and Tab/Shift+Tab behave predictably.
7. Styling stays within the existing dark squared field-console language. No new artwork, dependency, game rule, transport, backend, Supabase, migration, or auth-contract change is permitted.
8. Focused DOM and production-bundle browser tests prove overlay semantics, focus restoration, account callback preservation, current-value retention, field alignment, invariant underlying geometry, and contained Open Operation controls at desktop, touch, and compact viewports. A causal test mutation that returns the overlay to document flow must fail the geometry assertion.

## Non-goals

- No Quick Duel, impact feedback, HUD simplification, orientation-gate, gameplay, or progression-unlock work. The independent player audit records those as later SMARTS candidates.
- No change to account authentication, authorization, credentials, Supabase calls, rate limits, RLS, account-summary arithmetic, or hot-seat trust ceiling.
- No Vehicle Bay behavior/design change beyond ensuring it is visually obscured by an active overlay.
- No change to the settings available, defaults, validation, parse/serialization rules, or online-room contract.

## Acceptance

The account and Advanced Settings paths are real modal layers that no longer reflow or reveal the pre-game stage; Open Operation is a contained, non-overlapping command sequence. Existing account and setting behavior remains covered by focused tests. Production-bundle browser evidence proves both desktop and compact geometry/focus contracts, contained online controls, and a failing document-flow mutation. The final exact staged diff receives adversarial review with this spec, plan, test evidence, and diff; all Critical, High, and merge-blocking findings are resolved before exact-head hosted CI, guarded merge, Pages deployment, and production provenance/health verification.

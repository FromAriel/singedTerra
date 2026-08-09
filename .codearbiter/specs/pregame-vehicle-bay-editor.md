# Pre-game Vehicle Bay editor

## Decision

SMARTS selected the compact Garage editor as the next menu-system slice. It is a direct player-facing choice before every match, its current compact dialog is visually sparse and anonymous, and the work is isolated to the client Lobby surface. The selection is high impact, reversible, and does not touch authentication, persistence, game rules, networking, Supabase, migrations, dependencies, or generated art.

Standing goal approval covers this bounded spec and plan. The known malformed UTF-8 sprint-log marker-root defect remains excluded under the sanctioned override; this slice does not read or modify that log.

## Outcome

Opening a compact Garage presents a named Vehicle Bay with an immediate summary of the current build and a compact, deliberate hierarchy for preset loadouts and individual component changes. A player can understand who is being edited, what is mounted, and which control changes the whole kit versus one component before committing to Start Game.

## Requirements

1. The editing dialog identifies the selected owner as `Vehicle Bay: <owner>` and exposes that same identity to assistive technology.
2. The dialog shows a current-build summary. A uniform kit names its kit. A mixed build states that it is a mixed assembly and lists the four selected part labels.
3. Preset loadouts and individual components are visibly and semantically grouped with explicit labels. Existing preset buttons, slot buttons, selected state, callback behavior, focus trap, Escape close, and focus return remain unchanged.
4. Compact editing lays out the summary, preset group, component group, and Done action as contained non-overlapping regions. It removes the anonymous dead slab visible in the current mobile editor without requiring a new visual asset.
5. The inline non-editing Garage remains compact and keeps its existing Customise action, preset, and slot behavior at desktop and mobile widths.
6. Unit contracts prove owner identity, uniform and mixed summaries, grouping, and unchanged interaction labels. Browser proof measures dialog child containment and vertical clearance at desktop, touch, and compact sizes. A temporary layout mutation must make the new geometry guard fail.

## Non-goals

- No new tank parts, balance, gameplay, loadout data, renderer, network action, backend, or persistence change.
- No account, authentication, Supabase, migration, dependency, or deployment configuration change.
- No redesign of the in-match Vehicle Bay spotlight or Store.

## Acceptance

The targeted unit and production-bundle browser contracts pass across the existing viewport matrix. The full local suite passes. The final exact staged diff receives adversarial review with the spec, plan, tests, and production diff, then hosted CI passes on the reviewed PR head before merge and Pages production health verifies the matching deployment provenance.

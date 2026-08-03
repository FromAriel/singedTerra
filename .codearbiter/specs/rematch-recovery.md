# Rematch Successor Recovery

## User value

When a rematch pointer reaches the non-initiating client before the successor
room is visible through its read path, the player should be carried into the
new match instead of being stranded on the finished room.

## Scope

- Keep `NetworkClient.handleRematch()` polling for the successor room for a
  bounded three-second window.
- Preserve the existing 150ms polling cadence and disposal checks.
- Preserve the current listener payload, error behavior, and manual re-drive
  behavior after the bound is exhausted.
- Add a regression test proving a successor that appears after the old eight-
  attempt cutoff still reaches the rematch listener.

Out of scope: manual rejoin UI, dangling-room reaping, auth or seat tokens,
secrets, cryptography, database/migrations, Edge Functions, action protocol,
new dependencies, and changes to rematch payload normalization.

## Acceptance criteria

1. A successor visible after eight failed reads is still resolved and delivered
   to the rematch listener.
2. The poll remains bounded at 20 attempts (3 seconds at 150ms intervals).
3. Disposed clients stop polling and never notify the listener.
4. Exhaustion still resets `_rematchHandled` for a later manual re-drive.
5. Focused RED coverage fails before the budget change and passes after it.

## SMARTS decision

Selected over the larger replay-checkpoint/performance work and the hard-gated
referee trust/security-controls work. It has strong Signal and User value for
networked match continuity, is Available in one client seam, Maintainable as a
named bounded constant, Reliable because existing disposal/error behavior is
preserved, Testable with a deterministic delayed-row fixture, and Small with no
backend or protocol surface. Confidence: high.

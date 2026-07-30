import { describe, expect, it } from 'vitest';
import { effectiveGravity } from '@shared/engine/GameEngine';
import { resolveAimGuidePresentation } from './aimGuidePresentation';

describe('aim-guide presentation wiring', () => {
  it('combines local ownership with the engine-effective room gravity', () => {
    const gravity = {
      baseGravity: 0.2,
      turn: 9,
      suddenDeathTurn: 6,
    };

    expect(resolveAimGuidePresentation({
      mode: 'network',
      activePlayerId: 'p2',
      localPlayerId: 'p1',
      activeIsAi: false,
    }, gravity)).toEqual({
      visible: false,
      gravity: effectiveGravity(0.2, 9, 6),
    });
    expect(resolveAimGuidePresentation({
      mode: 'network',
      activePlayerId: 'p1',
      localPlayerId: 'p1',
      activeIsAi: false,
    }, gravity)).toEqual({
      visible: true,
      gravity: effectiveGravity(0.2, 9, 6),
    });
  });
});

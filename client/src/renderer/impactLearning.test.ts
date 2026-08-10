import { describe, expect, it } from 'vitest';
import { deriveImpactLearningCue } from './impactLearning';

const tanks = [
  { id: 'shooter', playerName: 'Commander', x: 180, y: 400, alive: true, team: null },
  { id: 'target', playerName: 'CPU 1', x: 800, y: 400, alive: true, team: null },
] as const;

describe('deriveImpactLearningCue', () => {
  it('describes a left miss and tells the player to shift the impact right', () => {
    expect(deriveImpactLearningCue({
      impactX: 716,
      impactType: 'ground',
      shooterId: 'shooter',
      localShot: true,
      walls: 'open',
      tanks,
    })).toEqual({
      readout: '84 PX LEFT OF CPU 1',
      correction: 'SHIFT IMPACT RIGHT',
    });
  });

  it('describes a right miss and tells the player to shift the impact left', () => {
    expect(deriveImpactLearningCue({
      impactX: 854,
      impactType: 'ground',
      shooterId: 'shooter',
      localShot: true,
      walls: 'open',
      tanks,
    })).toEqual({
      readout: '54 PX RIGHT OF CPU 1',
      correction: 'SHIFT IMPACT LEFT',
    });
  });

  it.each([
    {
      impactX: 800,
      impactType: 'tank' as const,
      expected: { readout: 'DIRECT HIT: CPU 1', correction: 'HOLD COURSE' },
    },
    {
      impactX: 811.6,
      impactType: 'ground' as const,
      expected: { readout: 'ON LINE: CPU 1', correction: 'HOLD COURSE' },
    },
  ])('uses hold-course language for $impactType feedback', ({
    impactX,
    impactType,
    expected,
  }) => {
    expect(deriveImpactLearningCue({
      impactX,
      impactY: 394,
      impactType,
      shooterId: 'shooter',
      localShot: true,
      walls: 'open',
      tanks,
    })).toEqual(expected);
  });

  it.each([
    {
      label: 'the shooter',
      impactX: 180,
      impactY: 394,
      candidateTanks: tanks,
    },
    {
      label: 'a teammate',
      impactX: 620,
      impactY: 394,
      candidateTanks: [
        { ...tanks[0], team: 1 as const },
        { id: 'ally', playerName: 'Ally', x: 620, y: 400, alive: true, team: 1 as const },
        { ...tanks[1], x: 700, team: 2 as const },
      ],
    },
  ])('fails soft when a direct collision strikes $label', ({
    impactX,
    impactY,
    candidateTanks,
  }) => {
    expect(deriveImpactLearningCue({
      impactX,
      impactY,
      impactType: 'tank',
      shooterId: 'shooter',
      localShot: true,
      walls: 'open',
      tanks: candidateTanks,
    })).toBeNull();
  });

  it('attributes a lethal direct hit from geometry even after the target is dead', () => {
    expect(deriveImpactLearningCue({
      impactX: 800,
      impactY: 394,
      impactType: 'tank',
      shooterId: 'shooter',
      localShot: true,
      walls: 'open',
      tanks: [tanks[0], { ...tanks[1], alive: false }],
    })).toEqual({
      readout: 'DIRECT HIT: CPU 1',
      correction: 'HOLD COURSE',
    });
  });

  it('attributes a direct hit to the physically struck tank instead of a nearer old wreck', () => {
    expect(deriveImpactLearningCue({
      impactX: 800,
      impactY: 394,
      impactType: 'tank',
      shooterId: 'shooter',
      localShot: true,
      walls: 'open',
      tanks: [
        tanks[0],
        { id: 'wreck', playerName: 'Old Wreck', x: 799, y: 300, alive: false, team: null },
        tanks[1],
      ],
    })).toEqual({
      readout: 'DIRECT HIT: CPU 1',
      correction: 'HOLD COURSE',
    });
  });

  it('fails soft when overlapping tank geometry makes a direct hit ambiguous', () => {
    expect(deriveImpactLearningCue({
      impactX: 800,
      impactY: 394,
      impactType: 'tank',
      shooterId: 'shooter',
      localShot: true,
      walls: 'open',
      tanks: [
        tanks[0],
        tanks[1],
        { id: 'wreck', playerName: 'Old Wreck', x: 800, y: 400, alive: false, team: null },
      ],
    })).toBeNull();
  });

  it('uses the shortest horizontal correction across wrapped sidewalls', () => {
    expect(deriveImpactLearningCue({
      impactX: 1180,
      impactType: 'ground',
      shooterId: 'shooter',
      localShot: true,
      walls: 'wrap',
      tanks: [
        tanks[0],
        { ...tanks[1], x: 35 },
      ],
    })).toEqual({
      readout: '55 PX LEFT OF CPU 1',
      correction: 'SHIFT IMPACT RIGHT',
    });
  });

  it('targets the nearest opponent and excludes the shooter team', () => {
    expect(deriveImpactLearningCue({
      impactX: 610,
      impactType: 'ground',
      shooterId: 'shooter',
      localShot: true,
      walls: 'open',
      tanks: [
        { ...tanks[0], team: 1 },
        { id: 'ally', playerName: 'Ally', x: 620, y: 400, alive: true, team: 1 },
        { id: 'far-enemy', playerName: 'Enemy', x: 700, y: 400, alive: true, team: 2 },
        { id: 'near-enemy', playerName: 'Wreck', x: 630, y: 400, alive: false, team: 2 },
      ],
    })).toEqual({
      readout: '90 PX LEFT OF Enemy',
      correction: 'SHIFT IMPACT RIGHT',
    });
  });

  it.each([
    { label: 'ordinary', walls: 'open' as const, impactX: 400, leftX: 300, rightX: 500 },
    { label: 'wrapped', walls: 'wrap' as const, impactX: 0, leftX: 100, rightX: 1100 },
  ])('fails soft for $label equidistant opponents', ({ walls, impactX, leftX, rightX }) => {
    expect(deriveImpactLearningCue({
      impactX,
      impactType: 'ground',
      shooterId: 'shooter',
      localShot: true,
      walls,
      tanks: [
        tanks[0],
        { id: 'left', playerName: 'Left', x: leftX, y: 400, alive: true, team: null },
        { id: 'right', playerName: 'Right', x: rightX, y: 400, alive: true, team: null },
      ],
    })).toBeNull();
  });

  it.each([
    { label: 'remote shot', localShot: false, shooterId: 'shooter', impactX: 700 },
    { label: 'missing shooter', localShot: true, shooterId: null, impactX: 700 },
    { label: 'unknown shooter', localShot: true, shooterId: 'missing', impactX: 700 },
    { label: 'malformed impact', localShot: true, shooterId: 'shooter', impactX: Number.NaN },
    {
      label: 'no opponent',
      localShot: true,
      shooterId: 'shooter',
      impactX: 700,
      candidateTanks: [tanks[0]],
    },
  ])('fails soft for $label', ({
    localShot,
    shooterId,
    impactX,
    candidateTanks = tanks,
  }) => {
    expect(deriveImpactLearningCue({
      impactX,
      impactType: 'ground',
      shooterId,
      localShot,
      walls: 'open',
      tanks: candidateTanks,
    })).toBeNull();
  });
});

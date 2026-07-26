import { describe, expect, it } from 'vitest';
import { advanceDebris, type DebrisMotion, type TerrainField } from './debrisMotion';

function field(width = 12, height = 12): TerrainField {
  return { bitmap: new Uint8Array(width * height), width, height };
}

function solid(terrain: TerrainField, x: number, y: number): void {
  terrain.bitmap[y * terrain.width + x] = 1;
}

function motion(overrides: Partial<DebrisMotion> = {}): DebrisMotion {
  return {
    x: 5,
    y: 2,
    vx: 0,
    vy: 2,
    size: 2,
    rot: 0.4,
    vr: 0.2,
    landed: false,
    ...overrides,
  };
}

describe('advanceDebris', () => {
  it('lands a falling chunk at the last clear sample above flat terrain', () => {
    const terrain = field();
    for (let y = 6; y < terrain.height; y++) {
      for (let x = 0; x < terrain.width; x++) solid(terrain, x, y);
    }

    const next = advanceDebris(motion(), terrain, 1);

    expect(next).toMatchObject({ x: 5, vx: 0, vy: 0, vr: 0, landed: true });
    expect(next.y).toBeCloseTo(5, 3);
    expect(terrain.bitmap[Math.floor(next.y + next.size / 2) * terrain.width + next.x]).toBe(0);
    expect(terrain.bitmap[(Math.floor(next.y + next.size / 2) + 1) * terrain.width + next.x]).toBe(1);
  });

  it('collides across the complete left, center, and right chunk lower edge', () => {
    for (const contactX of [4, 5, 6]) {
      const terrain = field();
      solid(terrain, contactX, 4);

      const next = advanceDebris(motion({ y: 2, vy: 1 }), terrain, 1);

      expect(next.landed, `contact x=${contactX}`).toBe(true);
      expect(next.y, `contact x=${contactX}`).toBeCloseTo(3, 3);
    }
  });

  it('sweeps the whole movement segment so a fast diagonal chunk cannot tunnel through a ridge', () => {
    const terrain = field();
    solid(terrain, 6, 5);

    const next = advanceDebris(
      motion({ x: 2, y: 3, vx: 8, vy: 2, size: 2 }),
      terrain,
      1,
    );

    expect(next.landed).toBe(true);
    expect(next.x).toBeLessThan(6);
    expect(next.x + next.size / 2).toBeLessThan(6);
  });

  it('uses swept lower-edge volume for adversarial diagonal crossings in both directions', () => {
    const cases = [
      { x: 2.05, vx: -1.4, solidX: 2 },
      { x: 5.95, vx: 1.4, solidX: 5 },
    ];
    for (const sample of cases) {
      const terrain = field(8, 8);
      solid(terrain, sample.solidX, 2);

      const next = advanceDebris(
        motion({ x: sample.x, y: 0.05, vx: sample.vx, vy: 1.2, size: 1.5 }),
        terrain,
        1,
      );

      expect(next.landed, `vx=${sample.vx}`).toBe(true);
      expect(next.y + next.size / 2, `vx=${sample.vx}`).toBeLessThanOrEqual(2);
    }
  });

  it('holds a supported landed chunk still and resumes gravity after support is removed', () => {
    const landed = motion({ y: 3, vx: 0, vy: 0, vr: 0, landed: true });

    for (const supportX of [4, 5, 6]) {
      const terrain = field();
      solid(terrain, supportX, 5);
      expect(advanceDebris(landed, terrain, 1), `support x=${supportX}`).toEqual(landed);
    }

    const terrain = field();
    solid(terrain, 5, 5);
    terrain.bitmap.fill(0);
    expect(advanceDebris(landed, terrain, 1)).toEqual({
      ...landed,
      y: 4,
      vy: 1,
      landed: false,
    });
  });

  it('does not collide while rising through terrain above the chunk', () => {
    const terrain = field();
    solid(terrain, 5, 2);

    expect(advanceDebris(motion({ y: 5, vy: -4 }), terrain, 0)).toMatchObject({
      x: 5,
      y: 1,
      vy: -4,
      landed: false,
    });
  });

  it('treats exactly zero post-gravity vertical velocity as non-falling', () => {
    const terrain = field();
    solid(terrain, 5, 2);

    expect(advanceDebris(motion({ y: 1, vx: 1, vy: -1 }), terrain, 1)).toMatchObject({
      x: 6,
      y: 1,
      vy: 0,
      landed: false,
    });
  });

  it('fails open for empty and independently malformed terrain without mutating inputs', () => {
    const cases: TerrainField[] = [
      field(),
      { bitmap: new Uint8Array(3), width: 12, height: 12 },
      { bitmap: new Uint8Array(16), width: 4.5, height: 4 },
      { bitmap: new Uint8Array(16), width: 4, height: 4.5 },
      { bitmap: new Uint8Array(), width: 0, height: 4 },
      { bitmap: new Uint8Array(), width: 4, height: 0 },
    ];

    for (const terrain of cases) {
      terrain.bitmap.fill(1);
      const debris = motion({ x: 1, y: 1, vx: 1, vy: 1 });
      const beforeDebris = { ...debris };
      const beforeBitmap = terrain.bitmap.slice();
      const next = advanceDebris(debris, terrain, 1);

      if (terrain.width === 12 && terrain.height === 12 && terrain.bitmap.length === 144) {
        expect(next.landed).toBe(true);
      } else {
        expect(next).toMatchObject({ x: 2, y: 3, vx: 1, vy: 2, landed: false });
      }
      expect(Object.values(next).every((value) => typeof value === 'boolean' || Number.isFinite(value))).toBe(true);
      expect(debris).toEqual(beforeDebris);
      expect(terrain.bitmap).toEqual(beforeBitmap);
    }
  });

  it('fails open independently beyond each world edge', () => {
    const cases = [
      {
        debris: motion({ x: -3, y: 5, vx: -1, vy: 1 }),
        seedBoundary: (terrain: TerrainField) => {
          for (let y = 0; y < terrain.height; y++) solid(terrain, 0, y);
        },
      },
      {
        debris: motion({ x: 15, y: 5, vx: 1, vy: 1 }),
        seedBoundary: (terrain: TerrainField) => {
          for (let y = 0; y < terrain.height; y++) solid(terrain, terrain.width - 1, y);
        },
      },
      {
        debris: motion({ x: 5, y: -5, vx: 0, vy: 0, landed: true }),
        seedBoundary: (terrain: TerrainField) => {
          for (let x = 0; x < terrain.width; x++) solid(terrain, x, 0);
        },
      },
      {
        debris: motion({ x: 5, y: 15, vx: 0, vy: 0, landed: true }),
        seedBoundary: (terrain: TerrainField) => {
          for (let x = 0; x < terrain.width; x++) solid(terrain, x, terrain.height - 1);
        },
      },
    ];

    for (const sample of cases) {
      const terrain = field();
      sample.seedBoundary(terrain);
      const next = advanceDebris(sample.debris, terrain, 1);
      expect(next.landed).toBe(false);
      expect(Object.values(next).every((value) => typeof value === 'boolean' || Number.isFinite(value))).toBe(true);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { EffectsRenderer } from './EffectsRenderer';
import { TERRAIN } from '../ui/theme';

interface EffectsSeam {
  debris: Array<{ color: string }>;
  sparks: unknown[];
  texts: Array<{ text: string; color: string }>;
}

function seam(reduceMotion = false) {
  const effects = new EffectsRenderer(reduceMotion);
  return {
    effects,
    state: effects as unknown as EffectsSeam,
  };
}

describe('material impact particles', () => {
  it('keeps terrain ejecta for ground impacts without a direct-hit readout', () => {
    const { effects, state } = seam();

    effects.spawnExplosion(200, 300, 36, '#ff7a1f', 'ground');

    expect(state.debris.length).toBeGreaterThan(4);
    expect(state.debris.some((chunk) => chunk.color === TERRAIN.top)).toBe(true);
    expect(state.texts.some((text) => text.text === 'DIRECT HIT')).toBe(false);
  });

  it('replaces dirt with bounded metal fragments and a direct-hit readout', () => {
    const { effects, state } = seam();

    effects.spawnExplosion(200, 300, 36, '#ff7a1f', 'tank');

    expect(state.debris.length).toBeGreaterThanOrEqual(3);
    expect(state.debris.length).toBeLessThanOrEqual(8);
    expect(state.debris.some((chunk) => chunk.color === TERRAIN.top)).toBe(false);
    expect(state.sparks.length).toBeGreaterThanOrEqual(8);
    expect(state.texts).toContainEqual(expect.objectContaining({
      text: 'DIRECT HIT',
    }));
  });

  it('keeps the informational readout but suppresses motion when reduced', () => {
    const { effects, state } = seam(true);

    effects.spawnExplosion(200, 300, 36, '#ff7a1f', 'tank');

    expect(state.debris).toHaveLength(0);
    expect(state.sparks).toHaveLength(0);
    expect(state.texts).toContainEqual(expect.objectContaining({
      text: 'DIRECT HIT',
    }));
  });
});

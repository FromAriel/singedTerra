import { describe, expect, it } from 'vitest';
import type { ExplosionEvent } from '@shared/types/GameState';
import {
  coalesceImpactMaterial,
  getImpactAudioProfile,
} from './impactMaterial';

function event(
  id: number,
  impactType?: 'ground' | 'tank',
  radius = 30,
): ExplosionEvent {
  return {
    id,
    weaponType: 'missile',
    cx: 100,
    cy: 200,
    radius,
    style: 'blast',
    color: '#ffb347',
    durationFrames: 40,
    impactType,
  };
}

describe('impact-material batch routing', () => {
  it('prefers armor over ground and uses the strongest matching blast', () => {
    expect(coalesceImpactMaterial([
      event(1, 'ground', 80),
      event(2, 'tank', 20),
      event(3, 'tank', 45),
    ])).toEqual({ impactType: 'tank', radius: 45 });
  });

  it('keeps the strongest ground hit and ignores unclassified air events', () => {
    expect(coalesceImpactMaterial([
      event(1, undefined, 90),
      event(2, 'ground', 24),
      event(3, 'ground', 40),
    ])).toEqual({ impactType: 'ground', radius: 40 });
    expect(coalesceImpactMaterial([event(1)])).toBeNull();
  });
});

describe('procedural impact audio profiles', () => {
  it('returns finite bounded signatures with armor brighter than terrain', () => {
    const ground = getImpactAudioProfile('ground', 30)!;
    const tank = getImpactAudioProfile('tank', 30)!;

    for (const profile of [ground, tank]) {
      expect(profile.duration).toBeGreaterThan(0.04);
      expect(profile.duration).toBeLessThanOrEqual(0.24);
      expect(profile.noiseGain).toBeGreaterThan(0);
      expect(profile.noiseGain).toBeLessThanOrEqual(0.35);
      expect(profile.toneGain).toBeGreaterThan(0);
      expect(profile.toneGain).toBeLessThanOrEqual(0.3);
      expect(profile.noiseGain + profile.toneGain).toBeLessThanOrEqual(0.12);
      expect(Number.isFinite(profile.noiseFrequency)).toBe(true);
      expect(Number.isFinite(profile.toneStart)).toBe(true);
      expect(Number.isFinite(profile.toneEnd)).toBe(true);
    }
    expect(tank.noiseFrequency).toBeGreaterThan(ground.noiseFrequency);
    expect(tank.toneStart).toBeGreaterThan(ground.toneStart);
    for (const impactType of ['ground', 'tank'] as const) {
      const maximum = getImpactAudioProfile(impactType, 120)!;
      expect(maximum.noiseGain + maximum.toneGain)
        .toBeLessThanOrEqual(0.12);
    }
  });

  it('clamps valid strength and rejects invalid material inputs', () => {
    expect(getImpactAudioProfile('ground', 1))
      .toEqual(getImpactAudioProfile('ground', 4));
    expect(getImpactAudioProfile('tank', 999))
      .toEqual(getImpactAudioProfile('tank', 120));
    expect(getImpactAudioProfile('tank', Number.NaN)).toBeNull();
    expect(getImpactAudioProfile('ground', 0)).toBeNull();
    expect(getImpactAudioProfile('wood' as 'ground', 30)).toBeNull();
  });
});

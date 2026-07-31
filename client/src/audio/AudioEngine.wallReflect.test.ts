import { describe, expect, it } from 'vitest';
import { getWallReflectAudioProfile } from './AudioEngine';

describe('wall ricochet audio profile', () => {
  it('keeps every layer short, bounded, and side-distinct', () => {
    const left = getWallReflectAudioProfile('left');
    const right = getWallReflectAudioProfile('right');

    expect(left.startFrequency).not.toBe(right.startFrequency);
    for (const profile of [left, right]) {
      expect(profile.noiseGain + profile.toneGain).toBeLessThanOrEqual(0.14);
      expect(profile.noiseDuration).toBeLessThanOrEqual(0.08);
      expect(profile.toneDuration).toBeLessThanOrEqual(0.12);
      expect(profile.endFrequency).toBeGreaterThan(0);
      expect(profile.endFrequency).toBeLessThan(profile.startFrequency);
    }
  });
});

import type {
  ExplosionEvent,
  ExplosionImpactType,
} from '@shared/types/GameState';

export interface ImpactMaterialBatch {
  impactType: ExplosionImpactType;
  radius: number;
}

export interface ImpactAudioProfile {
  duration: number;
  noiseGain: number;
  noiseFrequency: number;
  noiseFilter: BiquadFilterType;
  noiseQ: number;
  toneGain: number;
  toneStart: number;
  toneEnd: number;
  toneType: OscillatorType;
}

/**
 * Collapse a frame's collision-derived material events to one audio transient.
 * Armor wins because a direct hit is the most important result to communicate;
 * within that material, the largest valid blast supplies the strength.
 */
export function coalesceImpactMaterial(
  events: readonly Readonly<ExplosionEvent>[],
): ImpactMaterialBatch | null {
  let groundRadius = 0;
  let tankRadius = 0;
  for (const event of events) {
    if (!Number.isFinite(event.radius) || event.radius <= 0) continue;
    if (event.impactType === 'tank') {
      tankRadius = Math.max(tankRadius, event.radius);
    } else if (event.impactType === 'ground') {
      groundRadius = Math.max(groundRadius, event.radius);
    }
  }
  if (tankRadius > 0) return { impactType: 'tank', radius: tankRadius };
  if (groundRadius > 0) return { impactType: 'ground', radius: groundRadius };
  return null;
}

/**
 * Finite, bounded procedural material layer placed underneath the weapon boom.
 * The blast owns scale and low end; this short profile only identifies surface.
 */
export function getImpactAudioProfile(
  impactType: ExplosionImpactType,
  radius: number,
): ImpactAudioProfile | null {
  if (
    (impactType !== 'ground' && impactType !== 'tank')
    || !Number.isFinite(radius)
    || radius <= 0
  ) {
    return null;
  }

  const clampedRadius = Math.min(120, Math.max(4, radius));
  const strength = (clampedRadius - 4) / 116;
  if (impactType === 'tank') {
    return {
      duration: 0.075 + strength * 0.065,
      noiseGain: 0.05 + strength * 0.025,
      noiseFrequency: 2100 + strength * 1500,
      noiseFilter: 'bandpass',
      noiseQ: 4.5,
      toneGain: 0.025 + strength * 0.015,
      toneStart: 930 + strength * 370,
      toneEnd: 310 + strength * 100,
      toneType: 'triangle',
    };
  }

  return {
    duration: 0.1 + strength * 0.09,
    noiseGain: 0.045 + strength * 0.02,
    noiseFrequency: 250 + strength * 260,
    noiseFilter: 'lowpass',
    noiseQ: 0.8,
    toneGain: 0.025 + strength * 0.015,
    toneStart: 155 + strength * 65,
    toneEnd: 62 + strength * 24,
    toneType: 'sine',
  };
}

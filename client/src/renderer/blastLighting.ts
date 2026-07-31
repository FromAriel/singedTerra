import type { ExplosionVisualFamily } from './explosionVisuals';

/** At most this many logical pixels of radial light are painted around one blast. */
export const BLAST_LIGHT_MAX_RADIUS = 360;
/** Additive alpha cap keeps overlapping lights readable instead of washing to white. */
export const BLAST_LIGHT_MAX_ALPHA = 0.68;

export interface BlastLightInput {
  family: ExplosionVisualFamily;
  /** Exact shared-reach profile radius; light spread is derived from this value. */
  reachRadius: number;
  age: number;
  lifeFrames: number;
}

export interface BlastLightProfile {
  /** Presentation-only falloff radius; not a damage or fireball boundary. */
  radius: number;
  /** Additive Canvas alpha for this frame. */
  alpha: number;
}

interface FamilyLight {
  spread: number;
  peakAlpha: number;
}

const FAMILY_LIGHTS = {
  conventional: { spread: 1.7, peakAlpha: 0.42 },
  nuclear: { spread: 2.2, peakAlpha: 0.68 },
  earth: { spread: 1.25, peakAlpha: 0.26 },
  incendiary: { spread: 1.65, peakAlpha: 0.55 },
  scatter: { spread: 1.35, peakAlpha: 0.32 },
  funky: { spread: 1.85, peakAlpha: 0.5 },
  mine: { spread: 1.4, peakAlpha: 0.36 },
} satisfies Record<ExplosionVisualFamily, FamilyLight>;

/**
 * Derive a finite local-light envelope from renderer-only burst state.
 *
 * The first 8% holds at peak so a one-frame impact cannot disappear between
 * paints; the remaining lifetime falls quadratically toward exact zero.
 */
export function getBlastLightProfile(
  input: Readonly<BlastLightInput>,
): BlastLightProfile {
  const { family, reachRadius, age, lifeFrames } = input;
  if (
    !Number.isFinite(reachRadius)
    || reachRadius <= 0
    || !Number.isFinite(age)
    || age < 0
    || !Number.isFinite(lifeFrames)
    || lifeFrames <= 0
  ) {
    return { radius: 0, alpha: 0 };
  }

  const light = FAMILY_LIGHTS[family];
  const radius = Math.min(BLAST_LIGHT_MAX_RADIUS, reachRadius * light.spread);
  if (age >= lifeFrames) return { radius, alpha: 0 };

  const holdFraction = 0.08;
  const progress = age / lifeFrames;
  const decayProgress = progress <= holdFraction
    ? 0
    : (progress - holdFraction) / (1 - holdFraction);
  const envelope = (1 - decayProgress) ** 2;
  const alpha = Math.min(BLAST_LIGHT_MAX_ALPHA, light.peakAlpha * envelope);

  return { radius, alpha };
}

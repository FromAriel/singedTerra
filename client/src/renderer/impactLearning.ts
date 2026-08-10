import type { ExplosionImpactType } from '@shared/types/GameState';
import type { WallMode } from '@shared/types/GameOptions';
import { CANVAS_WIDTH } from '@shared/engine/Terrain';
import { TANK_HEIGHT, TANK_WIDTH } from '@shared/engine/Tank';

const ON_LINE_TOLERANCE = 12;
const DISTANCE_TIE_EPSILON = 1e-9;

export interface ImpactLearningCue {
  readonly readout: string;
  readonly correction: string;
}

export interface ImpactLearningTank {
  readonly id: string;
  readonly playerName: string;
  readonly x: number;
  readonly y: number;
  readonly alive: boolean;
  readonly team?: 1 | 2 | null;
}

export interface ImpactLearningInput {
  readonly impactX: number;
  readonly impactY?: number;
  readonly impactType?: ExplosionImpactType;
  readonly shooterId: string | null;
  readonly localShot: boolean;
  readonly walls: WallMode;
  readonly tanks: readonly ImpactLearningTank[];
}

export function deriveImpactLearningCue(
  input: ImpactLearningInput,
): ImpactLearningCue | null {
  const {
    impactX,
    impactY,
    impactType,
    shooterId,
    localShot,
    walls,
    tanks,
  } = input;
  if (!localShot || shooterId === null || !Number.isFinite(impactX)) return null;

  const shooter = tanks.find((tank) => tank.id === shooterId);
  if (!shooter) return null;

  if (impactType === 'tank') {
    if (!Number.isFinite(impactY)) return null;
    const physicallyStruck = tanks.filter((tank) => (
      Number.isFinite(tank.x)
      && Number.isFinite(tank.y)
      && impactX >= tank.x - TANK_WIDTH / 2
      && impactX <= tank.x + TANK_WIDTH / 2
      && impactY! >= tank.y - TANK_HEIGHT
      && impactY! <= tank.y
    ));
    if (physicallyStruck.length !== 1) return null;

    const target = physicallyStruck[0];
    if (!target) return null;
    if (
      target.id === shooterId
      || (
        shooter.team != null
        && target.team != null
        && target.team === shooter.team
      )
    ) {
      return null;
    }
    const targetName = target.playerName.trim() || 'OPPONENT';
    return {
      readout: `DIRECT HIT: ${targetName}`,
      correction: 'HOLD COURSE',
    };
  }

  const horizontalDelta = (targetX: number): number => {
    const direct = targetX - impactX;
    if (walls !== 'wrap') return direct;
    return (
      ((direct + CANVAS_WIDTH / 2) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH
    ) - CANVAS_WIDTH / 2;
  };

  let target: ImpactLearningTank | null = null;
  let targetDelta = 0;
  let targetDistance = Number.POSITIVE_INFINITY;
  let ambiguous = false;
  for (const candidate of tanks) {
    if (
      candidate.id === shooterId
      || !Number.isFinite(candidate.x)
      || !candidate.alive
      || (
        shooter.team != null
        && candidate.team != null
        && candidate.team === shooter.team
      )
    ) {
      continue;
    }
    const delta = horizontalDelta(candidate.x);
    const distance = Math.abs(delta);
    if (distance < targetDistance - DISTANCE_TIE_EPSILON) {
      target = candidate;
      targetDelta = delta;
      targetDistance = distance;
      ambiguous = false;
    } else if (Math.abs(distance - targetDistance) <= DISTANCE_TIE_EPSILON) {
      ambiguous = true;
    }
  }
  if (target === null || ambiguous) return null;

  const targetName = target.playerName.trim() || 'OPPONENT';
  const distance = targetDistance;
  if (distance <= ON_LINE_TOLERANCE) {
    return {
      readout: `ON LINE: ${targetName}`,
      correction: 'HOLD COURSE',
    };
  }

  const roundedDistance = Math.round(distance);
  const impactSide = targetDelta > 0 ? 'LEFT' : 'RIGHT';
  const correctionSide = targetDelta > 0 ? 'RIGHT' : 'LEFT';
  return {
    readout: `${roundedDistance} PX ${impactSide} OF ${targetName}`,
    correction: `SHIFT IMPACT ${correctionSide}`,
  };
}

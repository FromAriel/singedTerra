import { effectiveGravity } from '@shared/engine/GameEngine';
import {
  isActiveSeatLocal,
  type ActiveSeatOwnership,
} from '../input/inputGate';

export interface AimGuideGravity {
  baseGravity: number;
  turn: number;
  suddenDeathTurn: number;
}

export interface AimGuidePresentation {
  visible: boolean;
  gravity: number;
}

/** Keep aim-guide ownership and the engine's effective gravity wired as one value. */
export function resolveAimGuidePresentation(
  ownership: ActiveSeatOwnership,
  gravity: AimGuideGravity,
): AimGuidePresentation {
  return {
    visible: isActiveSeatLocal(ownership),
    gravity: effectiveGravity(
      gravity.baseGravity,
      gravity.turn,
      gravity.suddenDeathTurn,
    ),
  };
}

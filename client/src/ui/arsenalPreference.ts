/**
 * Collapse the tall arsenal by default whenever the fixed 1464×600 stage is
 * rendered below its 0.8 compact threshold. The coarse-pointer clause retains
 * the roomier landscape-phone behavior where touch controls consume HUD space.
 */
export const COMPACT_STAGE_QUERY =
  '(max-width: 1171px), (max-height: 479px), (pointer: coarse) and (max-height: 700px)';

export function resolveInitialArsenalCollapsed(
  storedValue: string | null,
  compactStage: boolean,
): boolean {
  if (storedValue === '1') return true;
  if (storedValue === '0') return false;
  return compactStage;
}

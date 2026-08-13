export interface ComposableContentProfile {
  readonly style: 'tap' | 'pulse' | 'fan' | 'wall';
  readonly copies: number;
  readonly pace: number;
  readonly arcWidth: number;
  readonly spacingTicks: number;
  readonly impactScore: number;
  readonly terrainPixels: number;
  readonly color: string;
}

export const COMPOSABLE_CONTENT = new Map<string, ComposableContentProfile>();

export function registerComposableContent(id: string, profile: ComposableContentProfile): void {
  if (COMPOSABLE_CONTENT.has(id)) throw new Error(`duplicate composed content id: ${id}`);
  COMPOSABLE_CONTENT.set(id, Object.freeze({ ...profile }));
}

const BUILT_INS: Readonly<Record<string, ComposableContentProfile>> = Object.freeze({
  'profile.a': { style: 'tap', copies: 1, pace: 18, arcWidth: 0, spacingTicks: 0, impactScore: 6, terrainPixels: 1, color: '#ffe8a3' },
  'profile.b': { style: 'tap', copies: 1, pace: 20, arcWidth: 0, spacingTicks: 0, impactScore: 9, terrainPixels: 1, color: '#ffd27a' },
  'profile.c': { style: 'tap', copies: 1, pace: 19, arcWidth: 0, spacingTicks: 0, impactScore: 14, terrainPixels: 2, color: '#ffb85c' },
  'profile.d': { style: 'pulse', copies: 3, pace: 21, arcWidth: 2, spacingTicks: 3, impactScore: 5, terrainPixels: 1, color: '#ffd97d' },
  'profile.e': { style: 'pulse', copies: 4, pace: 23, arcWidth: 2.5, spacingTicks: 2, impactScore: 5, terrainPixels: 1, color: '#ffd166' },
  'profile.f': { style: 'pulse', copies: 3, pace: 25, arcWidth: 1.2, spacingTicks: 3, impactScore: 8, terrainPixels: 2, color: '#ffc857' },
  'profile.g': { style: 'fan', copies: 9, pace: 17, arcWidth: 18, spacingTicks: 0, impactScore: 3.5, terrainPixels: 1, color: '#ffcf70' },
  'profile.h': { style: 'fan', copies: 12, pace: 18, arcWidth: 22, spacingTicks: 0, impactScore: 3, terrainPixels: 1, color: '#ffbf69' },
  'profile.i': { style: 'pulse', copies: 16, pace: 24, arcWidth: 6, spacingTicks: 1, impactScore: 2.4, terrainPixels: 1, color: '#ffe07a' },
  'profile.j': { style: 'wall', copies: 12, pace: 21, arcWidth: 12, spacingTicks: 0, impactScore: 4, terrainPixels: 1, color: '#ffad5a' },
});

for (const [id, profile] of Object.entries(BUILT_INS)) registerComposableContent(id, profile);

export function getComposableContent(id: string): ComposableContentProfile | undefined {
  return COMPOSABLE_CONTENT.get(id);
}

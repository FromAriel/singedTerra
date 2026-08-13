export interface ComposableContentProfile {
  readonly pattern: 'single' | 'burst' | 'cone' | 'volley';
  readonly count: number;
  readonly rate: number;
  readonly spread: number;
  readonly intervalTicks: number;
  readonly effect: number;
  readonly terrainPixels: number;
  readonly color: string;
}

export const COMPOSABLE_CONTENT = new Map<string, ComposableContentProfile>();

export function registerComposableContent(id: string, profile: ComposableContentProfile): void {
  if (COMPOSABLE_CONTENT.has(id)) throw new Error(`duplicate composed content id: ${id}`);
  COMPOSABLE_CONTENT.set(id, Object.freeze({ ...profile }));
}

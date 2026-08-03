export const QUICK_CHAT_MESSAGES = {
  nice_shot: 'Nice shot!',
  watch_wind: 'Watch the wind.',
  your_move: 'Your move.',
  good_game: 'Good game!',
  oops: 'Oops!',
  ready: 'Ready when you are.',
} as const;

export type QuickChatKey = keyof typeof QUICK_CHAT_MESSAGES;

export interface QuickChatPayload {
  key: QuickChatKey;
  playerId: string;
}

export function isQuickChatKey(value: unknown): value is QuickChatKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(QUICK_CHAT_MESSAGES, value);
}

export function parseQuickChatPayload(value: unknown): QuickChatPayload | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as { key?: unknown; playerId?: unknown };
  const keys = Object.keys(value);
  if (keys.length !== 2 || !keys.includes('key') || !keys.includes('playerId')) return null;
  if (!isQuickChatKey(candidate.key)) return null;
  if (typeof candidate.playerId !== 'string' || candidate.playerId.trim() === '') return null;
  return { key: candidate.key, playerId: candidate.playerId };
}

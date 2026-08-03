import { describe, expect, it } from 'vitest';
import {
  QUICK_CHAT_MESSAGES,
  isQuickChatKey,
  parseQuickChatPayload,
} from './quickChat';

describe('quick chat catalog', () => {
  it('exposes exactly the fixed six-message palette', () => {
    expect(Object.keys(QUICK_CHAT_MESSAGES)).toEqual([
      'nice_shot',
      'watch_wind',
      'your_move',
      'good_game',
      'oops',
      'ready',
    ]);
    expect(QUICK_CHAT_MESSAGES.nice_shot).toBe('Nice shot!');
    expect(QUICK_CHAT_MESSAGES.watch_wind).toBe('Watch the wind.');
  });

  it('accepts known keys and rejects arbitrary keys', () => {
    expect(isQuickChatKey('ready')).toBe(true);
    expect(isQuickChatKey('free_text')).toBe(false);
    expect(isQuickChatKey(42)).toBe(false);
  });

  it('parses only a known key and non-empty public player id', () => {
    expect(parseQuickChatPayload({ key: 'oops', playerId: 'p2' })).toEqual({
      key: 'oops',
      playerId: 'p2',
    });
    expect(parseQuickChatPayload({ key: 'free_text', playerId: 'p2' })).toBeNull();
    expect(parseQuickChatPayload({ key: 'ready', playerId: '  ' })).toBeNull();
    expect(parseQuickChatPayload({ key: 'ready', playerId: 'p2', extra: 'drop-me' })).toBeNull();
    expect(parseQuickChatPayload(null)).toBeNull();
  });
});

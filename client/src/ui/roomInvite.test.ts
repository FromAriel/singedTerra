import { describe, expect, it } from 'vitest';
import { buildRoomInviteUrl, readRoomInviteCode } from './roomInvite';

describe('room invite URLs', () => {
  it('preserves the deployment path while sharing only a normalized room code', () => {
    expect(
      buildRoomInviteUrl(
        'https://play.example/singedTerra/?e2e=hotseat&utm_source=test#stale',
        ' ab12 ',
      ),
    ).toBe('https://play.example/singedTerra/?join=AB12');
  });

  it('rejects malformed codes instead of generating ambiguous invites', () => {
    expect(buildRoomInviteUrl('https://play.example/game/', 'ABC')).toBeNull();
    expect(buildRoomInviteUrl('https://play.example/game/', 'ABCDE')).toBeNull();
    expect(buildRoomInviteUrl('https://play.example/game/', 'A<script>')).toBeNull();
  });

  it('removes URL credentials and rejects non-web schemes', () => {
    expect(
      buildRoomInviteUrl('https://player:private@play.example/game/', 'AB12'),
    ).toBe('https://play.example/game/?join=AB12');
    expect(buildRoomInviteUrl('javascript:alert(1)', 'AB12')).toBeNull();
    expect(buildRoomInviteUrl('data:text/plain,hello', 'AB12')).toBeNull();
  });

  it('reads only one exact valid normalized join parameter', () => {
    expect(readRoomInviteCode('https://play.example/singedTerra/?join=ab12')).toBe('AB12');
    expect(readRoomInviteCode('https://play.example/singedTerra/?join=ABC')).toBeNull();
    expect(readRoomInviteCode('https://play.example/singedTerra/?join=ABCDE')).toBeNull();
    expect(readRoomInviteCode('https://play.example/singedTerra/?join=AB-12')).toBeNull();
    expect(readRoomInviteCode('https://play.example/singedTerra/?join=')).toBeNull();
    expect(
      readRoomInviteCode('https://play.example/singedTerra/?join=AB12&join=CD34'),
    ).toBeNull();
    expect(readRoomInviteCode('https://play.example/singedTerra/?room=AB12')).toBeNull();
    expect(readRoomInviteCode('javascript:alert(1)?join=AB12')).toBeNull();
    expect(readRoomInviteCode('not a url')).toBeNull();
  });
});

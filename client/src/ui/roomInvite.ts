import { isValidRoomCode, normalizeRoomCode } from './lobbyValidation';

const ROOM_INVITE_PARAM = 'join';

function strictRoomCode(raw: string): string | null {
  const canonical = raw.trim().toUpperCase();
  const normalized = normalizeRoomCode(canonical);
  return normalized === canonical && isValidRoomCode(normalized) ? normalized : null;
}

/** Build a path-preserving invite that contains only the public room code. */
export function buildRoomInviteUrl(currentUrl: string, rawCode: string): string | null {
  const code = strictRoomCode(rawCode);
  if (!code) return null;
  try {
    const invite = new URL(currentUrl);
    if (invite.protocol !== 'http:' && invite.protocol !== 'https:') return null;
    invite.username = '';
    invite.password = '';
    invite.search = '';
    invite.hash = '';
    invite.searchParams.set(ROOM_INVITE_PARAM, code);
    return invite.toString();
  } catch {
    return null;
  }
}

/** Read a valid public room code from an invite URL; malformed input is inert. */
export function readRoomInviteCode(currentUrl: string): string | null {
  try {
    const invite = new URL(currentUrl);
    if (invite.protocol !== 'http:' && invite.protocol !== 'https:') return null;
    const values = invite.searchParams.getAll(ROOM_INVITE_PARAM);
    return values.length === 1 ? strictRoomCode(values[0] ?? '') : null;
  } catch {
    return null;
  }
}

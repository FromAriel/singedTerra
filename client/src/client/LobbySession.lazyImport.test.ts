import { describe, expect, it, vi } from 'vitest'
import type { NetworkPlayer } from './LobbyTransport'
import { LobbySession } from './LobbySession'
import { Lobby } from '../ui/Lobby'

const mockedSupabaseModule = vi.hoisted(() => {
  const evaluations = vi.fn()
  const removeChannel = vi.fn()
  const channel = vi.fn(() => {
    const captured = {
      on: vi.fn(),
      subscribe: vi.fn(),
    }
    captured.on.mockImplementation(() => captured)
    captured.subscribe.mockImplementation(() => captured)
    return captured
  })
  return { evaluations, channel, removeChannel }
})

vi.mock('../lib/supabase', () => {
  mockedSupabaseModule.evaluations()
  return {
    supabase: {
      channel: mockedSupabaseModule.channel,
      removeChannel: mockedSupabaseModule.removeChannel,
    },
  }
})

describe('LobbySession production Supabase loading', () => {
  it('does not evaluate Supabase during construction and loads it once on first subscribe', async () => {
    const transport = {
      heartbeat: vi.fn().mockResolvedValue({ ok: true, status: 200, data: null }),
      readyUp: vi.fn(),
      updatePlayer: vi.fn(),
      leaveRoom: vi.fn(),
    }
    const session = new LobbySession(transport as never, vi.fn())

    new Lobby(document.createElement('div'), vi.fn())

    expect(mockedSupabaseModule.evaluations).not.toHaveBeenCalled()
    expect(mockedSupabaseModule.channel).not.toHaveBeenCalled()

    session.replaceWaiting({
      roomId: 'room-1',
      roomCode: 'ABCD',
      playerId: 'p-1',
      token: 'tok-secret',
      players: [
        { id: 'p-1', name: 'Alice', color: '#e84d4d', ready: false },
      ] satisfies NetworkPlayer[],
      seed: 42,
      options: { maxPlayers: 2, maxWind: 10, gravity: 0.15 },
      thisPlayerReady: false,
    })

    await session.subscribeWaitingRoom()

    expect(mockedSupabaseModule.evaluations).toHaveBeenCalledTimes(1)
    expect(mockedSupabaseModule.channel).toHaveBeenCalledTimes(1)

    session.cleanupWaitingChannel()
    await session.subscribeWaitingRoom()

    expect(mockedSupabaseModule.evaluations).toHaveBeenCalledTimes(1)
    expect(mockedSupabaseModule.channel).toHaveBeenCalledTimes(2)

    session.cleanupWaitingChannel()
  })
})

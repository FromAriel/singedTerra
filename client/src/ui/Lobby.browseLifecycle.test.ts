import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LobbyTransport } from '../client/LobbyTransport'
import { Lobby } from './Lobby'

interface LobbyInternals {
  transport: LobbyTransport
  enterBrowse(): void
  leaveBrowse(to: 'create' | 'join' | 'browse' | 'waiting'): void
}

function internals(lobby: Lobby): LobbyInternals {
  return lobby as unknown as LobbyInternals
}

describe('Lobby browse polling lifecycle', () => {
  let root: HTMLDivElement
  let lobby: Lobby
  let listRooms: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    root = document.createElement('div')
    lobby = new Lobby(root, vi.fn())
    listRooms = vi.spyOn(internals(lobby).transport, 'listRooms')
      .mockResolvedValue({ ok: true, status: 200, data: { rooms: [] } })
  })

  afterEach(() => {
    lobby.hide()
    vi.useRealTimers()
  })

  it('fetches immediately, keeps the 3-second cadence, and stops when leaving browse', async () => {
    internals(lobby).enterBrowse()

    expect(listRooms).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(3_000)
    expect(listRooms).toHaveBeenCalledTimes(2)

    internals(lobby).leaveBrowse('create')
    expect(vi.getTimerCount()).toBe(0)

    await vi.advanceTimersByTimeAsync(9_000)
    expect(listRooms).toHaveBeenCalledTimes(2)
  })

  it('fetches immediately, keeps the 3-second cadence, and stops when hidden', async () => {
    internals(lobby).enterBrowse()

    expect(listRooms).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(3_000)
    expect(listRooms).toHaveBeenCalledTimes(2)

    lobby.hide()
    expect(vi.getTimerCount()).toBe(0)

    await vi.advanceTimersByTimeAsync(9_000)
    expect(listRooms).toHaveBeenCalledTimes(2)
  })
})

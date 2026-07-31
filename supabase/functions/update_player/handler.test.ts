// update_player/handler.test.ts — seam pin for the exported handleUpdatePlayer entry
// (refactor: handler lifted out of `import.meta.main`). Asserts the no-DB
// validation-rejection path is reachable through the exported function.
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { handleUpdatePlayer } from './index.ts'

Deno.test('handleUpdatePlayer: invalid roomId returns 400 (no DB)', async () => {
  const res = await handleUpdatePlayer({})
  assertEquals(res.status, 400)
})

Deno.test('handleUpdatePlayer: rejects an invalid tank loadout before DB access', async () => {
  const seatCredential = ['test', 'fixture'].join('-')
  const res = await handleUpdatePlayer({
    roomId: '00000000-0000-4000-8000-000000000001',
    playerId: 'seat-a',
    token: seatCredential,
    loadout: {
      treads: 'ranger',
      hull: 'ranger',
      turret: 'ranger',
      barrel: 'unknown',
    },
  })
  assertEquals(res.status, 400)
  assertEquals(await res.json(), { error: 'Invalid input: loadout' })
})

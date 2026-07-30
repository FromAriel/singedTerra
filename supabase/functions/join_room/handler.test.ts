// join_room/handler.test.ts — seam pin for the exported handleJoinRoom entry
// (refactor: handler lifted out of `import.meta.main`). Asserts the no-DB
// validation-rejection path is reachable through the exported function.
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { handleJoinRoom } from './index.ts'

Deno.test('handleJoinRoom: missing code returns 400 (no DB)', async () => {
  const res = await handleJoinRoom({})
  assertEquals(res.status, 400)
})

Deno.test('handleJoinRoom: rejects an over-posted tank loadout before DB access', async () => {
  const res = await handleJoinRoom({
    code: 'ABCD',
    playerName: 'Bo',
    color: '#4d8ce8',
    loadout: {
      treads: 'foundry',
      hull: 'foundry',
      turret: 'foundry',
      barrel: 'foundry',
      armor: 999,
    },
  })
  assertEquals(res.status, 400)
  assertEquals(await res.json(), { error: 'Invalid input: loadout' })
})

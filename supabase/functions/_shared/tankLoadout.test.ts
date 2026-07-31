import {
  DEFAULT_TANK_LOADOUT,
  parseTankLoadout,
} from './tankLoadout.ts'

Deno.test('parseTankLoadout accepts one complete allowlisted mix', () => {
  const input = {
    treads: 'jackal',
    hull: 'bulwark',
    turret: 'foundry',
    barrel: 'jackal',
  }

  const result = parseTankLoadout(input)

  if (result === null) throw new Error('expected valid loadout')
  if (result === input) throw new Error('parser must return a fresh bounded value')
  if (JSON.stringify(result) !== JSON.stringify(input)) {
    throw new Error(`unexpected normalized loadout: ${JSON.stringify(result)}`)
  }
})

Deno.test('parseTankLoadout rejects partial, unknown, and over-posted objects', () => {
  const rejected = [
    null,
    {},
    { treads: 'ranger' },
    {
      treads: 'foundry',
      hull: 'foundry',
      turret: 'foundry',
      barrel: 'prototype',
    },
    {
      treads: ['foundry'],
      hull: 'foundry',
      turret: 'foundry',
      barrel: 'foundry',
    },
    {
      ...DEFAULT_TANK_LOADOUT,
      stats: { armor: 999 },
    },
  ]

  for (const value of rejected) {
    if (parseTankLoadout(value) !== null) {
      throw new Error(`accepted invalid loadout: ${JSON.stringify(value)}`)
    }
  }
})

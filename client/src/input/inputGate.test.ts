import { describe, expect, it } from 'vitest';
import { isActiveSeatLocal, shouldAcceptLocalInput } from './inputGate';

describe('local input authority gate', () => {
  it.each([
    {
      name: 'local human turn',
      gate: { activeIsAi: false, activeIsLocal: true, paused: false },
      expected: true,
    },
    {
      name: 'paused local human turn',
      gate: { activeIsAi: false, activeIsLocal: true, paused: true },
      expected: false,
    },
    {
      name: 'CPU turn',
      gate: { activeIsAi: true, activeIsLocal: false, paused: false },
      expected: false,
    },
    {
      name: 'remote network turn',
      gate: { activeIsAi: false, activeIsLocal: false, paused: false },
      expected: false,
    },
  ])('$name => $expected', ({ gate, expected }) => {
    expect(shouldAcceptLocalInput(gate)).toBe(expected);
  });

  it('rejects a CPU independently even if the seat is locally hosted', () => {
    expect(shouldAcceptLocalInput({
      activeIsAi: true,
      activeIsLocal: true,
      paused: false,
    })).toBe(false);
  });

  it.each([
    ['hot-seat human', 'hotseat', 'p2', undefined, false, true],
    ['hot-seat CPU', 'hotseat', 'p2', undefined, true, false],
    ['local network human', 'network', 'p2', 'p2', false, true],
    ['remote network human', 'network', 'p2', 'p1', false, false],
  ] as const)(
    '%s ownership => %s',
    (_name, mode, activePlayerId, localPlayerId, activeIsAi, expected) => {
      expect(isActiveSeatLocal({
        mode,
        activePlayerId,
        localPlayerId,
        activeIsAi,
      })).toBe(expected);
    },
  );
});

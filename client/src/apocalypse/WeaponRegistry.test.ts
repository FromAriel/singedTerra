import { describe, expect, it } from 'vitest';
import { WEAPONS } from '@shared/engine/WeaponSystem';
import {
  WeaponRegistry,
  defineWeapon,
  defineWeaponPack,
} from '@shared/weapons/WeaponRegistry';
import {
  generateFullCatalog,
  generateRunCatalog,
  generateShelf,
} from '@shared/weapons/StoreCatalog';
import { weaponRegistry } from '@shared/weapons/registry';

describe('scalable weapon registry', () => {
  it('adapts every current WeaponSystem entry without changing legacy execution', () => {
    const legacyIds = Object.keys(WEAPONS).sort();
    expect(weaponRegistry.size).toBe(legacyIds.length);
    expect([...weaponRegistry.ids()].sort()).toEqual(legacyIds);

    for (const id of legacyIds) {
      const registered = weaponRegistry.require(id);
      expect(registered.execution.kind).toBe('legacy-core');
      if (registered.execution.kind === 'legacy-core') {
        expect(registered.execution.weaponType).toBe(id);
        expect(registered.execution.definition).toBe(WEAPONS[id as keyof typeof WEAPONS]);
      }
    }
  });

  it('accepts a future composed weapon without editing the legacy WeaponType union', () => {
    const registry = new WeaponRegistry();
    registry.registerPack(defineWeaponPack({
      id: 'firearms-001',
      version: 1,
      name: 'Conventional Firearms I',
      weapons: [defineWeapon({
        id: 'gun.service_pistol',
        schemaVersion: 1,
        name: 'Service Pistol',
        description: 'Low-power direct-fire kinetic weapon.',
        family: 'firearm',
        subfamily: 'pistol',
        tags: ['kinetic', 'direct-fire'],
        rarity: 'common',
        danger: 'conventional',
        store: {
          price: 350,
          bundleSize: 24,
          armsLevel: 0,
          weight: 100,
        },
        execution: {
          kind: 'composed',
          delivery: 'direct_fire',
          payload: 'kinetic',
          modifiers: ['light_recoil'],
        },
      })],
    }));

    expect(registry.require('gun.service_pistol').execution).toEqual({
      kind: 'composed',
      delivery: 'direct_fire',
      payload: 'kinetic',
      modifiers: ['light_recoil'],
    });
  });

  it('fails closed on duplicate IDs across packs', () => {
    const registry = new WeaponRegistry();
    const makePack = (id: string) => defineWeaponPack({
      id,
      version: 1,
      name: id,
      weapons: [defineWeapon({
        id: 'test.same_weapon',
        schemaVersion: 1,
        name: 'Same Weapon',
        description: 'Duplicate-ID guard fixture.',
        family: 'other',
        tags: ['test'],
        rarity: 'common',
        danger: 'conventional',
        store: { price: 1, bundleSize: 1, armsLevel: 0, weight: 1 },
        execution: { kind: 'composed', delivery: 'test', payload: 'test' },
      })],
    });

    registry.registerPack(makePack('pack-one'));
    expect(() => registry.registerPack(makePack('pack-two')))
      .toThrow(/duplicate weapon id/i);
  });
});

describe('scalable store catalog', () => {
  it('returns the complete eligible registry in stable order for the test bench', () => {
    const catalog = generateFullCatalog(weaponRegistry, {
      seed: 9001,
      armsLevel: 4,
      round: 1,
      includeHidden: true,
    });

    expect(catalog).toEqual([...weaponRegistry.ids()].sort());
  });

  it('generates a deterministic bounded run catalog and excludes hidden starter stock', () => {
    const options = { seed: 0x5eed, catalogSize: 7, armsLevel: 4, round: 1 } as const;
    const a = generateRunCatalog(weaponRegistry, options);
    const b = generateRunCatalog(weaponRegistry, options);

    expect(a).toEqual(b);
    expect(a).toHaveLength(7);
    expect(new Set(a).size).toBe(a.length);
    expect(a).not.toContain('baby_missile');
  });

  it('honors the arms-level gate before seeded selection', () => {
    const catalog = generateRunCatalog(weaponRegistry, {
      seed: 123,
      catalogSize: weaponRegistry.size,
      armsLevel: 0,
      round: 1,
    });

    for (const id of catalog) {
      expect(weaponRegistry.require(id).store.armsLevel).toBe(0);
    }
  });

  it('rotates a deterministic small shelf from a larger run catalog', () => {
    const runCatalog = generateRunCatalog(weaponRegistry, {
      seed: 42,
      catalogSize: 12,
      armsLevel: 4,
      round: 1,
    });
    const shelfA = generateShelf(runCatalog, { seed: 42, epoch: 0, shelfSize: 5 });
    const shelfB = generateShelf(runCatalog, { seed: 42, epoch: 0, shelfSize: 5 });

    expect(shelfA).toEqual(shelfB);
    expect(shelfA).toHaveLength(5);
    expect(new Set(shelfA).size).toBe(5);
    for (const id of shelfA) expect(runCatalog).toContain(id);
  });
});

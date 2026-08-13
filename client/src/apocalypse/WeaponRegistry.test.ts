import { describe, expect, it } from 'vitest';
import { WEAPONS } from '@shared/engine/WeaponSystem';
import { COMPOSABLE_CONTENT, getComposableContent } from '@shared/content/ComposableCatalog';
import { DIRECT_001_PACK } from '@shared/content/packs/direct-001';
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
  it('preserves every legacy adapter while allowing independently registered packs', () => {
    const legacyIds = Object.keys(WEAPONS).sort();
    const directIds = DIRECT_001_PACK.weapons.map((weapon) => weapon.id).sort();

    expect(weaponRegistry.size).toBe(legacyIds.length + directIds.length);
    expect([...weaponRegistry.ids()].sort()).toEqual([...legacyIds, ...directIds].sort());

    for (const id of legacyIds) {
      const registered = weaponRegistry.require(id);
      expect(registered.execution.kind).toBe('legacy-core');
      if (registered.execution.kind === 'legacy-core') {
        expect(registered.execution.weaponType).toBe(id);
        expect(registered.execution.definition).toBe(WEAPONS[id as keyof typeof WEAPONS]);
      }
    }
  });

  it('registers the first ten composed direct-content definitions without touching WeaponType', () => {
    expect(DIRECT_001_PACK.weapons).toHaveLength(10);
    expect(new Set(DIRECT_001_PACK.weapons.map((weapon) => weapon.id)).size).toBe(10);

    for (const definition of DIRECT_001_PACK.weapons) {
      const registered = weaponRegistry.require(definition.id);
      expect(registered).toBe(definition);
      expect(registered.execution.kind).toBe('composed');
      if (registered.execution.kind !== 'composed') continue;
      expect(registered.execution.delivery).toBe('direct_fire');
      expect(registered.execution.payload).toBe('kinetic');
      const profileId = registered.execution.modifiers?.[0];
      expect(profileId).toBeTypeOf('string');
      expect(getComposableContent(profileId!)).toBeDefined();
    }

    expect(COMPOSABLE_CONTENT.size).toBeGreaterThanOrEqual(10);
  });

  it('accepts an arbitrary composed item without editing the legacy union', () => {
    const registry = new WeaponRegistry();
    registry.registerPack(defineWeaponPack({
      id: 'fixture-pack',
      version: 1,
      name: 'Fixture Pack',
      weapons: [defineWeapon({
        id: 'fixture.composed_item',
        schemaVersion: 1,
        name: 'Composed Fixture',
        description: 'Test-only composed content.',
        family: 'other',
        tags: ['test', 'composed'],
        rarity: 'common',
        danger: 'conventional',
        store: { price: 1, bundleSize: 1, armsLevel: 0, weight: 1 },
        execution: {
          kind: 'composed',
          delivery: 'fixture_delivery',
          payload: 'fixture_payload',
          modifiers: ['fixture.profile'],
        },
      })],
    }));

    expect(registry.require('fixture.composed_item').execution).toEqual({
      kind: 'composed',
      delivery: 'fixture_delivery',
      payload: 'fixture_payload',
      modifiers: ['fixture.profile'],
    });
  });

  it('fails closed on duplicate IDs across packs', () => {
    const registry = new WeaponRegistry();
    const makePack = (id: string) => defineWeaponPack({
      id,
      version: 1,
      name: id,
      weapons: [defineWeapon({
        id: 'test.same_item',
        schemaVersion: 1,
        name: 'Same Item',
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

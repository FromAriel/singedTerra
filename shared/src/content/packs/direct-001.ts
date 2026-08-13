import { defineWeapon, defineWeaponPack } from '../../weapons/WeaponRegistry.ts';

function entry(id: string, name: string, description: string, price: number, bundleSize: number, armsLevel: number, rarity: 'common' | 'uncommon' | 'rare') {
  return defineWeapon({
    id,
    schemaVersion: 1,
    name,
    description,
    family: 'firearm',
    subfamily: 'direct-fire',
    tags: ['direct-fire', 'composed', 'kinetic'],
    rarity,
    danger: 'conventional',
    store: { price, bundleSize, armsLevel, weight: Math.max(20, 100 - armsLevel * 20) },
    execution: { kind: 'composed', delivery: 'direct_fire', payload: 'kinetic' },
  });
}

export const DIRECT_001_PACK = defineWeaponPack({
  id: 'direct-001',
  version: 1,
  name: 'Direct Fire I',
  weapons: [
    entry('direct.light_sidearm', 'Light Sidearm', 'Fast, light single-shot direct fire.', 300, 24, 0, 'common'),
    entry('direct.service_sidearm', 'Service Sidearm', 'Balanced single-shot direct fire.', 500, 20, 0, 'common'),
    entry('direct.heavy_sidearm', 'Heavy Sidearm', 'Slower, harder-hitting single-shot direct fire.', 900, 12, 1, 'uncommon'),
    entry('direct.repeater', 'Repeater', 'Short controlled burst with modest spread.', 1100, 10, 1, 'uncommon'),
    entry('direct.carbine', 'Carbine', 'Quick multi-shot burst for medium-range pressure.', 1400, 10, 1, 'uncommon'),
    entry('direct.battle_rifle', 'Battle Rifle', 'Tighter, heavier burst with lower shot count.', 1900, 8, 2, 'rare'),
    entry('direct.scattergun', 'Scattergun', 'A simultaneous close-range cone of small projectiles.', 1300, 8, 1, 'uncommon'),
    entry('direct.auto_scattergun', 'Auto Scattergun', 'A wider, denser cone for close-range chaos.', 2300, 6, 2, 'rare'),
    entry('direct.machine_gun', 'Machine Gun', 'Long sustained burst that walks across the battlefield.', 2600, 5, 2, 'rare'),
    entry('direct.volley_gun', 'Volley Gun', 'Many barrels release a simultaneous fan.', 3000, 4, 2, 'rare'),
  ],
});

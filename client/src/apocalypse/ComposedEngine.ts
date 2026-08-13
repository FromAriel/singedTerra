import '@shared/content/PlayableDirectBridge';
import { getComposableContent, type ComposableContentProfile } from '@shared/content/ComposableCatalog';
import type { GameEngine } from '@shared/engine/GameEngine';
import { PROJECTILE_DRAG, WIND_FACTOR } from '@shared/engine/Physics';
import type { ProjectileState, TankState } from '@shared/types/GameState';
import type { WeaponType } from '@shared/engine/WeaponSystem';
import { setUnlimitedAmmo } from '@shared/weapons/SparseInventory';
import { weaponRegistry } from '@shared/weapons/registry';
import type { WeaponId } from '@shared/weapons/WeaponRegistry';
import type { ApocalypseEngine } from './ApocalypseEngine';

export interface ComposedStreak {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface ComposedFxSnapshot {
  active: boolean;
  weaponId: WeaponId | null;
  color: string;
  style: ComposableContentProfile['style'] | null;
  flash: number;
  streaks: readonly ComposedStreak[];
}

function centeredOffsets(count: number, width: number): number[] {
  if (count <= 1) return [0];
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push(-width / 2 + (width * i) / (count - 1));
  }
  return result;
}

function emissionSpeed(profile: ComposableContentProfile, tank: TankState): number {
  const dial = tank.powerCap > 0 ? Math.max(0, Math.min(1, tank.power / tank.powerCap)) : 0;
  return profile.pace * (0.52 + dial * 0.62);
}

function makeProjectile(
  base: ProjectileState,
  weaponId: WeaponId,
  angleDeg: number,
  speed: number,
): ProjectileState {
  const theta = angleDeg * Math.PI / 180;
  return {
    ...base,
    vx: Math.cos(theta) * speed,
    vy: -Math.sin(theta) * speed,
    weaponType: weaponId as WeaponType,
    age: 0,
    hasSplit: true,
    bounces: 0,
    burrowTicksRemaining: undefined,
  };
}

export class ComposedEngine {
  private activeWeaponId: WeaponId | null = null;
  private activeProfile: ComposableContentProfile | null = null;
  private flash = 0;

  constructor(
    private readonly core: GameEngine,
    private readonly apocalypse: ApocalypseEngine,
    private readonly sandbox = true,
  ) {}

  isActive(): boolean {
    if (this.activeWeaponId === null) return false;
    const phase = this.core.getState().phase;
    return phase === 'FIRING' || phase === 'RESOLVING';
  }

  /** Keep composed direct-fire motion linear while the shared engine owns collisions. */
  prepareTick(): void {
    const weaponId = this.activeWeaponId;
    if (weaponId === null) return;
    const state = this.core.getState();
    if (state.phase !== 'FIRING') return;

    const retain = 1 - PROJECTILE_DRAG;
    if (!(retain > 0)) return;
    const gravity = this.core.getEffectiveGravity();
    const windKick = state.wind * WIND_FACTOR;

    for (const projectile of state.projectiles) {
      if ((projectile.weaponType as unknown as string) !== weaponId) continue;
      projectile.vx = projectile.vx / retain - windKick;
      projectile.vy = projectile.vy / retain - gravity;
    }
  }

  fire(weaponId: WeaponId): boolean {
    if (this.apocalypse.isSpecialActive() || this.isActive()) return false;
    const state = this.core.getState();
    if (state.phase !== 'PLAYER_TURN' || state.projectiles.length > 0) return false;

    const registered = weaponRegistry.get(weaponId);
    if (registered?.execution.kind !== 'composed') return false;
    if (registered.execution.delivery !== 'direct_fire' || registered.execution.payload !== 'kinetic') return false;

    const profileId = registered.execution.modifiers?.[0];
    const profile = profileId ? getComposableContent(profileId) : undefined;
    if (!profile) return false;

    const tank = state.tanks.find((candidate) => candidate.id === state.activePlayerId);
    if (!tank || !tank.alive || tank.buried) return false;
    if (this.sandbox) setUnlimitedAmmo(tank, weaponId, true);

    const selected = this.apocalypse.applyAction({
      type: 'select_weapon',
      weapon: weaponId as WeaponType,
    });
    if (!selected) return false;

    const committed = this.apocalypse.applyAction({ type: 'fire' });
    if (!committed) return false;

    const base = state.projectiles[0];
    if (!base) return false;

    const offsets = centeredOffsets(profile.copies, profile.arcWidth);
    const baseSpeed = emissionSpeed(profile, tank);
    const projectiles: ProjectileState[] = offsets.map((offset, index) => {
      const stagger = profile.style === 'pulse'
        ? Math.max(0.72, 1 - index * profile.spacingTicks * 0.012)
        : 1;
      return makeProjectile(base, weaponId, tank.angle + offset, baseSpeed * stagger);
    });

    state.projectiles = projectiles;
    state.projectile = projectiles[0] ?? null;
    this.activeWeaponId = weaponId;
    this.activeProfile = profile;
    this.flash = 1;
    return true;
  }

  observe(): void {
    this.flash *= 0.86;
    if (this.activeWeaponId === null) return;
    const phase = this.core.getState().phase;
    if (phase !== 'FIRING' && phase !== 'RESOLVING') {
      this.activeWeaponId = null;
      this.activeProfile = null;
    }
  }

  getFxSnapshot(): ComposedFxSnapshot {
    const state = this.core.getState();
    const active = this.isActive();
    const profile = active ? this.activeProfile : null;
    return {
      active,
      weaponId: active ? this.activeWeaponId : null,
      color: profile?.color ?? '#ffffff',
      style: profile?.style ?? null,
      flash: this.flash,
      streaks: active
        ? state.projectiles.map((projectile) => ({
            x: projectile.x,
            y: projectile.y,
            vx: projectile.vx,
            vy: projectile.vy,
          }))
        : [],
    };
  }
}

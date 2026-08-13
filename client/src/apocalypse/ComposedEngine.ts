import '@shared/content/PlayableDirectBridge';
import { getComposableContent, type ComposableContentProfile } from '@shared/content/ComposableCatalog';
import type { GameEngine } from '@shared/engine/GameEngine';
import { PROJECTILE_DRAG, WIND_FACTOR } from '@shared/engine/Physics';
import { CANVAS_WIDTH } from '@shared/engine/Terrain';
import type { ProjectileState, TankState, WallImpactEvent } from '@shared/types/GameState';
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
  emitted: number;
  total: number;
  streaks: readonly ComposedStreak[];
}

interface ScheduledEmission {
  releaseTick: number;
  projectile: ProjectileState;
}

const KEEPALIVE_Y = -1000;
const PACKET_GROUPS = 3;

function centeredOffsets(count: number, width: number): number[] {
  if (count <= 1 || width === 0) return Array.from({ length: Math.max(1, count) }, () => 0);
  return Array.from({ length: count }, (_, index) => (
    -width / 2 + (width * index) / (count - 1)
  ));
}

function emissionSpeed(profile: ComposableContentProfile, tank: TankState): number {
  const dial = tank.powerCap > 0 ? Math.max(0, Math.min(1, tank.power / tank.powerCap)) : 0;
  return profile.pace * (0.52 + dial * 0.62);
}

function emissionTick(profile: ComposableContentProfile, index: number): number {
  if (profile.copies <= 1 || profile.style === 'tap') return 0;
  const spacing = Math.max(1, profile.spacingTicks || 1);
  if (profile.style === 'pulse') return index * spacing;
  const groups = Math.min(PACKET_GROUPS, profile.copies);
  const groupSize = Math.ceil(profile.copies / groups);
  return Math.floor(index / groupSize) * spacing;
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

function nearestProjectile(
  projectiles: readonly ProjectileState[],
  event: WallImpactEvent,
  weaponId: string,
): ProjectileState | undefined {
  let best: ProjectileState | undefined;
  let bestDistance = Infinity;
  for (const projectile of projectiles) {
    if ((projectile.weaponType as unknown as string) !== weaponId) continue;
    const distance = Math.hypot(projectile.x - event.x, projectile.y - event.y);
    if (distance < bestDistance) {
      best = projectile;
      bestDistance = distance;
    }
  }
  return best;
}

export class ComposedEngine {
  private activeWeaponId: WeaponId | null = null;
  private activeProfile: ComposableContentProfile | null = null;
  private scheduled: ScheduledEmission[] = [];
  private sequenceTick = 0;
  private emitted = 0;
  private total = 0;
  private flash = 0;
  private keepalive: ProjectileState | null = null;
  private lastWallImpactId = 0;
  private readonly wallBounces = new WeakMap<ProjectileState, number>();

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

  prepareTick(): void {
    const weaponId = this.activeWeaponId;
    if (weaponId === null) return;
    const state = this.core.getState();
    if (state.phase !== 'FIRING') return;

    this.releaseDue();
    this.removeSecondWallCrossings();

    if (this.scheduled.length > 0) this.ensureKeepalive();
    if (state.projectiles.length === 0 && this.scheduled.length === 0) {
      this.addResolver();
    }

    const retain = 1 - PROJECTILE_DRAG;
    if (retain > 0) {
      const gravity = this.core.getEffectiveGravity();
      const windKick = state.wind * WIND_FACTOR;
      for (const projectile of state.projectiles) {
        if ((projectile.weaponType as unknown as string) !== weaponId) continue;
        projectile.vx = projectile.vx / retain - windKick;
        projectile.vy = projectile.vy / retain - gravity;
      }
    }

    state.projectile = state.projectiles[0] ?? null;
    this.sequenceTick += 1;
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
    if (!this.apocalypse.applyAction({ type: 'fire' })) return false;

    const base = state.projectiles[0];
    if (!base) return false;
    const speed = emissionSpeed(profile, tank);
    const offsets = profile.style === 'pulse' || profile.style === 'tap'
      ? Array.from({ length: profile.copies }, () => 0)
      : centeredOffsets(profile.copies, profile.arcWidth);

    this.scheduled = offsets.map((offset, index) => ({
      releaseTick: emissionTick(profile, index),
      projectile: makeProjectile(base, weaponId, tank.angle + offset, speed),
    }));

    state.projectiles = [];
    state.projectile = null;
    this.activeWeaponId = weaponId;
    this.activeProfile = profile;
    this.sequenceTick = 0;
    this.emitted = 0;
    this.total = this.scheduled.length;
    this.keepalive = null;
    this.lastWallImpactId = state.wallImpacts.reduce((max, event) => Math.max(max, event.id), 0);
    this.flash = 1;
    return true;
  }

  observe(): void {
    this.flash *= 0.76;
    const weaponId = this.activeWeaponId;
    if (weaponId === null) return;
    const state = this.core.getState();

    if (this.keepalive !== null) {
      state.projectiles = state.projectiles.filter((projectile) => projectile !== this.keepalive);
      state.projectile = state.projectiles[0] ?? null;
      this.keepalive = null;
    }

    for (const event of state.wallImpacts) {
      if (event.id <= this.lastWallImpactId) continue;
      const projectile = nearestProjectile(state.projectiles, event, weaponId);
      if (projectile) this.wallBounces.set(projectile, (this.wallBounces.get(projectile) ?? 0) + 1);
      this.lastWallImpactId = Math.max(this.lastWallImpactId, event.id);
    }

    const typedId = weaponId as WeaponType;
    state.explosions = state.explosions.filter((event) => event.weaponType !== typedId);
    if (state.lastExplosion?.weaponType === typedId) state.lastExplosion = null;

    const phase = state.phase;
    if (phase !== 'FIRING' && phase !== 'RESOLVING') {
      this.activeWeaponId = null;
      this.activeProfile = null;
      this.scheduled = [];
      this.keepalive = null;
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
      emitted: this.emitted,
      total: this.total,
      streaks: active
        ? state.projectiles
          .filter((projectile) => projectile !== this.keepalive)
          .map((projectile) => ({
            x: projectile.x,
            y: projectile.y,
            vx: projectile.vx,
            vy: projectile.vy,
          }))
        : [],
    };
  }

  private releaseDue(): void {
    const state = this.core.getState();
    let released = 0;
    while (this.scheduled.length > 0 && (this.scheduled[0]?.releaseTick ?? Infinity) <= this.sequenceTick) {
      const next = this.scheduled.shift();
      if (!next) break;
      state.projectiles.push(next.projectile);
      this.emitted += 1;
      released += 1;
    }
    if (released > 0) this.flash = 1;
  }

  private ensureKeepalive(): void {
    const weaponId = this.activeWeaponId;
    if (weaponId === null || this.keepalive !== null) return;
    const state = this.core.getState();
    const keeper: ProjectileState = {
      x: CANVAS_WIDTH / 2,
      y: KEEPALIVE_Y,
      vx: 0,
      vy: 0,
      weaponType: weaponId as WeaponType,
      age: 0,
      hasSplit: true,
      bounces: 0,
    };
    this.keepalive = keeper;
    state.projectiles.push(keeper);
  }

  private removeSecondWallCrossings(): void {
    const state = this.core.getState();
    state.projectiles = state.projectiles.filter((projectile) => {
      if (projectile === this.keepalive) return true;
      if ((this.wallBounces.get(projectile) ?? 0) < 1) return true;
      const nextX = projectile.x + projectile.vx;
      return nextX >= 0 && nextX < CANVAS_WIDTH;
    });
  }

  private addResolver(): void {
    const weaponId = this.activeWeaponId;
    if (weaponId === null) return;
    const state = this.core.getState();
    state.projectiles.push({
      x: -2,
      y: -2,
      vx: -1,
      vy: 0,
      weaponType: weaponId as WeaponType,
      age: 0,
      hasSplit: true,
      bounces: 0,
    });
  }
}

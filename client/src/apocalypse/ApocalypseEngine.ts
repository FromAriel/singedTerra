import { GameEngine } from '@shared/engine/GameEngine';
import {
  AIR_PIXEL,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  applyGravity,
  deform,
  pixelAt,
  surfaceAt,
} from '@shared/engine/Terrain';
import { BARREL_LENGTH, TANK_HEIGHT, TANK_WIDTH, barrelTip } from '@shared/engine/Tank';
import {
  GRAVITY,
  MAX_WIND,
  PROJECTILE_DRAG,
  WIND_FACTOR,
  launchVelocity,
} from '@shared/engine/Physics';
import { CREDITS_PER_DAMAGE, TURN_STIPEND } from '@shared/engine/WeaponSystem';
import type { GameState, TankState } from '@shared/types/GameState';
import type { PlayerAction } from '@shared/types/PlayerAction';

export type GodWeapon =
  | 'rift_lance'
  | 'singularity_seed'
  | 'skybreaker'
  | 'chrono_echo'
  | 'wormhole_pair'
  | 'planetcracker';

export interface GodWeaponDefinition {
  readonly type: GodWeapon;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly price: number;
  readonly bundleSize: number;
  readonly startingCharges: number;
  readonly danger: 'EXOTIC' | 'CATASTROPHIC' | 'EXTINCTION';
}

export const GOD_WEAPONS: Readonly<Record<GodWeapon, GodWeaponDefinition>> = {
  rift_lance: {
    type: 'rift_lance',
    name: 'Rift Lance',
    subtitle: 'Mountain-piercing spacetime shear',
    description: 'An instantaneous coherent tear that ignores terrain depth, slices a glowing corridor through the world, and flash-cooks anything intersecting the beam.',
    price: 9000,
    bundleSize: 1,
    startingCharges: 2,
    danger: 'EXOTIC',
  },
  singularity_seed: {
    type: 'singularity_seed',
    name: 'Singularity Seed',
    subtitle: 'Portable gravitational catastrophe',
    description: 'A ballistic seed blooms into a temporary gravity wound. Tanks crawl toward it, terrain is eaten inward, and the field ends in a violent collapse.',
    price: 18000,
    bundleSize: 1,
    startingCharges: 1,
    danger: 'CATASTROPHIC',
  },
  skybreaker: {
    type: 'skybreaker',
    name: 'Skybreaker',
    subtitle: 'Orbital solar-lance authorization',
    description: 'Ranges a target from your live firing solution, paints the ground, then punches a white-hot column from orbit through the entire world slice.',
    price: 22000,
    bundleSize: 1,
    startingCharges: 1,
    danger: 'CATASTROPHIC',
  },
  chrono_echo: {
    type: 'chrono_echo',
    name: 'Chrono Echo',
    subtitle: 'Fire the same mistake three times',
    description: 'The shell is replayed by its own future. Three temporally offset copies walk the same firing solution with tiny phase differences and independently scar the terrain.',
    price: 12000,
    bundleSize: 1,
    startingCharges: 2,
    danger: 'EXOTIC',
  },
  wormhole_pair: {
    type: 'wormhole_pair',
    name: 'Wormhole Pair',
    subtitle: 'Terrain is now negotiable',
    description: 'Opens linked portals at the ranged impact point and its antipode, then swaps circular chunks of geology—and any tanks caught inside them.',
    price: 16000,
    bundleSize: 1,
    startingCharges: 1,
    danger: 'EXOTIC',
  },
  planetcracker: {
    type: 'planetcracker',
    name: 'Planetcracker',
    subtitle: 'Kinetic spear / tectonic follow-through',
    description: 'Marks the ranged impact point, drops a hypersonic penetrator from above, drills deep below the surface, and propagates a subterranean fracture burst.',
    price: 28000,
    bundleSize: 1,
    startingCharges: 1,
    danger: 'EXTINCTION',
  },
};

export interface Vec2 {
  x: number;
  y: number;
}

interface ArcShot extends Vec2 {
  vx: number;
  vy: number;
  age: number;
  done: boolean;
  trail: Vec2[];
  phase: number;
}

interface ImpactMarker extends Vec2 {
  age: number;
  radius: number;
}

interface BaseSequence {
  id: number;
  shooterId: string;
  age: number;
}

export interface RiftSequence extends BaseSequence {
  type: 'rift_lance';
  origin: Vec2;
  end: Vec2;
  fired: boolean;
}

export interface SingularitySequence extends BaseSequence {
  type: 'singularity_seed';
  stage: 'flight' | 'field' | 'afterglow';
  projectile: ArcShot;
  center: Vec2 | null;
  fieldAge: number;
  collapsed: boolean;
}

export interface SkybreakerSequence extends BaseSequence {
  type: 'skybreaker';
  target: Vec2;
  struck: boolean;
}

export interface ChronoSequence extends BaseSequence {
  type: 'chrono_echo';
  origin: Vec2;
  shots: ArcShot[];
  spawned: number;
  impacts: ImpactMarker[];
}

export interface WormholeSequence extends BaseSequence {
  type: 'wormhole_pair';
  a: Vec2;
  b: Vec2;
  swapped: boolean;
}

export interface PlanetcrackerSequence extends BaseSequence {
  type: 'planetcracker';
  target: Vec2;
  spearY: number;
  stage: 'warning' | 'drop' | 'drill' | 'aftershock';
  drillTicks: number;
  struck: boolean;
  impactY: number;
}

export type ApocalypseSequence =
  | RiftSequence
  | SingularitySequence
  | SkybreakerSequence
  | ChronoSequence
  | WormholeSequence
  | PlanetcrackerSequence;

export interface ApocalypseLogEntry {
  tick: number;
  turn: number;
  tankId: string;
  kind: 'core_action' | 'god_fire' | 'god_buy';
  action?: PlayerAction;
  weapon?: GodWeapon;
}

export interface ApocalypseFxSnapshot {
  tick: number;
  sequence: ApocalypseSequence | null;
  flash: number;
  pulse: number;
  message: string;
  messageAge: number;
}

const SPECIAL_WIND_DRIFT = 2.5;
const SPECIAL_MAX_FLIGHT = 300;
const RIFT_RADIUS = 5;
const PORTAL_RADIUS = 52;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointSegmentDistance(point: Vec2, a: Vec2, b: Vec2): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const denom = abx * abx + aby * aby;
  if (denom <= 0.0001) return distance(point, a);
  const t = clamp(((point.x - a.x) * abx + (point.y - a.y) * aby) / denom, 0, 1);
  return Math.hypot(point.x - (a.x + abx * t), point.y - (a.y + aby * t));
}

function tankCenter(tank: TankState): Vec2 {
  return { x: tank.x, y: tank.y - TANK_HEIGHT * 0.75 };
}

function uintHash(value: number): number {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function seeded01(seed: number): number {
  return uintHash(seed) / 0x1_0000_0000;
}

function makeChargeRecord(): Record<GodWeapon, number> {
  return {
    rift_lance: GOD_WEAPONS.rift_lance.startingCharges,
    singularity_seed: GOD_WEAPONS.singularity_seed.startingCharges,
    skybreaker: GOD_WEAPONS.skybreaker.startingCharges,
    chrono_echo: GOD_WEAPONS.chrono_echo.startingCharges,
    wormhole_pair: GOD_WEAPONS.wormhole_pair.startingCharges,
    planetcracker: GOD_WEAPONS.planetcracker.startingCharges,
  };
}

/**
 * ApocalypseEngine is a deterministic sidecar around singedTerra's production
 * GameEngine. Canonical weapons still run through GameEngine untouched. Exotic
 * weapons resolve here against the SAME live GameState terrain/tanks, then hand
 * control back to the normal engine on the next turn.
 *
 * This preserves the upstream engine's replay contract for the original mode
 * while giving Apocalypse Mode a deliberately separate ruleset boundary.
 */
export class ApocalypseEngine {
  readonly core: GameEngine;
  readonly seed: number;
  readonly actionLog: ApocalypseLogEntry[] = [];

  private readonly charges = new Map<string, Record<GodWeapon, number>>();
  private sequence: ApocalypseSequence | null = null;
  private tickCount = 0;
  private sequenceId = 0;
  private shotDamage = 0;
  private touchedMinX = CANVAS_WIDTH;
  private touchedMaxX = -1;
  private flash = 0;
  private pulse = 0;
  private message = 'APOCALYPSE SYSTEMS ARMED';
  private messageAge = 0;
  private windStep = 0;

  constructor(core: GameEngine, seed: number) {
    this.core = core;
    this.seed = seed >>> 0;
    for (const tank of core.getState().tanks) {
      this.charges.set(tank.id, makeChargeRecord());
    }
  }

  getState(): GameState {
    return this.core.getState();
  }

  getFxSnapshot(): ApocalypseFxSnapshot {
    return {
      tick: this.tickCount,
      sequence: this.sequence,
      flash: this.flash,
      pulse: this.pulse,
      message: this.message,
      messageAge: this.messageAge,
    };
  }

  getCharges(tankId: string): Readonly<Record<GodWeapon, number>> {
    return this.ensureCharges(tankId);
  }

  isSpecialActive(): boolean {
    return this.sequence !== null;
  }

  applyAction(action: PlayerAction): boolean {
    if (this.sequence !== null) return false;
    const state = this.core.getState();
    const tankId = state.activePlayerId;
    const accepted = this.core.applyAction(action);
    if (accepted) {
      this.actionLog.push({
        tick: this.tickCount,
        turn: state.turn,
        tankId,
        kind: 'core_action',
        action: structuredClone(action),
      });
    }
    return accepted;
  }

  buySpecial(weapon: GodWeapon): boolean {
    if (this.sequence !== null) return false;
    const state = this.core.getState();
    if (state.phase !== 'PLAYER_TURN') return false;
    const tank = state.tanks.find((candidate) => candidate.id === state.activePlayerId);
    if (!tank) return false;
    const def = GOD_WEAPONS[weapon];
    if (tank.credits < def.price) {
      this.announce('INSUFFICIENT WAR CRIMES BUDGET');
      return false;
    }
    tank.credits -= def.price;
    const inventory = this.ensureCharges(tank.id);
    inventory[weapon] += def.bundleSize;
    this.actionLog.push({
      tick: this.tickCount,
      turn: state.turn,
      tankId: tank.id,
      kind: 'god_buy',
      weapon,
    });
    this.announce(`${def.name.toUpperCase()} REARMED`);
    return true;
  }

  fireSpecial(weapon: GodWeapon): boolean {
    if (this.sequence !== null) return false;
    const state = this.core.getState();
    if (state.phase !== 'PLAYER_TURN' || state.projectiles.length > 0) return false;
    const shooter = state.tanks.find((candidate) => candidate.id === state.activePlayerId);
    if (!shooter || !shooter.alive || shooter.buried) return false;

    const inventory = this.ensureCharges(shooter.id);
    if (inventory[weapon] <= 0) {
      this.announce(`${GOD_WEAPONS[weapon].name.toUpperCase()} EMPTY — REARM REQUIRED`);
      return false;
    }

    inventory[weapon]--;
    this.shotDamage = 0;
    this.touchedMinX = CANVAS_WIDTH;
    this.touchedMaxX = -1;
    state.phase = 'FIRING';
    state.explosions = [];
    state.lastExplosion = null;
    this.flash = 0.3;
    this.pulse = 1;
    const id = ++this.sequenceId;
    const origin = barrelTip(shooter, BARREL_LENGTH);

    switch (weapon) {
      case 'rift_lance': {
        const theta = (shooter.angle * Math.PI) / 180;
        const direction = { x: Math.cos(theta), y: -Math.sin(theta) };
        this.sequence = {
          type: 'rift_lance',
          id,
          shooterId: shooter.id,
          age: 0,
          origin,
          end: this.rayToBoundary(origin, direction),
          fired: false,
        };
        break;
      }
      case 'singularity_seed': {
        this.sequence = {
          type: 'singularity_seed',
          id,
          shooterId: shooter.id,
          age: 0,
          stage: 'flight',
          projectile: this.makeArcShot(shooter, 1, 0),
          center: null,
          fieldAge: 0,
          collapsed: false,
        };
        break;
      }
      case 'skybreaker': {
        this.sequence = {
          type: 'skybreaker',
          id,
          shooterId: shooter.id,
          age: 0,
          target: this.predictImpact(shooter),
          struck: false,
        };
        break;
      }
      case 'chrono_echo': {
        this.sequence = {
          type: 'chrono_echo',
          id,
          shooterId: shooter.id,
          age: 0,
          origin,
          shots: [],
          spawned: 0,
          impacts: [],
        };
        break;
      }
      case 'wormhole_pair': {
        const a = this.predictImpact(shooter);
        const bx = clamp(CANVAS_WIDTH - a.x, PORTAL_RADIUS + 4, CANVAS_WIDTH - PORTAL_RADIUS - 4);
        const b = { x: bx, y: surfaceAt(state.terrain, bx) - 10 };
        this.sequence = {
          type: 'wormhole_pair',
          id,
          shooterId: shooter.id,
          age: 0,
          a,
          b,
          swapped: false,
        };
        break;
      }
      case 'planetcracker': {
        const target = this.predictImpact(shooter);
        this.sequence = {
          type: 'planetcracker',
          id,
          shooterId: shooter.id,
          age: 0,
          target,
          spearY: -80,
          stage: 'warning',
          drillTicks: 0,
          struck: false,
          impactY: target.y,
        };
        break;
      }
    }

    this.actionLog.push({
      tick: this.tickCount,
      turn: state.turn,
      tankId: shooter.id,
      kind: 'god_fire',
      weapon,
    });
    this.announce(`${GOD_WEAPONS[weapon].name.toUpperCase()} // COMMIT`);
    return true;
  }

  tick(): void {
    this.tickCount++;
    this.flash *= 0.9;
    this.pulse *= 0.96;
    this.messageAge++;

    const active = this.sequence;
    if (active === null) {
      this.core.tick();
      return;
    }

    active.age++;
    switch (active.type) {
      case 'rift_lance':
        this.tickRift(active);
        break;
      case 'singularity_seed':
        this.tickSingularity(active);
        break;
      case 'skybreaker':
        this.tickSkybreaker(active);
        break;
      case 'chrono_echo':
        this.tickChrono(active);
        break;
      case 'wormhole_pair':
        this.tickWormhole(active);
        break;
      case 'planetcracker':
        this.tickPlanetcracker(active);
        break;
    }
  }

  exportReplay(): string {
    return JSON.stringify({
      format: 'singedTerra-apocalypse-replay',
      version: 1,
      seed: this.seed,
      actions: this.actionLog,
    }, null, 2);
  }

  private tickRift(seq: RiftSequence): void {
    if (!seq.fired && seq.age >= 7) {
      seq.fired = true;
      this.cutRift(seq.origin, seq.end, seq.shooterId);
      this.flash = 1;
      this.pulse = 1;
      this.announce('LOCAL SPACETIME HAS BEEN DISCONTINUED');
    }
    if (seq.age >= 74) this.completeSpecial();
  }

  private tickSingularity(seq: SingularitySequence): void {
    if (seq.stage === 'flight') {
      const hit = this.stepArc(seq.projectile, seq.shooterId);
      if (hit !== null || seq.projectile.age >= SPECIAL_MAX_FLIGHT) {
        seq.center = hit ?? {
          x: clamp(seq.projectile.x, 10, CANVAS_WIDTH - 10),
          y: clamp(seq.projectile.y, 10, CANVAS_HEIGHT - 10),
        };
        seq.stage = 'field';
        seq.fieldAge = 0;
        this.flash = 0.45;
        this.pulse = 1;
        this.announce('GRAVITY WELL ESTABLISHED');
      }
      return;
    }

    if (seq.stage === 'field' && seq.center) {
      seq.fieldAge++;
      this.pullTowardSingularity(seq.center, seq.shooterId, seq.fieldAge);
      if (seq.fieldAge % 9 === 0) {
        const biteRadius = 8 + Math.min(26, seq.fieldAge * 0.16);
        const bounds = deform(this.getState().terrain, seq.center.x, seq.center.y, biteRadius, false);
        this.markTerrain(bounds);
        this.getState().terrainVersion++;
      }
      if (seq.fieldAge >= 118 && !seq.collapsed) {
        seq.collapsed = true;
        this.radialBlast(seq.center, 86, 108, seq.shooterId);
        const bounds = deform(this.getState().terrain, seq.center.x, seq.center.y, 72, false);
        this.markTerrain(bounds);
        this.settleTouchedTerrain();
        seq.stage = 'afterglow';
        this.flash = 1;
        this.pulse = 1;
        this.announce('SINGULARITY EVAPORATED // BADLY');
      }
      return;
    }

    if (seq.stage === 'afterglow' && seq.age >= 220) this.completeSpecial();
  }

  private tickSkybreaker(seq: SkybreakerSequence): void {
    if (!seq.struck && seq.age >= 48) {
      seq.struck = true;
      const state = this.getState();
      const x = Math.round(seq.target.x);
      const halfWidth = 9;
      for (let px = x - halfWidth; px <= x + halfWidth; px++) {
        if (px < 0 || px >= CANVAS_WIDTH) continue;
        for (let y = 0; y < CANVAS_HEIGHT; y++) {
          if (Math.abs(px - x) <= halfWidth) state.terrain[y * CANVAS_WIDTH + px] = AIR_PIXEL;
        }
      }
      this.markTerrain({ xStart: x - halfWidth, xEnd: x + halfWidth });
      const blastPoint = { x: seq.target.x, y: clamp(seq.target.y + 18, 0, CANVAS_HEIGHT - 1) };
      this.radialBlast(blastPoint, 72, 104, seq.shooterId);
      const crater = deform(state.terrain, blastPoint.x, blastPoint.y, 58, false);
      this.markTerrain(crater);
      state.terrainVersion++;
      this.settleTouchedTerrain();
      this.flash = 1;
      this.pulse = 1;
      this.announce('ORBITAL ASSET REPORTS SATISFACTION');
    }
    if (seq.age >= 126) this.completeSpecial();
  }

  private tickChrono(seq: ChronoSequence): void {
    const shooter = this.getState().tanks.find((tank) => tank.id === seq.shooterId);
    if (!shooter) {
      this.completeSpecial();
      return;
    }

    const spawnFrames = [1, 24, 47] as const;
    const multipliers = [0.965, 1, 1.035] as const;
    while (seq.spawned < spawnFrames.length && seq.age >= (spawnFrames[seq.spawned] ?? Infinity)) {
      const phase = seq.spawned - 1;
      seq.shots.push(this.makeArcShot(shooter, multipliers[seq.spawned] ?? 1, phase));
      seq.spawned++;
      this.pulse = 0.75;
    }

    for (const shot of seq.shots) {
      if (shot.done) continue;
      const hit = this.stepArc(shot, seq.shooterId);
      if (hit) {
        shot.done = true;
        seq.impacts.push({ ...hit, age: 0, radius: 32 });
        this.radialBlast(hit, 42, 58, seq.shooterId);
        const bounds = deform(this.getState().terrain, hit.x, hit.y, 30, false);
        this.markTerrain(bounds);
        this.getState().terrainVersion++;
        this.flash = Math.max(this.flash, 0.5);
      }
    }
    for (const impact of seq.impacts) impact.age++;

    const allDone = seq.spawned === 3 && seq.shots.every((shot) => shot.done);
    if (allDone && seq.age >= 92) {
      this.settleTouchedTerrain();
      if (seq.age >= 145) this.completeSpecial();
    } else if (seq.age >= 300) {
      this.settleTouchedTerrain();
      this.completeSpecial();
    }
  }

  private tickWormhole(seq: WormholeSequence): void {
    if (!seq.swapped && seq.age >= 48) {
      seq.swapped = true;
      this.swapTerrainDiscs(seq.a, seq.b, PORTAL_RADIUS);
      this.swapPortalTanks(seq.a, seq.b, PORTAL_RADIUS * 0.92);
      this.radialBlast(seq.a, 18, 22, seq.shooterId);
      this.radialBlast(seq.b, 18, 22, seq.shooterId);
      this.settleTouchedTerrain();
      this.flash = 0.8;
      this.pulse = 1;
      this.announce('GEOGRAPHY PATCH APPLIED WITHOUT CONSENT');
    }
    if (seq.age >= 126) this.completeSpecial();
  }

  private tickPlanetcracker(seq: PlanetcrackerSequence): void {
    if (seq.stage === 'warning') {
      if (seq.age >= 36) seq.stage = 'drop';
      return;
    }

    if (seq.stage === 'drop') {
      seq.spearY += 31;
      const sampleY = clamp(Math.round(seq.spearY), 0, CANVAS_HEIGHT - 1);
      if (seq.spearY >= 0 && pixelAt(this.getState().terrain, Math.round(seq.target.x), sampleY) > AIR_PIXEL) {
        seq.stage = 'drill';
        seq.impactY = sampleY;
        this.flash = 0.65;
        this.pulse = 1;
      } else if (seq.spearY >= CANVAS_HEIGHT - 1) {
        seq.stage = 'drill';
        seq.impactY = CANVAS_HEIGHT - 20;
      }
      return;
    }

    if (seq.stage === 'drill') {
      seq.drillTicks++;
      seq.impactY = clamp(seq.impactY + 7.5, 0, CANVAS_HEIGHT - 4);
      const bounds = deform(this.getState().terrain, seq.target.x, seq.impactY, 7, false);
      this.markTerrain(bounds);
      this.getState().terrainVersion++;
      if (seq.drillTicks >= 34 || seq.impactY >= CANVAS_HEIGHT - 8) {
        seq.stage = 'aftershock';
        if (!seq.struck) {
          seq.struck = true;
          this.planetcrackerBurst({ x: seq.target.x, y: seq.impactY }, seq.shooterId);
          this.settleTouchedTerrain();
          this.flash = 1;
          this.pulse = 1;
          this.announce('TECTONIC WARRANTY VOIDED');
        }
      }
      return;
    }

    if (seq.stage === 'aftershock' && seq.age >= 172) this.completeSpecial();
  }

  private makeArcShot(shooter: TankState, powerMultiplier: number, phase: number): ArcShot {
    const tip = barrelTip(shooter, BARREL_LENGTH);
    const velocity = launchVelocity(shooter.angle, shooter.power * powerMultiplier);
    return {
      x: tip.x,
      y: tip.y,
      vx: velocity.vx,
      vy: velocity.vy,
      age: 0,
      done: false,
      trail: [{ x: tip.x, y: tip.y }],
      phase,
    };
  }

  private stepArc(shot: ArcShot, shooterId: string): Vec2 | null {
    if (shot.done) return null;
    const prev = { x: shot.x, y: shot.y };
    shot.vy += GRAVITY;
    shot.vx += this.getState().wind * WIND_FACTOR;
    shot.vx *= 1 - PROJECTILE_DRAG;
    shot.vy *= 1 - PROJECTILE_DRAG;
    shot.x += shot.vx;
    shot.y += shot.vy;
    shot.age++;

    const hit = this.sweepSpecialCollision(prev, shot, shooterId, shot.age < 4);
    shot.trail.push({ x: shot.x, y: shot.y });
    if (shot.trail.length > 70) shot.trail.shift();

    if (hit) {
      shot.x = hit.x;
      shot.y = hit.y;
      shot.done = true;
      return hit;
    }
    if (shot.x < -20 || shot.x > CANVAS_WIDTH + 20 || shot.y > CANVAS_HEIGHT + 20 || shot.age >= SPECIAL_MAX_FLIGHT) {
      shot.done = true;
      return {
        x: clamp(shot.x, 0, CANVAS_WIDTH - 1),
        y: clamp(shot.y, 0, CANVAS_HEIGHT - 1),
      };
    }
    return null;
  }

  private sweepSpecialCollision(prev: Vec2, next: Vec2, shooterId: string, ignoreShooter: boolean): Vec2 | null {
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy)));
    const state = this.getState();
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = prev.x + dx * t;
      const y = prev.y + dy * t;
      if (x < 0 || x >= CANVAS_WIDTH || y >= CANVAS_HEIGHT) return { x: clamp(x, 0, CANVAS_WIDTH - 1), y: clamp(y, 0, CANVAS_HEIGHT - 1) };
      if (y >= 0 && pixelAt(state.terrain, Math.floor(x), Math.floor(y)) > AIR_PIXEL) return { x, y };
      for (const tank of state.tanks) {
        if (!tank.alive) continue;
        if (ignoreShooter && tank.id === shooterId) continue;
        const withinX = Math.abs(x - tank.x) <= TANK_WIDTH * 0.58;
        const withinY = y >= tank.y - TANK_HEIGHT - 13 && y <= tank.y + 2;
        if (withinX && withinY) return { x, y };
      }
    }
    return null;
  }

  private predictImpact(shooter: TankState): Vec2 {
    const ghost = this.makeArcShot(shooter, 1, 0);
    for (let i = 0; i < SPECIAL_MAX_FLIGHT; i++) {
      const hit = this.stepArcPrediction(ghost);
      if (hit) return hit;
    }
    const x = clamp(ghost.x, 0, CANVAS_WIDTH - 1);
    return { x, y: surfaceAt(this.getState().terrain, x) };
  }

  private stepArcPrediction(shot: ArcShot): Vec2 | null {
    const prev = { x: shot.x, y: shot.y };
    shot.vy += GRAVITY;
    shot.vx += this.getState().wind * WIND_FACTOR;
    shot.vx *= 1 - PROJECTILE_DRAG;
    shot.vy *= 1 - PROJECTILE_DRAG;
    shot.x += shot.vx;
    shot.y += shot.vy;
    shot.age++;
    const dx = shot.x - prev.x;
    const dy = shot.y - prev.y;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = prev.x + dx * t;
      const y = prev.y + dy * t;
      if (x < 0 || x >= CANVAS_WIDTH || y >= CANVAS_HEIGHT) {
        const bx = clamp(x, 0, CANVAS_WIDTH - 1);
        return { x: bx, y: surfaceAt(this.getState().terrain, bx) };
      }
      if (y >= 0 && pixelAt(this.getState().terrain, Math.floor(x), Math.floor(y)) > AIR_PIXEL) return { x, y };
    }
    return null;
  }

  private rayToBoundary(origin: Vec2, direction: Vec2): Vec2 {
    const candidates: number[] = [];
    if (Math.abs(direction.x) > 0.00001) {
      candidates.push((0 - origin.x) / direction.x, (CANVAS_WIDTH - origin.x) / direction.x);
    }
    if (Math.abs(direction.y) > 0.00001) {
      candidates.push((0 - origin.y) / direction.y, (CANVAS_HEIGHT - origin.y) / direction.y);
    }
    const positive = candidates.filter((value) => value > 0.01);
    const t = positive.length > 0 ? Math.min(...positive) : CANVAS_WIDTH;
    return {
      x: clamp(origin.x + direction.x * t, 0, CANVAS_WIDTH),
      y: clamp(origin.y + direction.y * t, 0, CANVAS_HEIGHT),
    };
  }

  private cutRift(origin: Vec2, end: Vec2, shooterId: string): void {
    const state = this.getState();
    const length = distance(origin, end);
    const steps = Math.max(1, Math.ceil(length / 2));
    let minX = CANVAS_WIDTH;
    let maxX = -1;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = origin.x + (end.x - origin.x) * t;
      const y = origin.y + (end.y - origin.y) * t;
      const bounds = deform(state.terrain, x, y, RIFT_RADIUS, false);
      if (bounds) {
        minX = Math.min(minX, bounds.xStart);
        maxX = Math.max(maxX, bounds.xEnd);
      }
    }
    if (maxX >= minX) this.markTerrain({ xStart: minX, xEnd: maxX });
    state.terrainVersion++;

    for (const tank of state.tanks) {
      if (!tank.alive) continue;
      const d = pointSegmentDistance(tankCenter(tank), origin, end);
      if (d <= 19) this.applyDamage(tank, 92 * (1 - d / 28), shooterId);
    }
    this.settleTouchedTerrain();
  }

  private pullTowardSingularity(center: Vec2, shooterId: string, fieldAge: number): void {
    const state = this.getState();
    for (const tank of state.tanks) {
      if (!tank.alive) continue;
      const c = tankCenter(tank);
      const d = distance(c, center);
      if (d >= 260) continue;
      const strength = Math.max(0, 1 - d / 260);
      const dx = center.x - tank.x;
      tank.x = clamp(tank.x + Math.sign(dx) * Math.min(Math.abs(dx), 0.35 + strength * 1.35), TANK_WIDTH, CANVAS_WIDTH - TANK_WIDTH);
      tank.y = surfaceAt(state.terrain, tank.x);
      if (fieldAge % 4 === 0 && d < 170) {
        this.applyDamage(tank, 0.45 + strength * 1.15, shooterId);
      }
    }
  }

  private radialBlast(center: Vec2, radius: number, maxDamage: number, shooterId: string): void {
    for (const tank of this.getState().tanks) {
      if (!tank.alive) continue;
      const d = distance(tankCenter(tank), center);
      if (d > radius) continue;
      const factor = 1 - d / radius;
      this.applyDamage(tank, maxDamage * factor * factor, shooterId);
    }
  }

  private applyDamage(tank: TankState, rawDamage: number, shooterId: string): void {
    if (!tank.alive || rawDamage <= 0) return;
    let incoming = Math.max(0, rawDamage);
    if (tank.shieldHp > 0) {
      const blocked = Math.min(tank.shieldHp, incoming);
      tank.shieldHp -= blocked;
      incoming -= blocked;
    }
    if (incoming <= 0) return;

    const before = tank.health;
    tank.health = Math.max(0, tank.health - incoming);
    const effective = before - tank.health;
    const shooter = this.getState().tanks.find((candidate) => candidate.id === shooterId);
    if (shooter && tank.id !== shooterId && effective > 0) {
      this.shotDamage += effective;
      shooter.totalDamage += effective;
    }
    if (tank.health <= 0 && tank.alive) {
      tank.alive = false;
      if (shooter && shooter.id !== tank.id) shooter.kills += 1;
    }
  }

  private planetcrackerBurst(center: Vec2, shooterId: string): void {
    const state = this.getState();
    this.radialBlast(center, 125, 132, shooterId);
    const core = deform(state.terrain, center.x, center.y, 92, false);
    this.markTerrain(core);
    for (const direction of [-1, 1] as const) {
      for (let step = 1; step <= 5; step++) {
        const x = center.x + direction * step * 42;
        const y = center.y - step * 3;
        const fracture = deform(state.terrain, x, y, 18 + step * 1.5, false);
        this.markTerrain(fracture);
      }
    }
    state.terrainVersion++;
  }

  private swapTerrainDiscs(a: Vec2, b: Vec2, radius: number): void {
    const state = this.getState();
    const terrain = state.terrain;
    const diameter = Math.ceil(radius * 2) + 1;
    const snapshotA = new Uint8Array(diameter * diameter);
    const snapshotB = new Uint8Array(diameter * diameter);
    const start = -Math.ceil(radius);
    const r2 = radius * radius;

    for (let oy = start; oy <= -start; oy++) {
      for (let ox = start; ox <= -start; ox++) {
        if (ox * ox + oy * oy > r2) continue;
        const ix = ox - start;
        const iy = oy - start;
        const index = iy * diameter + ix;
        snapshotA[index] = pixelAt(terrain, Math.round(a.x + ox), Math.round(a.y + oy));
        snapshotB[index] = pixelAt(terrain, Math.round(b.x + ox), Math.round(b.y + oy));
      }
    }

    const paint = (center: Vec2, pixels: Uint8Array): void => {
      for (let oy = start; oy <= -start; oy++) {
        for (let ox = start; ox <= -start; ox++) {
          if (ox * ox + oy * oy > r2) continue;
          const x = Math.round(center.x + ox);
          const y = Math.round(center.y + oy);
          if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) continue;
          const ix = ox - start;
          const iy = oy - start;
          const index = iy * diameter + ix;
          terrain[y * CANVAS_WIDTH + x] = pixels[index] ?? AIR_PIXEL;
        }
      }
    };

    paint(a, snapshotB);
    paint(b, snapshotA);
    this.markTerrain({ xStart: Math.floor(a.x - radius), xEnd: Math.ceil(a.x + radius) });
    this.markTerrain({ xStart: Math.floor(b.x - radius), xEnd: Math.ceil(b.x + radius) });
    state.terrainVersion++;
  }

  private swapPortalTanks(a: Vec2, b: Vec2, radius: number): void {
    const state = this.getState();
    const inA = state.tanks.filter((tank) => tank.alive && distance(tankCenter(tank), a) <= radius);
    const inB = state.tanks.filter((tank) => tank.alive && distance(tankCenter(tank), b) <= radius);
    for (const tank of inA) {
      const dx = tank.x - a.x;
      tank.x = clamp(b.x + dx, TANK_WIDTH, CANVAS_WIDTH - TANK_WIDTH);
      tank.y = surfaceAt(state.terrain, tank.x);
    }
    for (const tank of inB) {
      const dx = tank.x - b.x;
      tank.x = clamp(a.x + dx, TANK_WIDTH, CANVAS_WIDTH - TANK_WIDTH);
      tank.y = surfaceAt(state.terrain, tank.x);
    }
  }

  private markTerrain(bounds: { xStart: number; xEnd: number } | null): void {
    if (!bounds) return;
    this.touchedMinX = Math.min(this.touchedMinX, clamp(Math.floor(bounds.xStart), 0, CANVAS_WIDTH - 1));
    this.touchedMaxX = Math.max(this.touchedMaxX, clamp(Math.ceil(bounds.xEnd), 0, CANVAS_WIDTH - 1));
  }

  private settleTouchedTerrain(): void {
    if (this.touchedMaxX < this.touchedMinX) return;
    const state = this.getState();
    applyGravity(state.terrain, this.touchedMinX, this.touchedMaxX);
    state.terrainVersion++;
    for (const tank of state.tanks) {
      if (!tank.alive) continue;
      tank.x = clamp(tank.x, TANK_WIDTH, CANVAS_WIDTH - TANK_WIDTH);
      tank.y = surfaceAt(state.terrain, tank.x);
    }
    this.touchedMinX = CANVAS_WIDTH;
    this.touchedMaxX = -1;
  }

  private completeSpecial(): void {
    const state = this.getState();
    const shooterId = this.sequence?.shooterId ?? '';
    const shooter = state.tanks.find((tank) => tank.id === shooterId);
    if (shooter) {
      shooter.credits += Math.round(this.shotDamage * CREDITS_PER_DAMAGE) + TURN_STIPEND;
    }

    this.settleTouchedTerrain();
    this.sequence = null;
    this.shotDamage = 0;

    const alive = state.tanks.filter((tank) => tank.alive);
    if (alive.length <= 1) {
      state.phase = 'GAME_OVER';
      state.winner = alive[0]?.id ?? null;
      state.winnerTeam = alive[0]?.team ?? null;
      this.announce(alive.length === 1 ? `${alive[0]?.playerName ?? 'SURVIVOR'} OWNS THE ASHES` : 'MUTUAL EXTINCTION');
      return;
    }

    const currentIndex = state.tanks.findIndex((tank) => tank.id === shooterId);
    for (let offset = 1; offset <= state.tanks.length; offset++) {
      const candidate = state.tanks[(currentIndex + offset + state.tanks.length) % state.tanks.length];
      if (candidate?.alive && !candidate.buried) {
        state.activePlayerId = candidate.id;
        break;
      }
    }
    state.turn += 1;
    state.wind = this.nextSpecialWind(state.wind);
    state.phase = 'PLAYER_TURN';
    this.pulse = 0.55;
  }

  private nextSpecialWind(current: number): number {
    const sample = seeded01(this.seed ^ Math.imul(++this.windStep, 0x9e3779b1));
    const delta = (sample * 2 - 1) * SPECIAL_WIND_DRIFT;
    return clamp(current + delta, -MAX_WIND, MAX_WIND);
  }

  private ensureCharges(tankId: string): Record<GodWeapon, number> {
    let inventory = this.charges.get(tankId);
    if (!inventory) {
      inventory = makeChargeRecord();
      this.charges.set(tankId, inventory);
    }
    return inventory;
  }

  private announce(text: string): void {
    this.message = text;
    this.messageAge = 0;
  }
}

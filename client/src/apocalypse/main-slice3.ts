import './style.css';
import '@shared/content/PlayableDirectBridge';
import { getComposableContent } from '@shared/content/ComposableCatalog';
import { PLAYABLE_DIRECT_IDS } from '@shared/content/PlayableDirectBridge';
import { GameEngine } from '@shared/engine/GameEngine';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@shared/engine/Terrain';
import { WEAPONS, type WeaponType } from '@shared/engine/WeaponSystem';
import type { PlayerAction } from '@shared/types/PlayerAction';
import { readAmmo, setUnlimitedAmmo } from '@shared/weapons/SparseInventory';
import { generateFullCatalog } from '@shared/weapons/StoreCatalog';
import { weaponRegistry } from '@shared/weapons/registry';
import type { RegisteredWeaponDefinition, WeaponId } from '@shared/weapons/WeaponRegistry';
import { Renderer } from '../renderer/Renderer';
import {
  ApocalypseEngine,
  GOD_WEAPONS,
  type GodWeapon,
} from './ApocalypseEngine';
import { ApocalypseOverlay } from './ApocalypseOverlay';
import { ComposedEngine } from './ComposedEngine';
import { ComposedOverlay } from './ComposedOverlay';

const TICK_MS = 16;
const STANDARD_PREFIX = 'core:';
const COMPOSED_PREFIX = 'composed:';
const GOD_PREFIX = 'god:';
const SANDBOX_MODE = true;
/** Finite + JSON-safe, but for playtesting effectively inexhaustible. */
const SANDBOX_CREDITS = Number.MAX_SAFE_INTEGER;

type WeaponChoice =
  | `${typeof STANDARD_PREFIX}${WeaponType}`
  | `${typeof COMPOSED_PREFIX}${string}`
  | `${typeof GOD_PREFIX}${GodWeapon}`;

interface Runtime {
  seed: number;
  core: GameEngine;
  apocalypse: ApocalypseEngine;
  composed: ComposedEngine;
  renderer: Renderer;
  overlay: ApocalypseOverlay;
  composedOverlay: ComposedOverlay;
  lastActiveId: string;
  selectedChoice: WeaponChoice;
}

function required<T extends Element>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing required Apocalypse UI node: ${selector}`);
  return node;
}

const baseCanvas = required<HTMLCanvasElement>('#battlefield');
const fxCanvas = required<HTMLCanvasElement>('#apocalypse-fx');
baseCanvas.width = CANVAS_WIDTH;
baseCanvas.height = CANVAS_HEIGHT;
fxCanvas.width = CANVAS_WIDTH;
fxCanvas.height = CANVAS_HEIGHT;

const angleInput = required<HTMLInputElement>('#angle');
const powerInput = required<HTMLInputElement>('#power');
const angleValue = required<HTMLElement>('#angle-value');
const powerValue = required<HTMLElement>('#power-value');
const weaponSelect = required<HTMLSelectElement>('#weapon-select');
const fireButton = required<HTMLButtonElement>('#fire');
const moveLeftButton = required<HTMLButtonElement>('#move-left');
const moveRightButton = required<HTMLButtonElement>('#move-right');
const shieldButton = required<HTMLButtonElement>('#shield');
const guidanceButton = required<HTMLButtonElement>('#guidance');
const restartButton = required<HTMLButtonElement>('#restart');
const reseedButton = required<HTMLButtonElement>('#reseed');
const replayButton = required<HTMLButtonElement>('#export-replay');
const seedInput = required<HTMLInputElement>('#seed');
const turnName = required<HTMLElement>('#turn-name');
const windReadout = required<HTMLElement>('#wind');
const turnReadout = required<HTMLElement>('#turn');
const phaseReadout = required<HTMLElement>('#phase');
const weaponName = required<HTMLElement>('#weapon-name');
const weaponDescription = required<HTMLElement>('#weapon-description');
const weaponDanger = required<HTMLElement>('#weapon-danger');
const weaponAmmo = required<HTMLElement>('#weapon-ammo');
const announcement = required<HTMLElement>('#announcement');
const roster = required<HTMLElement>('#roster');
const arsenal = required<HTMLElement>('#god-arsenal');
const gameover = required<HTMLElement>('#gameover');
const gameoverText = required<HTMLElement>('#gameover-text');
const nextRoundButton = required<HTMLButtonElement>('#next-round');

let runtime: Runtime;
let accumulator = 0;
let previousTime = performance.now();

const fullRegistry = generateFullCatalog(weaponRegistry, {
  seed: 0,
  armsLevel: 4,
  round: 1,
  includeHidden: true,
}).map((id) => weaponRegistry.require(id));

const offensiveCoreWeapons = fullRegistry
  .filter((entry) => entry.execution.kind === 'legacy-core')
  .map((entry) => entry.execution.kind === 'legacy-core' ? entry.execution.definition : null)
  .filter((def): def is (typeof WEAPONS)[WeaponType] => def !== null && def.implemented && !def.behavior?.shield);

const composedWeapons = fullRegistry.filter(
  (entry): entry is RegisteredWeaponDefinition =>
    entry.execution.kind === 'composed'
    && entry.execution.delivery === 'direct_fire'
    && entry.execution.payload === 'kinetic'
    && PLAYABLE_DIRECT_IDS.includes(entry.id),
);

function makeSeed(): number {
  const query = new URLSearchParams(location.search).get('seed');
  const parsed = Number(query ?? seedInput.value);
  if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed) >>> 0;
  return 9001;
}

function choiceForRequestedWeapon(value: string | null): WeaponChoice | null {
  if (!value) return null;
  if (value in GOD_WEAPONS) return `${GOD_PREFIX}${value as GodWeapon}`;
  const registered = weaponRegistry.get(value);
  if (registered?.execution.kind === 'legacy-core') {
    return `${STANDARD_PREFIX}${registered.execution.weaponType}`;
  }
  if (registered?.execution.kind === 'composed' && PLAYABLE_DIRECT_IDS.includes(registered.id)) {
    return `${COMPOSED_PREFIX}${registered.id}`;
  }
  return null;
}

function defaultChoice(): WeaponChoice {
  const requested = choiceForRequestedWeapon(new URLSearchParams(location.search).get('weapon'));
  if (requested) return requested;
  const showcase = weaponRegistry.get('direct.machine_gun');
  if (showcase?.execution.kind === 'composed' && PLAYABLE_DIRECT_IDS.includes(showcase.id)) {
    return `${COMPOSED_PREFIX}${showcase.id}`;
  }
  return `${GOD_PREFIX}rift_lance`;
}

function populateWeaponSelect(): void {
  weaponSelect.replaceChildren();

  const composedGroup = document.createElement('optgroup');
  composedGroup.label = `COMPOSED DIRECT // ${composedWeapons.length} PLAYABLE`;
  for (const def of composedWeapons) {
    const option = document.createElement('option');
    option.value = `${COMPOSED_PREFIX}${def.id}`;
    option.textContent = `${def.name} · ${def.rarity.toUpperCase()}`;
    composedGroup.append(option);
  }
  weaponSelect.append(composedGroup);

  const coreGroup = document.createElement('optgroup');
  coreGroup.label = `LEGACY CORE // ${offensiveCoreWeapons.length} PLAYABLE`;
  for (const def of offensiveCoreWeapons) {
    const option = document.createElement('option');
    option.value = `${STANDARD_PREFIX}${def.type}` satisfies WeaponChoice;
    option.textContent = def.name;
    coreGroup.append(option);
  }
  weaponSelect.append(coreGroup);

  const godGroup = document.createElement('optgroup');
  godGroup.label = 'APOCALYPSE // FORBIDDEN SYSTEMS';
  for (const def of Object.values(GOD_WEAPONS)) {
    const option = document.createElement('option');
    option.value = `${GOD_PREFIX}${def.type}` satisfies WeaponChoice;
    option.textContent = `${def.name} · ${def.danger}`;
    godGroup.append(option);
  }
  weaponSelect.append(godGroup);
}

function createGame(seed: number): Runtime {
  const core = new GameEngine({
    maxPlayers: 2,
    players: [
      { name: 'Ariel', color: '#ff5c8a' },
      { name: 'Wasteland', color: '#4ddcff' },
    ],
    seed,
    walls: 'reflective',
    hazards: 'lava',
    rounds: 1,
    interestRate: 0.05,
    suddenDeathTurn: 18,
    armsLevel: 4,
    starterWeaponFalloff: 'decisive',
    economyMode: 'sandbox',
    storeMode: 'full_catalog',
  });

  for (const tank of core.getState().tanks) {
    tank.credits = SANDBOX_CREDITS;
    tank.powerCap = 140;
    tank.power = 72;
    tank.fuel = 220;
    for (const slot of Object.values(tank.inventory)) {
      slot.count = 0;
      slot.unlimited = true;
    }
    for (const id of PLAYABLE_DIRECT_IDS) setUnlimitedAmmo(tank, id, true);
  }

  const renderer = runtime?.renderer ?? new Renderer(baseCanvas);
  renderer.reset();
  const overlay = runtime?.overlay ?? new ApocalypseOverlay(fxCanvas);
  const composedOverlay = runtime?.composedOverlay ?? new ComposedOverlay(fxCanvas);
  const apocalypse = new ApocalypseEngine(core, seed);
  const composed = new ComposedEngine(core, apocalypse, SANDBOX_MODE);

  return {
    seed,
    core,
    apocalypse,
    composed,
    renderer,
    overlay,
    composedOverlay,
    lastActiveId: core.getState().activePlayerId,
    selectedChoice: defaultChoice(),
  };
}

function start(seed: number): void {
  runtime = createGame(seed);
  seedInput.value = String(seed);
  weaponSelect.value = runtime.selectedChoice;
  syncControlsToTank(true);
  renderGodArsenal();
  updateWeaponCard();
  gameover.hidden = true;
  nextRoundButton.hidden = true;
  accumulator = 0;
  previousTime = performance.now();
}

function activeTank() {
  const state = runtime.core.getState();
  return state.tanks.find((tank) => tank.id === state.activePlayerId);
}

function apply(action: PlayerAction): boolean {
  if (runtime.composed.isActive()) return false;
  return runtime.apocalypse.applyAction(action);
}

function syncControlsToTank(force = false): void {
  const state = runtime.core.getState();
  const tank = activeTank();
  if (!tank) return;
  if (!force && state.activePlayerId === runtime.lastActiveId) return;
  runtime.lastActiveId = state.activePlayerId;
  angleInput.value = String(Math.round(tank.angle));
  powerInput.max = String(Math.max(100, tank.powerCap));
  powerInput.value = String(Math.round(tank.power));
  angleValue.textContent = `${Math.round(tank.angle)}°`;
  powerValue.textContent = `${Math.round(tank.power)}`;
  renderGodArsenal();
  updateWeaponCard();
}

function parseChoice(value: string):
  | { kind: 'core'; weapon: WeaponType }
  | { kind: 'composed'; weapon: WeaponId }
  | { kind: 'god'; weapon: GodWeapon }
  | null {
  if (value.startsWith(STANDARD_PREFIX)) {
    const weapon = value.slice(STANDARD_PREFIX.length) as WeaponType;
    const registered = weaponRegistry.get(weapon);
    if (registered?.execution.kind === 'legacy-core') return { kind: 'core', weapon };
  }
  if (value.startsWith(COMPOSED_PREFIX)) {
    const weapon = value.slice(COMPOSED_PREFIX.length);
    const registered = weaponRegistry.get(weapon);
    if (registered?.execution.kind === 'composed' && PLAYABLE_DIRECT_IDS.includes(weapon)) {
      return { kind: 'composed', weapon };
    }
  }
  if (value.startsWith(GOD_PREFIX)) {
    const weapon = value.slice(GOD_PREFIX.length) as GodWeapon;
    if (weapon in GOD_WEAPONS) return { kind: 'god', weapon };
  }
  return null;
}

function selectedChoice(): ReturnType<typeof parseChoice> {
  return parseChoice(weaponSelect.value);
}

function fire(): void {
  const choice = selectedChoice();
  if (!choice) return;
  if (choice.kind === 'god') {
    runtime.apocalypse.fireSpecial(choice.weapon);
  } else if (choice.kind === 'composed') {
    runtime.composed.fire(choice.weapon);
  } else {
    apply({ type: 'select_weapon', weapon: choice.weapon });
    apply({ type: 'fire' });
  }
  renderGodArsenal();
  updateWeaponCard();
}

function updateWeaponCard(): void {
  const choice = selectedChoice();
  const tank = activeTank();
  if (!choice || !tank) return;

  if (choice.kind === 'god') {
    const def = GOD_WEAPONS[choice.weapon];
    const charges = runtime.apocalypse.getCharges(tank.id)[choice.weapon];
    weaponName.textContent = def.name;
    weaponDescription.textContent = def.description;
    weaponDanger.textContent = def.danger;
    weaponDanger.dataset.level = def.danger;
    weaponAmmo.textContent = `${charges} CHARGE${charges === 1 ? '' : 'S'} · ${SANDBOX_MODE ? 'REARM FREE' : `REARM $${def.price.toLocaleString()}`}`;
    return;
  }

  if (choice.kind === 'composed') {
    const def = weaponRegistry.require(choice.weapon);
    const profileId = def.execution.kind === 'composed' ? def.execution.modifiers?.[0] : undefined;
    const profile = profileId ? getComposableContent(profileId) : undefined;
    const slot = readAmmo(tank, choice.weapon);
    weaponName.textContent = def.name;
    weaponDescription.textContent = profile
      ? `${def.description} ${profile.style.toUpperCase()} pattern · ${profile.copies} emission${profile.copies === 1 ? '' : 's'} · ${profile.arcWidth}° authored spread · ${profile.impactScore} impact score each.`
      : def.description;
    weaponDanger.textContent = `${def.rarity.toUpperCase()} · COMPOSED`;
    weaponDanger.dataset.level = def.danger.toUpperCase();
    weaponAmmo.textContent = slot.unlimited ? 'UNLIMITED · SANDBOX' : `${slot.count} LOAD${slot.count === 1 ? '' : 'S'}`;
    return;
  }

  const def = WEAPONS[choice.weapon];
  const slot = tank.inventory[choice.weapon];
  weaponName.textContent = def.name;
  weaponDescription.textContent = `Canonical singedTerra weapon. ${def.behavior?.airburst ? 'Airburst architecture. ' : ''}${def.behavior?.napalm ? 'Persistent surface fire. ' : ''}${def.behavior?.sandhog ? 'Terrain-burrowing payload. ' : ''}Radius ${def.detonation.radius}px · peak ${Math.round(def.detonation.maxDamage)} damage.`;
  weaponDanger.textContent = def.armsLevel >= 4 ? 'SEVERE' : def.armsLevel >= 2 ? 'HIGH' : 'CONVENTIONAL';
  weaponDanger.dataset.level = 'EXOTIC';
  weaponAmmo.textContent = slot.unlimited ? 'UNLIMITED · SANDBOX' : `${slot.count} ROUND${slot.count === 1 ? '' : 'S'}`;
}

function renderGodArsenal(): void {
  const tank = activeTank();
  if (!tank) return;
  const charges = runtime.apocalypse.getCharges(tank.id);
  arsenal.replaceChildren();
  for (const def of Object.values(GOD_WEAPONS)) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'arsenal-row';
    row.disabled = (!SANDBOX_MODE && tank.credits < def.price)
      || runtime.apocalypse.isSpecialActive()
      || runtime.composed.isActive();
    row.innerHTML = `
      <span class="arsenal-name">${def.name}</span>
      <span class="arsenal-sub">${def.subtitle}</span>
      <span class="arsenal-stock">×${charges[def.type]}</span>
      <span class="arsenal-price">${SANDBOX_MODE ? 'FREE TEST' : `+$${def.price.toLocaleString()}`}</span>
    `;
    row.addEventListener('click', () => {
      runtime.apocalypse.buySpecial(def.type);
      renderGodArsenal();
      updateWeaponCard();
    });
    arsenal.append(row);
  }
}

function renderRoster(): void {
  const state = runtime.core.getState();
  roster.replaceChildren();
  for (const tank of state.tanks) {
    const card = document.createElement('article');
    card.className = `tank-card${tank.id === state.activePlayerId ? ' active' : ''}${tank.alive ? '' : ' dead'}`;
    const health = Math.max(0, tank.health);
    const shield = Math.max(0, tank.shieldHp);
    card.innerHTML = `
      <div class="tank-head">
        <span class="tank-dot" style="--tank:${tank.color}"></span>
        <strong>${tank.playerName}</strong>
        <span>${tank.alive ? (tank.id === state.activePlayerId ? 'ACTIVE' : 'READY') : 'K.O.'}</span>
      </div>
      <div class="meter health"><i style="width:${health}%"></i></div>
      <div class="tank-stats">
        <span>HP ${Math.ceil(health)}</span>
        <span>SH ${Math.ceil(shield)}</span>
        <span>FUEL ${Math.floor(tank.fuel)}</span>
        <span>${SANDBOX_MODE ? '$∞' : `$${Math.floor(tank.credits).toLocaleString()}`}</span>
      </div>
    `;
    roster.append(card);
  }
}

function renderStatus(): void {
  const state = runtime.core.getState();
  const tank = activeTank();
  turnName.textContent = tank?.playerName ?? '—';
  windReadout.textContent = `${state.wind >= 0 ? '+' : ''}${state.wind.toFixed(2)}`;
  turnReadout.textContent = String(state.turn + 1);
  phaseReadout.textContent = state.phase.replace('_', ' ');

  const composedFx = runtime.composed.getFxSnapshot();
  const apocFx = runtime.apocalypse.getFxSnapshot();
  if (composedFx.active && composedFx.weaponId) {
    const def = weaponRegistry.require(composedFx.weaponId);
    announcement.textContent = `COMPOSED // ${def.name.toUpperCase()} // ${composedFx.style?.toUpperCase() ?? 'ACTIVE'}`;
    announcement.classList.add('fresh');
  } else {
    announcement.textContent = apocFx.message;
    announcement.classList.toggle('fresh', apocFx.messageAge < 45);
  }

  const locked = state.phase !== 'PLAYER_TURN'
    || runtime.apocalypse.isSpecialActive()
    || runtime.composed.isActive();
  fireButton.disabled = locked;
  moveLeftButton.disabled = locked;
  moveRightButton.disabled = locked;
  shieldButton.disabled = locked;
  weaponSelect.disabled = locked;
  angleInput.disabled = locked;
  powerInput.disabled = locked;

  if (state.phase === 'GAME_OVER') {
    const winner = state.tanks.find((candidate) => candidate.id === state.winner);
    gameover.hidden = false;
    gameoverText.textContent = winner ? `${winner.playerName.toUpperCase()} OWNS THE ASHES` : 'MUTUAL EXTINCTION';
  } else if (state.phase === 'ROUND_OVER') {
    gameover.hidden = false;
    gameoverText.textContent = `ROUND ${Math.max(1, state.round - 1)} COMPLETE // REARM THEN CONTINUE`;
    nextRoundButton.hidden = false;
  } else {
    gameover.hidden = true;
    nextRoundButton.hidden = true;
  }
}

function downloadReplay(): void {
  const exported = JSON.parse(runtime.apocalypse.exportReplay()) as Record<string, unknown>;
  exported.slice = 3;
  exported.registrySize = weaponRegistry.size;
  exported.playableComposed = [...PLAYABLE_DIRECT_IDS];
  const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `singedterra-apocalypse-slice3-${runtime.seed}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

angleInput.addEventListener('input', () => {
  const angle = Number(angleInput.value);
  angleValue.textContent = `${Math.round(angle)}°`;
  apply({ type: 'set_angle', angle });
});

powerInput.addEventListener('input', () => {
  const power = Number(powerInput.value);
  powerValue.textContent = `${Math.round(power)}`;
  apply({ type: 'set_power', power });
});

weaponSelect.addEventListener('change', () => {
  runtime.selectedChoice = weaponSelect.value as WeaponChoice;
  updateWeaponCard();
});

fireButton.addEventListener('click', fire);
moveLeftButton.addEventListener('click', () => apply({ type: 'move', delta: -7 }));
moveRightButton.addEventListener('click', () => apply({ type: 'move', delta: 7 }));
shieldButton.addEventListener('click', () => {
  apply({ type: 'select_weapon', weapon: 'heavy_shield' });
  apply({ type: 'use_shield', weapon: 'heavy_shield' });
});
guidanceButton.addEventListener('click', () => {
  const enabled = runtime.renderer.toggleAimGuide();
  guidanceButton.classList.toggle('active', enabled);
});
restartButton.addEventListener('click', () => start(runtime.seed));
reseedButton.addEventListener('click', () => {
  const next = (Math.floor(Math.random() * 0xffff_ffff) >>> 0);
  start(next);
});
replayButton.addEventListener('click', downloadReplay);
seedInput.addEventListener('change', () => start(makeSeed()));
nextRoundButton.addEventListener('click', () => {
  apply({ type: 'next_round' });
  gameover.hidden = true;
  nextRoundButton.hidden = true;
  syncControlsToTank(true);
});

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  const state = runtime.core.getState();
  if (state.phase !== 'PLAYER_TURN' || runtime.apocalypse.isSpecialActive() || runtime.composed.isActive()) return;
  switch (event.code) {
    case 'ArrowLeft':
      event.preventDefault();
      angleInput.value = String(Math.max(0, Number(angleInput.value) - 1));
      angleInput.dispatchEvent(new Event('input'));
      break;
    case 'ArrowRight':
      event.preventDefault();
      angleInput.value = String(Math.min(180, Number(angleInput.value) + 1));
      angleInput.dispatchEvent(new Event('input'));
      break;
    case 'ArrowUp':
      event.preventDefault();
      powerInput.value = String(Math.min(Number(powerInput.max), Number(powerInput.value) + 2));
      powerInput.dispatchEvent(new Event('input'));
      break;
    case 'ArrowDown':
      event.preventDefault();
      powerInput.value = String(Math.max(0, Number(powerInput.value) - 2));
      powerInput.dispatchEvent(new Event('input'));
      break;
    case 'KeyA': apply({ type: 'move', delta: -7 }); break;
    case 'KeyD': apply({ type: 'move', delta: 7 }); break;
    case 'KeyG': guidanceButton.click(); break;
    case 'Space':
    case 'Enter':
      event.preventDefault();
      fire();
      break;
  }
});

function frame(now: number): void {
  const elapsed = Math.min(100, now - previousTime);
  previousTime = now;
  accumulator += elapsed;
  while (accumulator >= TICK_MS) {
    runtime.composed.prepareTick();
    runtime.apocalypse.tick();
    runtime.composed.observe();
    accumulator -= TICK_MS;
  }

  const state = runtime.core.getState();
  const current = selectedChoice();
  runtime.renderer.setAimGuide(
    state.phase === 'PLAYER_TURN' && current?.kind !== 'composed',
    runtime.core.getEffectiveGravity(),
  );
  runtime.renderer.render(state);
  runtime.overlay.render(runtime.apocalypse.getFxSnapshot(), state);
  runtime.composedOverlay.render(runtime.composed.getFxSnapshot());
  syncControlsToTank();
  renderRoster();
  renderStatus();
  requestAnimationFrame(frame);
}

populateWeaponSelect();
start(makeSeed());
requestAnimationFrame(frame);

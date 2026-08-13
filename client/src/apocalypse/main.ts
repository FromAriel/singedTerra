import './style.css';
import { GameEngine } from '@shared/engine/GameEngine';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@shared/engine/Terrain';
import { WEAPONS, type WeaponType } from '@shared/engine/WeaponSystem';
import type { PlayerAction } from '@shared/types/PlayerAction';
import { Renderer } from '../renderer/Renderer';
import {
  ApocalypseEngine,
  GOD_WEAPONS,
  type GodWeapon,
} from './ApocalypseEngine';
import { ApocalypseOverlay } from './ApocalypseOverlay';

const TICK_MS = 16;
const STANDARD_PREFIX = 'core:';
const GOD_PREFIX = 'god:';

type WeaponChoice = `${typeof STANDARD_PREFIX}${WeaponType}` | `${typeof GOD_PREFIX}${GodWeapon}`;

interface Runtime {
  seed: number;
  core: GameEngine;
  apocalypse: ApocalypseEngine;
  renderer: Renderer;
  overlay: ApocalypseOverlay;
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

const offensiveCoreWeapons = (Object.values(WEAPONS) as Array<(typeof WEAPONS)[WeaponType]>)
  .filter((def) => def.implemented && !def.behavior?.shield);

function makeSeed(): number {
  const query = new URLSearchParams(location.search).get('seed');
  const parsed = Number(query ?? seedInput.value);
  if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed) >>> 0;
  return 9001;
}

function populateWeaponSelect(): void {
  weaponSelect.replaceChildren();

  const coreGroup = document.createElement('optgroup');
  coreGroup.label = 'singedTerra arsenal';
  for (const def of offensiveCoreWeapons) {
    const option = document.createElement('option');
    option.value = `${STANDARD_PREFIX}${def.type}` satisfies WeaponChoice;
    option.textContent = def.name;
    coreGroup.append(option);
  }
  weaponSelect.append(coreGroup);

  const godGroup = document.createElement('optgroup');
  godGroup.label = 'APOCALYPSE // forbidden systems';
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
  });

  // Apocalypse Mode is intentionally a high-power sandbox. It still uses the
  // real economy, but both tanks begin with enough capital and mobility to make
  // strategic choices before the expensive exotic re-arms matter.
  for (const tank of core.getState().tanks) {
    tank.credits += 42000;
    tank.powerCap = 140;
    tank.power = 72;
    tank.fuel = 220;
  }

  const renderer = runtime?.renderer ?? new Renderer(baseCanvas);
  renderer.reset();
  const overlay = runtime?.overlay ?? new ApocalypseOverlay(fxCanvas);
  const apocalypse = new ApocalypseEngine(core, seed);

  return {
    seed,
    core,
    apocalypse,
    renderer,
    overlay,
    lastActiveId: core.getState().activePlayerId,
    selectedChoice: `${GOD_PREFIX}rift_lance`,
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

function parseChoice(value: string): { kind: 'core'; weapon: WeaponType } | { kind: 'god'; weapon: GodWeapon } | null {
  if (value.startsWith(STANDARD_PREFIX)) {
    const weapon = value.slice(STANDARD_PREFIX.length) as WeaponType;
    if (weapon in WEAPONS) return { kind: 'core', weapon };
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
    weaponAmmo.textContent = `${charges} CHARGE${charges === 1 ? '' : 'S'} · REARM $${def.price.toLocaleString()}`;
  } else {
    const def = WEAPONS[choice.weapon];
    const slot = tank.inventory[choice.weapon];
    weaponName.textContent = def.name;
    weaponDescription.textContent = `Canonical singedTerra weapon. ${def.behavior?.airburst ? 'Airburst architecture. ' : ''}${def.behavior?.napalm ? 'Persistent surface fire. ' : ''}${def.behavior?.sandhog ? 'Terrain-burrowing payload. ' : ''}Radius ${def.detonation.radius}px · peak ${Math.round(def.detonation.maxDamage)} damage.`;
    weaponDanger.textContent = def.armsLevel >= 4 ? 'SEVERE' : def.armsLevel >= 2 ? 'HIGH' : 'CONVENTIONAL';
    weaponDanger.dataset.level = 'EXOTIC';
    weaponAmmo.textContent = slot.unlimited ? 'UNLIMITED' : `${slot.count} ROUND${slot.count === 1 ? '' : 'S'}`;
  }
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
    row.disabled = tank.credits < def.price || runtime.apocalypse.isSpecialActive();
    row.innerHTML = `
      <span class="arsenal-name">${def.name}</span>
      <span class="arsenal-sub">${def.subtitle}</span>
      <span class="arsenal-stock">×${charges[def.type]}</span>
      <span class="arsenal-price">+$${def.price.toLocaleString()}</span>
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
        <span>$${Math.floor(tank.credits).toLocaleString()}</span>
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

  const fx = runtime.apocalypse.getFxSnapshot();
  announcement.textContent = fx.message;
  announcement.classList.toggle('fresh', fx.messageAge < 45);

  const locked = state.phase !== 'PLAYER_TURN' || runtime.apocalypse.isSpecialActive();
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
  const blob = new Blob([runtime.apocalypse.exportReplay()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `singedterra-apocalypse-${runtime.seed}.json`;
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
  if (state.phase !== 'PLAYER_TURN' || runtime.apocalypse.isSpecialActive()) return;
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
    runtime.apocalypse.tick();
    accumulator -= TICK_MS;
  }

  const state = runtime.core.getState();
  runtime.renderer.setAimGuide(state.phase === 'PLAYER_TURN', runtime.core.getEffectiveGravity());
  runtime.renderer.render(state);
  runtime.overlay.render(runtime.apocalypse.getFxSnapshot(), state);
  syncControlsToTank();
  renderRoster();
  renderStatus();
  requestAnimationFrame(frame);
}

populateWeaponSelect();
start(makeSeed());
requestAnimationFrame(frame);

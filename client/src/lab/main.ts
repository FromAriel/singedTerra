import './style.css';
import { PLAYABLE_DIRECT_IDS } from '@shared/content/PlayableDirectBridge';
import { weaponRegistry as registry } from '@shared/weapons/registry';
import type { RegisteredWeaponDefinition } from '@shared/weapons/WeaponRegistry';

const root = document.querySelector<HTMLElement>('#arsenal-app');
if (!root) throw new Error('Lab root missing');

const playable = new Set(PLAYABLE_DIRECT_IDS);
const rows = [...registry.all()].sort((a, b) => a.name.localeCompare(b.name));

function canRunInRange(row: RegisteredWeaponDefinition): boolean {
  if (playable.has(row.id)) return true;
  return row.execution.kind === 'legacy-core'
    && row.execution.definition.implemented
    && !row.execution.definition.behavior?.shield;
}

const shell = document.createElement('section');
shell.className = 'lab';
const title = document.createElement('h1');
title.textContent = 'Arsenal Lab';
const intro = document.createElement('p');
intro.className = 'lede';
intro.textContent = `${registry.size} registered items · ${rows.filter(canRunInRange).length} immediately runnable in the test range.`;
const nav = document.createElement('nav');
nav.className = 'nav';
nav.innerHTML = '<a href="./">MODE SELECT</a><a href="./apocalypse.html">TEST RANGE</a>';
const search = document.createElement('input');
search.type = 'search';
search.placeholder = 'Search registry…';
search.className = 'controls';
const grid = document.createElement('section');
grid.className = 'grid';
shell.append(title, intro, nav, search, grid);
root.append(shell);

function render(): void {
  const q = search.value.trim().toLowerCase();
  const visible = rows.filter((row) => !q || `${row.id} ${row.name} ${row.family} ${row.tags.join(' ')}`.toLowerCase().includes(q));
  grid.replaceChildren();
  for (const row of visible) {
    const canRun = canRunInRange(row);
    const card = document.createElement('article');
    card.className = 'card';
    const heading = document.createElement('h2');
    heading.textContent = row.name;
    const id = document.createElement('p');
    id.textContent = `${row.id} · ${row.execution.kind} · ${canRun ? 'PLAYABLE' : 'REGISTERED'}`;
    const description = document.createElement('p');
    description.textContent = row.description;
    card.append(heading, id, description);
    if (canRun) {
      const link = document.createElement('a');
      link.href = `./apocalypse.html?weapon=${encodeURIComponent(row.id)}`;
      link.textContent = 'OPEN IN TEST RANGE';
      card.append(link);
    }
    grid.append(card);
  }
}

search.addEventListener('input', render);
render();

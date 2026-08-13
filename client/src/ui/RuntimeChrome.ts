import { PLAYABLE_DIRECT_IDS } from '@shared/content/PlayableDirectBridge';
import { weaponRegistry } from '@shared/weapons/registry';

export function markCurrentRange(): void {
  const subtitle = document.querySelector<HTMLElement>('.brand-subtitle');
  if (subtitle) subtitle.textContent = `SLICE 3 · ${PLAYABLE_DIRECT_IDS.length} COMPOSED ITEMS ONLINE · ${weaponRegistry.size} REGISTERED`;

  const operations = document.querySelector<HTMLElement>('.utility-grid');
  if (!operations || operations.querySelector('[data-content-lab]')) return;
  const link = document.createElement('a');
  link.className = 'utility-link';
  link.dataset.contentLab = 'true';
  link.href = `${import.meta.env.BASE_URL}arsenal.html`;
  link.textContent = 'ARSENAL LAB';
  operations.append(link);
}

if (typeof document !== 'undefined') markCurrentRange();

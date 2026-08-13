const LAUNCHER_ID = 'st-mode-launcher';
const STYLE_ID = 'st-mode-launcher-style';

const CSS = `
#${LAUNCHER_ID} {
  position: fixed;
  inset: 0;
  z-index: 12000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: radial-gradient(circle at 50% 25%, rgba(74, 92, 160, 0.24), transparent 42%), rgba(3, 5, 10, 0.82);
  backdrop-filter: blur(10px);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
#${LAUNCHER_ID} .st-mode-launcher__panel {
  width: min(820px, 94vw);
  padding: 28px;
  border: 1px solid rgba(160, 211, 255, 0.28);
  background: linear-gradient(180deg, rgba(15, 22, 38, 0.98), rgba(6, 10, 20, 0.98));
  box-shadow: 0 26px 80px rgba(0,0,0,0.55), 0 0 50px rgba(73, 155, 255, 0.12);
}
#${LAUNCHER_ID} .st-mode-launcher__eyebrow {
  color: #75d7ff;
  letter-spacing: 0.22em;
  font-size: 12px;
  text-transform: uppercase;
}
#${LAUNCHER_ID} h1 {
  margin: 8px 0 6px;
  color: #f4f8ff;
  font: 800 clamp(28px, 5vw, 54px)/1 system-ui, sans-serif;
  letter-spacing: -0.04em;
}
#${LAUNCHER_ID} .st-mode-launcher__sub {
  margin: 0 0 24px;
  color: #99a8c2;
  line-height: 1.55;
}
#${LAUNCHER_ID} .st-mode-launcher__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
#${LAUNCHER_ID} .st-mode-launcher__mode {
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.035);
  color: #eaf3ff;
  text-decoration: none;
  cursor: pointer;
  text-align: left;
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
}
#${LAUNCHER_ID} .st-mode-launcher__mode:hover,
#${LAUNCHER_ID} .st-mode-launcher__mode:focus-visible {
  transform: translateY(-2px);
  border-color: rgba(113, 219, 255, 0.58);
  background: rgba(84, 167, 255, 0.09);
  outline: none;
}
#${LAUNCHER_ID} .st-mode-launcher__mode strong { font-size: 18px; }
#${LAUNCHER_ID} .st-mode-launcher__mode span { color: #8fa1bd; font-size: 12px; line-height: 1.45; }
#${LAUNCHER_ID} .st-mode-launcher__badge {
  align-self: flex-start;
  padding: 4px 7px;
  border: 1px solid rgba(117, 215, 255, 0.28);
  color: #75d7ff !important;
  font-size: 10px !important;
  letter-spacing: 0.12em;
}
#${LAUNCHER_ID} .st-mode-launcher__foot {
  margin-top: 18px;
  color: #62718a;
  font-size: 11px;
}
@media (max-width: 720px) {
  #${LAUNCHER_ID} .st-mode-launcher__grid { grid-template-columns: 1fr; }
  #${LAUNCHER_ID} .st-mode-launcher__mode { min-height: 105px; }
}
`;

function baseHref(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.append(style);
}

function enterClassic(overlay: HTMLElement): void {
  overlay.remove();
  // The legacy splash may already be mounted underneath. Dismiss it so choosing
  // Classic is one action, not a second hidden "press anything" interaction.
  window.setTimeout(() => {
    const splash = document.getElementById('st-splash');
    splash?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, 0);
}

export function mountModeLauncher(): void {
  if (document.getElementById(LAUNCHER_ID)) return;
  injectStyle();

  const overlay = document.createElement('section');
  overlay.id = LAUNCHER_ID;
  overlay.setAttribute('aria-label', 'singedTerra mode selection');
  overlay.innerHTML = `
    <div class="st-mode-launcher__panel">
      <div class="st-mode-launcher__eyebrow">APOCALYPSE ENGINE · SLICE 3</div>
      <h1>Choose the battlefield.</h1>
      <p class="st-mode-launcher__sub">The default build now exposes the original game, the experimental ruleset, and the scalable registry lab directly. No secret URLs.</p>
      <div class="st-mode-launcher__grid">
        <button class="st-mode-launcher__mode" type="button" data-mode="classic">
          <span class="st-mode-launcher__badge">ORIGINAL RULESET</span>
          <strong>Classic</strong>
          <span>The production deterministic game, unchanged underneath the new launcher.</span>
        </button>
        <a class="st-mode-launcher__mode" href="${baseHref('apocalypse.html')}">
          <span class="st-mode-launcher__badge">PLAYABLE COMPOSED CONTENT</span>
          <strong>Apocalypse</strong>
          <span>Sandbox economy, special systems, and the first ten composed registry items in the live test range.</span>
        </a>
        <a class="st-mode-launcher__mode" href="${baseHref('arsenal.html')}">
          <span class="st-mode-launcher__badge">REGISTRY INSPECTOR</span>
          <strong>Arsenal Lab</strong>
          <span>Search every registered item, inspect execution metadata, and open any playable item directly in the range.</span>
        </a>
      </div>
      <div class="st-mode-launcher__foot">Classic remains compatible. Slice 3 adds visible entry points instead of silently replacing it.</div>
    </div>
  `;
  overlay.querySelector<HTMLButtonElement>('[data-mode="classic"]')
    ?.addEventListener('click', () => enterClassic(overlay));
  document.body.appendChild(overlay);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountModeLauncher, { once: true });
  else mountModeLauncher();
}

import {
  ChevronDown,
  Crosshair,
  Menu,
  PackageOpen,
  ShoppingBag,
  createElement,
} from 'lucide';

/**
 * The combat-shell icon seam. Keep this map explicit: importing Lucide's
 * all-icons registry would ship the complete catalog instead of these five
 * small SVG nodes.
 */
const HUD_ICONS = {
  menu: Menu,
  store: ShoppingBag,
  arsenal: PackageOpen,
  disclosure: ChevronDown,
  fire: Crosshair,
} as const;

export type HudIconName = keyof typeof HUD_ICONS;

/** Build a decorative, non-focusable icon that reinforces adjacent visible text. */
export function makeHudIcon(name: HudIconName, size = 16): SVGElement {
  return createElement(HUD_ICONS[name], {
    class: 'st-ui-icon',
    width: size,
    height: size,
    'stroke-width': 1.8,
    'aria-hidden': 'true',
    focusable: 'false',
    'data-icon': name,
  });
}

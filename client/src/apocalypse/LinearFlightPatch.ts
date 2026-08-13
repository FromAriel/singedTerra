import { ComposedEngine } from './ComposedEngine';

const PATCH_KEY = Symbol.for('singedTerra.apocalypse.linear-flight');
type PatchedPrototype = ComposedEngine['__proto__'] & { [PATCH_KEY]?: true };
const proto = ComposedEngine.prototype as unknown as PatchedPrototype & ComposedEngine;

if (!proto[PATCH_KEY]) {
  const originalFire = ComposedEngine.prototype.fire;
  const originalObserve = ComposedEngine.prototype.observe;

  ComposedEngine.prototype.fire = function (...args: Parameters<typeof originalFire>) {
    const committed = originalFire.apply(this, args);
    if (committed) this.prepareTick();
    return committed;
  };

  ComposedEngine.prototype.observe = function (...args: Parameters<typeof originalObserve>) {
    originalObserve.apply(this, args);
    this.prepareTick();
  };

  proto[PATCH_KEY] = true;
}

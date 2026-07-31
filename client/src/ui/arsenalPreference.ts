export function resolveInitialArsenalCollapsed(
  storedValue: string | null,
): boolean {
  if (storedValue === '1') return true;
  if (storedValue === '0') return false;
  // A drawer is transient by design. Start every new shell closed so the
  // battlefield controls remain visible; a deliberate saved preference wins.
  return true;
}

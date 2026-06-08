/** "Aanya Rao" -> "Aanya R."  Set FULL_NAMES = true to publish full names. */
export const FULL_NAMES = false;

export function maskName(full: string): string {
  if (FULL_NAMES) return full;
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export function hasCreditsContent(raw?: string | null): boolean {
  if (!raw) return false;
  return raw.trim().length > 0;
}


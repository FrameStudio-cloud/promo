export const MIN_MINUTES = 1;
export const MAX_MINUTES = 24 * 60;

/** Session length the clock starts with. */
export const DEFAULT_MINUTES = 25;

export const clampMinutes = (m: number) =>
  Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(m)));

/**
 * Parse a user-typed duration into minutes.
 * Accepts "90", "90m", "8h", "1h30m", "2 hours", "45 mins".
 * Returns null when the input can't be understood.
 */
export function parseDuration(input: string, unit: 'm' | 'h' = 'm'): number | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;

  // "1h30m" / "1h" / "8hr" / "2hours"
  const hms = s.match(/^(\d+(?:\.\d+)?)h(?:r|rs|our|ours)?(\d+(?:\.\d+)?)?m?(?:in(?:s)?)?$/);
  if (hms) {
    const h = parseFloat(hms[1]);
    const m = hms[2] ? parseFloat(hms[2]) : 0;
    return clampMinutes(h * 60 + m);
  }

  // "45m" / "90mins"
  const mins = s.match(/^(\d+(?:\.\d+)?)m(?:in(?:s)?)?$/);
  if (mins) return clampMinutes(parseFloat(mins[1]));

  // "45" / "0.5"
  if (/^\d+(?:\.\d+)?$/.test(s)) {
    const n = parseFloat(s);
    return clampMinutes(unit === 'h' ? n * 60 : n);
  }

  return null;
}

/** Render minutes as the shortest sensible label: "8h", "1h30m", "45m". */
export function formatDuration(minutes: number): string {
  const m = clampMinutes(minutes);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h}h` : `${h}h${rest}m`;
}
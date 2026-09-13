export const DAY_MS = 30 * 60 * 1000;
// Stable fallback for older gardens, whose creation date is unknown.
export const LEGACY_EPOCH = Date.UTC(2026, 8, 12);
export function worldTime(now: number, createdAt = LEGACY_EPOCH): { hour: number; day: number } {
  const elapsed = Math.max(0, now - createdAt);
  const hours = 8 + elapsed / DAY_MS * 24;
  return { hour: hours % 24, day: Math.floor(hours / 24) + 1 };
}
export function worldCalendar(day: number): { day: number; year: number } {
 const index=Math.max(0,Math.floor(day)-1);
 return {day:index%360+1,year:Math.floor(index/360)+1};
}

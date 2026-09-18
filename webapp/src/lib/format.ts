/* Formatting helpers shared by every component (DRY: one source for
   currency/date presentation, so cards, chart and table always agree). */

export function sgd(value: number): string {
  return `S$${Math.round(value).toLocaleString("en-SG")}`;
}

/** "2026-09-01" -> "Sep 2026 · 1st round" */
export function roundLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const month = date.toLocaleString("en-SG", { month: "short", year: "numeric" });
  const exercise = date.getDate() === 1 ? "1st" : "2nd";
  return `${month} · ${exercise} round`;
}

/** Axis label: "2026-09-01" -> "Sep 2026" */
export function shortDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString("en-SG", { month: "short", year: "numeric" });
}

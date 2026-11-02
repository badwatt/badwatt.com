import type { ExperienceEntry } from "src/domain/content";

type Dated = Pick<ExperienceEntry, "date_from">;

/**
 * Milliseconds for a `date_from` value as written in the content files.
 * "now" comes from the injected clock so callers stay deterministic.
 */
export function parseDate(value: string, now: number = Date.now()): number {
  if (value.toLowerCase() === "now") return now;
  const date = new Date(`${value} 01`);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

/** Newest first. Returns a new array; the input keeps its order. */
export function sortByMostRecent<T extends Dated>(entries: T[], now?: number): T[] {
  return [...entries].sort((a, b) => parseDate(b.date_from, now) - parseDate(a.date_from, now));
}

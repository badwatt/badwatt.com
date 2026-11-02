import type { ExperienceEntry } from "src/content/domain/content";

type Dated = Pick<ExperienceEntry, "date_from">;

export function parseDate(value: string, now: number = Date.now()): number {
  if (value.toLowerCase() === "now") return now;
  const date = new Date(`${value} 01`);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export function sortByMostRecent<T extends Dated>(entries: T[], now?: number): T[] {
  return [...entries].sort((a, b) => parseDate(b.date_from, now) - parseDate(a.date_from, now));
}

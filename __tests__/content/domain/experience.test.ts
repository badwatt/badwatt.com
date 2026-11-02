import { describe, expect, it } from "vite-plus/test";
import { parseDate, sortByMostRecent } from "src/content/domain/experience";

describe("parseDate", () => {
  it("reads 'now' as the injected clock", () => {
    expect(parseDate("now", 1_700_000_000_000)).toBe(1_700_000_000_000);
  });

  it("reads a month and year on the first of that month", () => {
    expect(parseDate("June 2023")).toBe(new Date("June 2023 01").getTime());
  });

  it("returns 0 for a date it cannot read", () => {
    expect(parseDate("2024 13")).toBe(0);
  });
});

describe("sortByMostRecent", () => {
  it("orders by date_from, newest first, with 'now' at the top", () => {
    const entries = [
      { title: "old", date_from: "October 2021", date_to: "April 2023" },
      { title: "current", date_from: "now", date_to: "now" },
      { title: "middle", date_from: "June 2023", date_to: "now" },
    ];

    expect(sortByMostRecent(entries, 1_700_000_000_000).map(({ title }) => title)).toEqual([
      "current",
      "middle",
      "old",
    ]);
  });

  it("does not mutate the input", () => {
    const entries = [
      { title: "a", date_from: "October 2021", date_to: "now" },
      { title: "b", date_from: "June 2023", date_to: "now" },
    ];

    sortByMostRecent(entries);

    expect(entries.map(({ title }) => title)).toEqual(["a", "b"]);
  });
});

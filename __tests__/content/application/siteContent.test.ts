import { describe, expect, it, vi } from "vite-plus/test";
import { loadSiteContent, type ContentSource } from "src/content/application/siteContent";
import type { ExperienceEntry } from "src/content/domain/content";

const experienceEntries: ExperienceEntry[] = [
  {
    title: "old",
    image: "/a.png",
    date_from: "October 2021",
    date_to: "April 2023",
    url: "https://example.com/old",
    description: "old body",
  },
  {
    title: "current",
    image: "/b.png",
    date_from: "now",
    date_to: "now",
    url: "https://example.com/current",
    description: "current body",
  },
];

function createSource() {
  const experience = vi.fn().mockResolvedValue(experienceEntries);
  const portfolio = vi.fn().mockResolvedValue([]);
  const about = vi.fn().mockResolvedValue([]);
  const skills = vi.fn().mockResolvedValue([]);
  const source: ContentSource = { experience, portfolio, about, skills };
  return { source, experience, portfolio, about, skills };
}

describe("loadSiteContent", () => {
  it("asks the source for every collection", async () => {
    const { source, experience, portfolio, about, skills } = createSource();

    await loadSiteContent(source);

    expect(experience).toHaveBeenCalledOnce();
    expect(portfolio).toHaveBeenCalledOnce();
    expect(about).toHaveBeenCalledOnce();
    expect(skills).toHaveBeenCalledOnce();
  });

  it("returns experience sorted newest first", async () => {
    const { source } = createSource();

    const content = await loadSiteContent(source, 1_700_000_000_000);

    expect(content.experience.map(({ title }) => title)).toEqual(["current", "old"]);
  });
});

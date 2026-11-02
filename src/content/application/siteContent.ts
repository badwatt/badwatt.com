import type {
  AboutEntry,
  ExperienceEntry,
  PortfolioEntry,
  SkillEntry,
} from "src/content/domain/content";
import { sortByMostRecent } from "src/content/domain/experience";

export interface SiteContent {
  experience: ExperienceEntry[];
  portfolio: PortfolioEntry[];
  about: AboutEntry[];
  skills: SkillEntry[];
}

export interface ContentSource {
  experience(): Promise<ExperienceEntry[]>;
  portfolio(): Promise<PortfolioEntry[]>;
  about(): Promise<AboutEntry[]>;
  skills(): Promise<SkillEntry[]>;
}

export async function loadSiteContent(source: ContentSource, now?: number): Promise<SiteContent> {
  const [experience, portfolio, about, skills] = await Promise.all([
    source.experience(),
    source.portfolio(),
    source.about(),
    source.skills(),
  ]);

  return { experience: sortByMostRecent(experience, now), portfolio, about, skills };
}

import type { CvPorts } from "src/cv/application/requestCv";
import type { AboutEntry, ExperienceEntry, SkillEntry } from "src/domain/content";
import type { CVTheme } from "src/cv/domain/theme";

export interface CvContent {
  experienceData: ExperienceEntry[];
  aboutData: AboutEntry[];
  skillsData: SkillEntry[];
}

const VERIFY_ENDPOINT = "/api/cap/verify";

/**
 * Adapts the browser to the CV ports: the captcha is verified by our own route
 * and the PDF is rendered by the lazy-loaded generator, so jsPDF never enters
 * the initial bundle.
 */
export function createCvClient({ experienceData, aboutData, skillsData }: CvContent): CvPorts {
  return {
    async verifyCaptcha(token) {
      const res = await fetch(VERIFY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      return res.ok;
    },

    async render(theme: CVTheme) {
      const { generateCV } = await import("src/cv/infrastructure/pdf/generateCv");
      return generateCV(theme, experienceData, aboutData, skillsData);
    },
  };
}

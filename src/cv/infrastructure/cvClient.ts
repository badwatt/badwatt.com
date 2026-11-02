import { verifyCaptcha } from "src/captcha/application/verifyCaptcha";
import type { CvPorts } from "src/cv/application/requestCv";
import type { AboutEntry, ExperienceEntry, SkillEntry } from "src/content/domain/content";
import type { CVTheme } from "src/cv/domain/theme";

export interface CvContent {
  experienceData: ExperienceEntry[];
  aboutData: AboutEntry[];
  skillsData: SkillEntry[];
}

/**
 * Adapts the browser to the CV ports: the captcha is verified by our own route
 * and the PDF is rendered by the lazy-loaded generator, so jsPDF never enters
 * the initial bundle.
 */
export function createCvClient({ experienceData, aboutData, skillsData }: CvContent): CvPorts {
  return {
    verifyCaptcha: (token) => verifyCaptcha(token),

    async render(theme: CVTheme) {
      const { generateCV } = await import("src/cv/infrastructure/pdf/generateCv");
      return generateCV(theme, experienceData, aboutData, skillsData);
    },
  };
}

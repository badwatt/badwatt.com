import type { AboutEntry, ExperienceEntry, SkillEntry } from "src/content/domain/content";
import { sortByMostRecent } from "src/content/domain/experience";
import { buildColors, pickAssetByLuminance, type CVTheme } from "src/cv/domain/theme";
import { parseExperienceSubgroups } from "src/content/domain/markdown";
import { PAGE_H, M, chipBodyTopPad, fitSubgroups } from "src/cv/domain/layout";
import { loadImage, loadImageToPng, toCircular } from "src/cv/infrastructure/pdf/assets";
import {
  continuationHeader,
  drawFooter,
  drawHeader,
  drawJobCard,
  startPage,
} from "src/cv/infrastructure/pdf/sections";
import { SIDEBAR_W, drawSidebar } from "src/cv/infrastructure/pdf/sidebar";

export async function generateCV(
  theme: CVTheme,
  experienceData: ExperienceEntry[],
  aboutData: AboutEntry[],
  skillsData: SkillEntry[],
): Promise<string> {
  const C = buildColors(theme.colors);
  const sortedExperience = sortByMostRecent(experienceData);
  const featuredSkills = skillsData.filter((s) => s.featured).map((s) => s.title);
  const otherSkills = skillsData.filter((s) => !s.featured).map((s) => s.title);

  const expImages = sortedExperience.map((e) => e.image);
  const githubUrl = pickAssetByLuminance(
    theme.colors.base,
    "/social/github.svg",
    "/social/github_dark.svg",
  );
  const linkedinUrl = pickAssetByLuminance(
    theme.colors.base,
    "/social/linkedin.svg",
    "/social/linkedin_dark.svg",
  );
  const allImages = [
    "/images/profile/profile.png",
    "/images/profile/profile_alt.png",
    githubUrl,
    linkedinUrl,
    ...expImages,
  ];

  const [{ jsPDF }, ...rawImages] = await Promise.all([
    import("jspdf"),
    ...allImages.map((u) => loadImage(u).catch(() => "")),
  ]);

  const [profileRaw, profileAltRaw, githubRaw, linkedinRaw, ...expRaws] = rawImages;

  const PROFILE = 72;
  const ALT = 12;
  const ICON = 12;
  const profileImg = profileRaw ? await toCircular(profileRaw, PROFILE) : null;
  const profileAltImg = profileAltRaw ? await toCircular(profileAltRaw, ALT) : null;
  const githubIcon = githubRaw ? await loadImageToPng(githubRaw, ICON, ICON) : null;
  const linkedinIcon = linkedinRaw ? await loadImageToPng(linkedinRaw, ICON, ICON) : null;
  const LOGO = 16;
  const expLogos: (string | null)[] = [];
  for (const raw of expRaws) {
    if (!raw) {
      expLogos.push(null);
      continue;
    }
    const logo = await loadImageToPng(raw, LOGO, LOGO);
    expLogos.push(logo);
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  startPage(doc, W, C);

  const bodyTop = drawHeader(doc, W, C);
  drawSidebar(
    doc,
    C,
    { aboutData, featuredSkills, otherSkills, profileImg, githubIcon, linkedinIcon },
    M,
    SIDEBAR_W,
    bodyTop,
  );

  const mainX = M + SIDEBAR_W + 28;
  const mainW = W - M - SIDEBAR_W - 28;
  const contW = mainW - 28;
  const CONTENT_W = W - M * 2;
  const cx = mainX + 28;

  // Two independent columns: the experience starts under the header, at the same
  // height as the sidebar, and the sidebar height never pushes it down.
  let y = bodyTop + 8;
  let page = 1;

  const pageLimit = PAGE_H - M - 36;

  const addContinuationPage = () => {
    drawFooter(doc, C, profileAltImg);
    doc.addPage();
    page++;
    startPage(doc, W, C);
    y = continuationHeader(doc, C);
  };

  for (let i = 0; i < sortedExperience.length; i++) {
    const job = sortedExperience[i];
    const logo = expLogos[i] ?? null;
    const subgroups = parseExperienceSubgroups(job.description);
    const bodyTopPad = chipBodyTopPad(subgroups.length);

    let pending = subgroups;
    // True once this job already started on a fresh page. Without it a
    // single period taller than a page would ping-pong between pages.
    let started = false;

    while (pending.length > 0) {
      // Page 1 keeps the narrow sidebar column; a job continued on the
      // next page spans the full width, where its body wraps into fewer
      // lines.
      const usePage1 = page === 1;
      const jx = usePage1 ? cx : M + 28;
      const jw = usePage1 ? contW : CONTENT_W - 40;

      let take = fitSubgroups(doc, pending, jw, bodyTopPad, pageLimit - y);
      if (take === 0) {
        if (started) {
          take = 1;
        } else {
          addContinuationPage();
          started = true;
          continue;
        }
      }

      y = drawJobCard(doc, C, job, pending.slice(0, take), jx, jw, y, logo, bodyTopPad);
      pending = pending.slice(take);

      if (pending.length > 0) {
        addContinuationPage();
        started = true;
      }
    }
  }

  drawFooter(doc, C, profileAltImg);

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  return url;
}

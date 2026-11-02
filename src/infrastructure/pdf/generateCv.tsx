import type { AboutEntry, ExperienceEntry, SkillEntry } from "src/domain/content";
import { sortByMostRecent } from "src/domain/experience";
import { buildColors, pickAssetByLuminance, type CVTheme } from "src/domain/cv/theme";
import { parseExperienceSubgroups, tokenize, type Token } from "src/domain/markdown";
import { PAGE_H, M, chipBodyTopPad, fitSubgroups } from "src/domain/cv/layout";
import { loadImage, loadImageToPng, toCircular } from "src/infrastructure/pdf/assets";
import {
  continuationHeader,
  drawFooter,
  drawJobCard,
  sectionTitle,
  startPage,
  tag,
} from "src/infrastructure/pdf/draw";

export function getBioText(data: AboutEntry[]): string {
  return data[0]?.bio ?? "";
}

export function parseDescription(raw: string): Token[] {
  return tokenize(raw);
}

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

  // Header
  let y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...C.white);
  doc.text("Alvaro Garcia Macias", M, y + 20);
  y += 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.primary);
  doc.text("FULL STACK DEVELOPER", M, y + 10);
  y += 16;

  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(M, y, W - M, y);
  y += 20;

  const sidebarW = 160;
  const mainX = M + sidebarW + 28;
  const mainW = W - M - sidebarW - 28;
  const contW = mainW - 28;
  const CONTENT_W = W - M * 2;

  // Sidebar
  let sy = y;
  if (profileImg) {
    try {
      const imgX = M + (sidebarW - PROFILE) / 2;
      doc.addImage(profileImg, "PNG", imgX, sy, PROFILE, PROFILE);
      doc.setDrawColor(...C.primary);
      doc.setLineWidth(1.5);
      doc.ellipse(imgX + PROFILE / 2, sy + PROFILE / 2, PROFILE / 2, PROFILE / 2, "S");
      sy += PROFILE + 24;
    } catch {
      /* noop */
    }
  }

  // Email
  if (aboutData[0]?.email) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...C.white);
    doc.text("@", M + ICON / 2, sy + 9, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.textWithLink(aboutData[0].email, M + ICON + 4, sy + 8, {
      url: `mailto:${aboutData[0].email}`,
    });
  }
  sy += 16;

  // Social links
  if (githubIcon) {
    try {
      doc.addImage(githubIcon, "PNG", M, sy, ICON, ICON);
    } catch {
      /* noop */
    }
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.textWithLink("github.com/badwatt", M + ICON + 4, sy + 8, {
    url: "https://github.com/badwatt",
  });
  sy += 16;

  if (linkedinIcon) {
    try {
      doc.addImage(linkedinIcon, "PNG", M, sy, ICON, ICON);
    } catch {
      /* noop */
    }
  }
  doc.textWithLink("linkedin.com/in/badwatt", M + ICON + 4, sy + 8, {
    url: "https://linkedin.com/in/badwatt",
  });
  const socialBottom = sy + 12;
  sy = socialBottom + 22;

  sy = sectionTitle(doc, C, "ABOUT", M, sy);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  const bio = doc.splitTextToSize(getBioText(aboutData), sidebarW - 8);
  doc.text(bio, M, sy);
  sy = sy + (bio.length - 1) * 10 + 10 + 22;

  // Location
  if (aboutData[0]?.location) {
    sy = sectionTitle(doc, C, "LOCATION", M, sy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.muted);
    doc.text(aboutData[0].location, M, sy);
    sy = sy + 11 + 22;
  }

  // Languages
  if (aboutData[0]?.languages && aboutData[0].languages.length > 0) {
    sy = sectionTitle(doc, C, "LANGUAGES", M, sy);
    for (const lang of aboutData[0].languages) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...C.white);
      const tw = doc.getTextWidth(`${lang.language} · ${lang.level}`);
      doc.setFillColor(...C.surface);
      doc.setDrawColor(...C.border);
      doc.roundedRect(M, sy - 8, tw + 12, 13, 2, 2, "FD");
      doc.text(`${lang.language} · ${lang.level}`, M + 6, sy + 1);
      sy += 18;
    }
    const langBottom = sy - 18 + 5;
    sy = langBottom + 22;
  }

  // Education
  if (aboutData[0]?.education && aboutData[0].education.length > 0) {
    sy = sectionTitle(doc, C, "EDUCATION", M, sy);
    for (const edu of aboutData[0].education) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...C.white);
      doc.text(edu.degree, M, sy);
      sy += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...C.muted);
      const instText = edu.year ? `${edu.institution} · ${edu.year}` : edu.institution;
      doc.text(instText, M, sy);
      sy += 12;
    }
    const eduBottom = sy - 12 + 8;
    sy = eduBottom + 22;
  }

  sy = sectionTitle(doc, C, "SKILLS", M, sy);
  let tx = M;
  for (const s of featuredSkills) {
    const r = tag(doc, C, s, tx, sy, true, M, sidebarW);
    tx = r.x;
    sy = r.y;
  }
  for (const s of otherSkills) {
    const r = tag(doc, C, s, tx, sy, false, M, sidebarW);
    tx = r.x;
    sy = r.y;
  }
  sy += 20;

  let page = 1;

  const cx = mainX + 28;

  // Experience area (no title)
  y += 8;

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

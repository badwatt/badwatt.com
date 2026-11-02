import type { AboutEntry, ExperienceEntry } from "src/domain/content";
import { PROFILE } from "src/domain/profile";
import type { CVColors } from "src/domain/cv/theme";
import type { PdfCanvas } from "src/infrastructure/pdf/canvas";
import {
  extractPeriodTitle,
  parseExperienceSubgroups,
  stripExtractedTitleAndSubtitle,
} from "src/domain/markdown";
import { measureMarkdown } from "src/domain/cv/measure";
import { drawMarkdown } from "src/infrastructure/pdf/markdown";
import {
  CARD_TOP_PAD,
  CHIP_GAP,
  CHIP_PAD_BOTTOM,
  CHIP_PAD_TOP,
  CHIP_SUBTITLE_H,
  CHIP_TITLE_H,
  COMPANY_ROW_H,
  DATES_ROW_H,
  M,
  PAGE_H,
  PAGE_W,
  cardHeight,
  chipBodyTopPad,
} from "src/domain/cv/layout";

export function sectionTitle(
  doc: PdfCanvas,
  C: CVColors,
  label: string,
  x: number,
  y: number,
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.primary);
  doc.text(label.toUpperCase(), x, y);
  doc.setDrawColor(...C.primary);
  doc.setLineWidth(1.2);
  doc.line(x, y + 3, x + 28, y + 3);
  return y + 18;
}

export function tag(
  doc: PdfCanvas,
  C: CVColors,
  label: string,
  x: number,
  y: number,
  featured: boolean,
  baseX: number,
  maxX: number,
): { x: number; y: number } {
  const tw = doc.getTextWidth(label) + 16;
  if (x + tw > baseX + maxX) {
    x = baseX;
    y += 22;
  }
  if (featured) {
    doc.setFillColor(...C.accent);
    doc.roundedRect(x, y - 10, tw, 15, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.base);
  } else {
    doc.setFillColor(...C.surface);
    doc.setDrawColor(...C.border);
    doc.roundedRect(x, y - 10, tw, 15, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.white);
  }
  doc.text(label, x + 8, y + 1);
  return { x: x + tw + 5, y };
}

export function drawJobCard(
  doc: PdfCanvas,
  C: CVColors,
  job: ExperienceEntry,
  subgroups: string[],
  x: number,
  w: number,
  startY: number,
  logo: string | null,
  bodyTopPad: number,
): number {
  const cardH = cardHeight(doc, subgroups, w, bodyTopPad);
  const LOGO = 16;

  // Card background. The card itself draws no left accent bar; every
  // period chip draws its own 4pt bar on the left, including the
  // single-period case. The bar's color is always the primary color
  // so single-period and multi-period jobs read consistently.
  doc.setFillColor(...C.surface);
  doc.setDrawColor(...C.border);
  doc.roundedRect(x - 12, startY - 10, w + 24, cardH, 4, 4, "FD");

  let y = startY + CARD_TOP_PAD;

  // Company + logo. Re-drawn for every segment so a job continued on the
  // next page still says who it belongs to.
  if (logo) {
    try {
      doc.addImage(logo, "PNG", x, y - LOGO + 2, LOGO, LOGO);
    } catch {
      /* noop */
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.white);
  doc.text(job.title, x + (logo ? LOGO + 6 : 0), y);
  y += COMPANY_ROW_H;

  // Dates
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.muted);
  doc.text(`${job.date_from} — ${job.date_to}`, x, y);
  y += DATES_ROW_H;

  for (let i = 0; i < subgroups.length; i++) {
    // Render each period as a chip inside the parent card. Both
    // periods share the same primary color so they read as siblings
    // of one experience, not as two competing entries. A card-wide
    // accent bar is drawn on top of the card (single-period only);
    // for multi-period jobs each chip draws its own 4pt left bar in
    // the primary color to mark the period.
    const meta = extractPeriodTitle(subgroups[i], i);
    const chipColor = C.primary as unknown as [number, number, number];

    // Chip body height drives the chip frame height. `bodyTopPad` comes
    // from `chipBodyTopPad` so the measurer and the drawer agree.
    const bodyH = measureMarkdown(doc, stripExtractedTitleAndSubtitle(subgroups[i]), w);
    const chipH =
      CHIP_PAD_TOP + CHIP_TITLE_H + CHIP_SUBTITLE_H + bodyTopPad + bodyH + CHIP_PAD_BOTTOM;

    // Draw the chip frame: only a subtle base fill (no border, since
    // the parent card already provides one and a nested border would
    // feel busy). The chip is flush with the card's interior
    // (same x and width) so only the card's outline is visible.
    doc.setFillColor(...C.base);
    doc.roundedRect(x - 12, y, w + 24, chipH, 4, 4, "F");

    // Colored left accent bar inside the chip, aligned with the
    // card's accent bar.
    doc.setFillColor(...chipColor);
    doc.rect(x - 12, y, 4, chipH, "F");

    // Title inside the chip.
    const innerX = x + 2;
    let innerY = y + CHIP_PAD_TOP + 9;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...chipColor);
    doc.text(meta.title, innerX, innerY);

    // Subtitle on its own line below the title.
    if (meta.subtitle) {
      innerY += CHIP_SUBTITLE_H;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...C.muted);
      doc.text(meta.subtitle, innerX, innerY);
    }

    // Body content with the title and subtitle stripped. The body sits
    // to the right of the colored accent bar (4pt) with a small
    // padding. bodyTopPad leaves a clear gap between the subtitle and
    // the first body heading so the two never collide.
    const bodyY = y + CHIP_PAD_TOP + CHIP_TITLE_H + CHIP_SUBTITLE_H + bodyTopPad;
    drawMarkdown(doc, C, stripExtractedTitleAndSubtitle(subgroups[i]), innerX, w + 12, bodyY);

    y += chipH;
    if (i < subgroups.length - 1) y += CHIP_GAP;
  }

  return startY + cardH + 14;
}

// Draw a whole job (all of its periods) as one card.
export function drawJob(
  doc: PdfCanvas,
  C: CVColors,
  job: ExperienceEntry,
  x: number,
  w: number,
  startY: number,
  logo: string | null,
): number {
  const subgroups = parseExperienceSubgroups(job.description);
  return drawJobCard(doc, C, job, subgroups, x, w, startY, logo, chipBodyTopPad(subgroups.length));
}

export function continuationHeader(doc: PdfCanvas, C: CVColors): number {
  let y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C.white);
  doc.text(PROFILE.name, M, y + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.primary);
  doc.text(PROFILE.role, M, y + 22);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(M, y + 28, PAGE_W - M, y + 28);
  return y + 56;
}

export function drawFooter(doc: PdfCanvas, C: CVColors, profileAltImg: string | null) {
  const footerY = PAGE_H - 24;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(M, footerY - 14, PAGE_W - M, footerY - 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);

  const yearStr = String(new Date().getFullYear());
  const yearW = doc.getTextWidth(yearStr);
  const imgSize = 12;
  const imgX = PAGE_W - M - imgSize;
  const yearX = imgX - 8 - yearW;
  const textY = footerY + imgSize / 4;
  const imgY = footerY - imgSize / 2;

  doc.text(`Generated from ${window.location.hostname}`, M, textY);
  doc.text(yearStr, yearX, textY);

  if (profileAltImg) {
    try {
      doc.addImage(profileAltImg, "PNG", imgX, imgY, imgSize, imgSize);
    } catch {
      /* noop */
    }
  }
}

export function startPage(doc: PdfCanvas, W: number, C: CVColors) {
  doc.setFillColor(...C.base);
  doc.rect(0, 0, W, PAGE_H, "F");
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, W, 3, "F");
}

export const SIDEBAR_W = 160;
const PROFILE_SIZE = 72;
const ICON_SIZE = 12;

export function getBioText(data: AboutEntry[]): string {
  return data[0]?.bio ?? "";
}

export interface SidebarContent {
  aboutData: AboutEntry[];
  featuredSkills: string[];
  otherSkills: string[];
  profileImg: string | null;
  githubIcon: string | null;
  linkedinIcon: string | null;
}

function drawIcon(doc: PdfCanvas, image: string | null, x: number, y: number): void {
  if (!image) return;
  try {
    doc.addImage(image, "PNG", x, y, ICON_SIZE, ICON_SIZE);
  } catch {
    /* a broken logo must not stop the CV */
  }
}

/** Left column: portrait, contact, bio, languages, education and the skill tags. */
export function drawSidebar(
  doc: PdfCanvas,
  C: CVColors,
  content: SidebarContent,
  x: number,
  width: number,
  startY: number,
): number {
  const { aboutData, featuredSkills, otherSkills, profileImg, githubIcon, linkedinIcon } = content;
  let y = startY;

  if (profileImg) {
    try {
      const imgX = x + (width - PROFILE_SIZE) / 2;
      doc.addImage(profileImg, "PNG", imgX, y, PROFILE_SIZE, PROFILE_SIZE);
      doc.setDrawColor(...C.primary);
      doc.setLineWidth(1.5);
      doc.ellipse(
        imgX + PROFILE_SIZE / 2,
        y + PROFILE_SIZE / 2,
        PROFILE_SIZE / 2,
        PROFILE_SIZE / 2,
        "S",
      );
      y += PROFILE_SIZE + 24;
    } catch {
      /* a missing portrait must not stop the CV */
    }
  }

  if (aboutData[0]?.email) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...C.white);
    doc.text("@", x + ICON_SIZE / 2, y + 9, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.textWithLink(aboutData[0].email, x + ICON_SIZE + 4, y + 8, {
      url: `mailto:${aboutData[0].email}`,
    });
  }
  y += 16;

  drawIcon(doc, githubIcon, x, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.textWithLink(PROFILE.github.label, x + ICON_SIZE + 4, y + 8, { url: PROFILE.github.url });
  y += 16;

  drawIcon(doc, linkedinIcon, x, y);
  doc.textWithLink(PROFILE.linkedin.label, x + ICON_SIZE + 4, y + 8, {
    url: PROFILE.linkedin.url,
  });
  y += 34;

  y = sectionTitle(doc, C, "ABOUT", x, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  const bio = doc.splitTextToSize(getBioText(aboutData), width - 8);
  doc.text(bio, x, y);
  y = y + (bio.length - 1) * 10 + 10 + 22;

  if (aboutData[0]?.location) {
    y = sectionTitle(doc, C, "LOCATION", x, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.muted);
    doc.text(aboutData[0].location, x, y);
    y = y + 11 + 22;
  }

  const languages = aboutData[0]?.languages ?? [];
  if (languages.length > 0) {
    y = sectionTitle(doc, C, "LANGUAGES", x, y);
    for (const lang of languages) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...C.white);
      const label = `${lang.language} · ${lang.level}`;
      const tw = doc.getTextWidth(label);
      doc.setFillColor(...C.surface);
      doc.setDrawColor(...C.border);
      doc.roundedRect(x, y - 8, tw + 12, 13, 2, 2, "FD");
      doc.text(label, x + 6, y + 1);
      y += 18;
    }
    y = y - 18 + 5 + 22;
  }

  const education = aboutData[0]?.education ?? [];
  if (education.length > 0) {
    y = sectionTitle(doc, C, "EDUCATION", x, y);
    for (const edu of education) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...C.white);
      doc.text(edu.degree, x, y);
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...C.muted);
      doc.text(edu.year ? `${edu.institution} · ${edu.year}` : edu.institution, x, y);
      y += 12;
    }
    y = y - 12 + 8 + 22;
  }

  y = sectionTitle(doc, C, "SKILLS", x, y);
  let tx = x;
  for (const skill of featuredSkills) {
    const next = tag(doc, C, skill, tx, y, true, x, width);
    tx = next.x;
    y = next.y;
  }
  for (const skill of otherSkills) {
    const next = tag(doc, C, skill, tx, y, false, x, width);
    tx = next.x;
    y = next.y;
  }
  return y + 20;
}

/** Name, role and the rule under them. Returns the y where the body starts. */
export function drawHeader(doc: PdfCanvas, pageWidth: number, C: CVColors): number {
  let y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...C.white);
  doc.text(PROFILE.name, M, y + 20);
  y += 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.primary);
  doc.text(PROFILE.role, M, y + 10);
  y += 16;

  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(M, y, pageWidth - M, y);
  return y + 20;
}

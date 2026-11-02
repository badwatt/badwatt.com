import type { AboutEntry } from "src/domain/content";
import type { CVColors } from "src/domain/cv/theme";
import { PROFILE } from "src/domain/profile";
import type { PdfCanvas } from "src/infrastructure/pdf/canvas";
import { sectionTitle, tag } from "src/infrastructure/pdf/sections";

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

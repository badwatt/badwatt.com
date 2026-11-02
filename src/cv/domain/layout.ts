import { stripExtractedTitleAndSubtitle } from "src/content/domain/markdown";
import { measureMarkdown, type PdfMetrics } from "src/cv/domain/measure";

export const PAGE_W = 595;
export const PAGE_H = 842;
export const M = 36;

export const CARD_TOP_PAD = 14;
export const CARD_BOTTOM_PAD = 12;
export const COMPANY_ROW_H = 18;
export const DATES_ROW_H = 14;
export const CHIP_PAD_TOP = 8;
export const CHIP_PAD_BOTTOM = 8;
export const CHIP_TITLE_H = 11;
export const CHIP_SUBTITLE_H = 11; // subtitle line (9pt) + small gap
export const CHIP_GAP = 6;

export function chipBodyTopPad(periodCount: number): number {
  return periodCount > 1 ? 30 : 2;
}

export function cardHeight(
  doc: PdfMetrics,
  subgroups: string[],
  w: number,
  bodyTopPad: number,
): number {
  let h = CARD_TOP_PAD + COMPANY_ROW_H + DATES_ROW_H;
  for (let i = 0; i < subgroups.length; i++) {
    h += CHIP_PAD_TOP + CHIP_TITLE_H + CHIP_SUBTITLE_H + bodyTopPad;
    h += measureMarkdown(doc, stripExtractedTitleAndSubtitle(subgroups[i]), w);
    h += CHIP_PAD_BOTTOM;
    if (i < subgroups.length - 1) h += CHIP_GAP;
  }
  return h + CARD_BOTTOM_PAD;
}

export function fitSubgroups(
  doc: PdfMetrics,
  subgroups: string[],
  w: number,
  bodyTopPad: number,
  available: number,
): number {
  let fit = 0;
  while (
    fit < subgroups.length &&
    cardHeight(doc, subgroups.slice(0, fit + 1), w, bodyTopPad) <= available
  ) {
    fit++;
  }
  return fit;
}

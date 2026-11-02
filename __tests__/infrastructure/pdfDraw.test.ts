import { describe, expect, it, vi } from "vite-plus/test";
import type { PdfCanvas } from "src/infrastructure/pdf/canvas";
import { drawMarkdown } from "src/infrastructure/pdf/markdown";
import { sectionTitle, startPage } from "src/infrastructure/pdf/sections";
import { buildColors, getThemeById } from "src/domain/cv/theme";

const C = buildColors(getThemeById("default").colors);

function createFakeCanvas(): PdfCanvas & { texts: string[]; fills: number } {
  const state = { texts: [] as string[], fills: 0 };
  return {
    ...state,
    get texts() {
      return state.texts;
    },
    get fills() {
      return state.fills;
    },
    addImage: vi.fn(),
    addPage: vi.fn(),
    getTextWidth: () => 10,
    line: vi.fn(),
    rect: vi.fn(() => {
      state.fills += 1;
    }),
    roundedRect: vi.fn(),
    setDrawColor: vi.fn(),
    setFillColor: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setLineWidth: vi.fn(),
    setTextColor: vi.fn(),
    splitTextToSize: (text: string) => text.split("\n"),
    text: (text: string) => {
      state.texts.push(text);
    },
  };
}

describe("PdfCanvas port", () => {
  it("draws a section title without a pdf engine", () => {
    const canvas = createFakeCanvas();

    expect(sectionTitle(canvas, C, "about", 36, 100)).toBe(118);
    expect(canvas.texts).toEqual(["ABOUT"]);
  });

  it("advances through markdown blocks", () => {
    const canvas = createFakeCanvas();

    const y = drawMarkdown(canvas, C, "## A heading\n\nA paragraph", 36, 200, 100);

    expect(y).toBeGreaterThan(100);
    expect(canvas.texts).toContain("A heading");
  });

  it("paints the page background and the top bar", () => {
    const canvas = createFakeCanvas();

    startPage(canvas, 595, C);

    expect(canvas.fills).toBe(2);
  });
});

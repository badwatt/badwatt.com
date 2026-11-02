/**
 * The drawing surface the CV needs. jsPDF satisfies it, and so does any stub in
 * a test: the layout code never depends on the PDF engine.
 */
export interface PdfCanvas {
  setFont(family: string, style?: string): void;
  setFontSize(size: number): void;
  setTextColor(r: number, g: number, b: number): void;
  setDrawColor(r: number, g: number, b: number): void;
  setFillColor(r: number, g: number, b: number): void;
  setLineWidth(width: number): void;
  text(text: string | string[], x: number, y: number, options?: { align?: string }): void;
  textWithLink(text: string, x: number, y: number, options: { url: string }): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  rect(x: number, y: number, w: number, h: number, style?: string): void;
  ellipse(x: number, y: number, rx: number, ry: number, style?: string): void;
  roundedRect(
    x: number,
    y: number,
    w: number,
    h: number,
    rx: number,
    ry: number,
    style?: string,
  ): void;
  splitTextToSize(text: string, width: number): string[];
  getTextWidth(text: string): number;
  addImage(image: string, format: string, x: number, y: number, w: number, h: number): void;
  addPage(): void;
}

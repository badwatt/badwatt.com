import type { CVColors } from "src/cv/domain/theme";
import { getListItemInline, tokenize, type Token } from "src/domain/markdown";
import type { PdfCanvas } from "src/cv/infrastructure/pdf/canvas";
import type { Tokens } from "marked";

function drawInline(
  doc: PdfCanvas,
  C: CVColors,
  tokens: Token[],
  x: number,
  w: number,
  y: number,
): number {
  // Walk inline tokens and draw them left-to-right with the right font style.
  // Word-wrap is handled per-chunk; we just print each chunk on the current line
  // using its own font + size, then advance y if any chunk wrapped.
  // Returns y advanced by at least one line height (lineH) so callers can
  // stack the next block without overlap.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);

  let cursorX = x;
  const lineH = 11;
  let maxLines = 1;
  const startY = y;

  const drawChunk = (text: string, style: "normal" | "bold" | "italic") => {
    doc.setFont("helvetica", style);
    const lines = doc.splitTextToSize(text, w - (cursorX - x));
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (i > 0) {
        y += lineH;
        cursorX = x;
      }
      doc.text(line, cursorX, y);
      cursorX += doc.getTextWidth(line);
    }
    if (lines.length > maxLines) maxLines = lines.length;
  };

  for (const t of tokens) {
    if (t.type === "br") {
      y += lineH;
      cursorX = x;
      // Track the number of lines drawn so far so the return value reflects
      // the full block height even if a later chunk draws fewer lines.
      maxLines = Math.floor((y - startY) / lineH) + 1;
      continue;
    }
    const text = (t as unknown as { text?: string }).text ?? "";
    if (!text) continue;
    if (t.type === "strong") {
      drawChunk(text, "bold");
    } else if (t.type === "em") {
      drawChunk(text, "italic");
    } else {
      drawChunk(text, "normal");
    }
  }

  // Always advance by at least one line height, even when text didn't wrap
  // or when no chunks were drawn. This keeps callers from stacking blocks
  // on top of each other.
  return startY + lineH * maxLines;
}

function drawMarkdownToken(
  doc: PdfCanvas,
  C: CVColors,
  token: Token,
  x: number,
  w: number,
  startY: number,
): number {
  let y = startY;
  switch (token.type) {
    case "heading": {
      const h = token as Tokens.Heading;
      const depth = h.depth;
      const size = depth === 1 ? 11 : depth === 2 ? 10 : 9.5;
      const lineH = depth === 1 ? 14 : 13;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(size);
      doc.setTextColor(...C.primary);
      const lines = doc.splitTextToSize(h.text, w);
      for (const line of lines) {
        doc.text(line, x, y);
        y += lineH;
      }
      break;
    }
    case "paragraph": {
      const p = token as Tokens.Paragraph;
      const inlineTokens: Token[] = p.tokens as Token[];
      y = drawInline(doc, C, inlineTokens, x, w, y);
      break;
    }
    case "list": {
      const list = token as Tokens.List;
      y += 2;
      for (let i = 0; i < list.items.length; i++) {
        const item = list.items[i];
        const marker = list.ordered ? `${i + 1}.` : "•";
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...C.accent);
        doc.text(marker, x, y);
        const inline = getListItemInline(item);
        y = drawInline(doc, C, inline, x + 14, w - 14, y);
        y += 3;
      }
      break;
    }
    case "blockquote": {
      const bq = token as Tokens.Blockquote;
      const startY = y;
      for (const t of bq.tokens) {
        y = drawMarkdownToken(doc, C, t as Token, x + 10, w - 10, y);
      }
      // Draw the left rule aligned with the first and last text lines.
      // Text drawn at the baseline `startY` extends roughly from `startY - 7`
      // (ascender of a 9pt helvetica glyph) to `y + 2` (descender of the
      // last line). The line is offset slightly above the visual top and
      // below the visual bottom to bracket the text cleanly.
      doc.setDrawColor(...C.primary);
      doc.setLineWidth(0.6);
      doc.line(x + 6, startY - 12, x + 6, y - 4);
      y += 2;
      break;
    }
    case "code": {
      const code = token as Tokens.Code;
      const lineH = 11;
      const lines = code.text.split("\n");
      const blockH = lines.length * lineH + 8;
      doc.setFillColor(...C.base);
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, w, blockH, 2, 2, "FD");
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...C.white);
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], x + 4, y + 10 + i * lineH);
      }
      y += blockH;
      break;
    }
    default:
      break;
  }
  return y;
}

const BLOCK_GAP = 4;

export function drawMarkdown(
  doc: PdfCanvas,
  C: CVColors,
  raw: string,
  x: number,
  w: number,
  startY: number,
): number {
  let y = startY;
  let first = true;
  for (const token of tokenize(raw)) {
    // Drop `hr` tokens here; callers (e.g. drawJob) split on them
    // explicitly so they can render sub-periods with proper spacing
    // instead of a horizontal rule line.
    if (token.type === "space" || token.type === "hr") continue;
    if (!first) y += BLOCK_GAP;
    first = false;
    y = drawMarkdownToken(doc, C, token, x, w, y);
  }
  return y;
}

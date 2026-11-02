import { tokenize, getListItemInline, type Token } from "src/domain/markdown";
import type { Tokens } from "marked";

/** The slice of the PDF document the measurer needs; jsPDF satisfies it. */
export interface PdfMetrics {
  splitTextToSize(text: string, width: number): string[];
}

function measureText(doc: PdfMetrics, text: string, w: number, lineHeight: number): number {
  const lines = doc.splitTextToSize(text, w);
  return lines.length * lineHeight;
}

function measureToken(doc: PdfMetrics, token: Token, w: number): number {
  switch (token.type) {
    case "heading": {
      const depth = (token as Tokens.Heading).depth;
      const lineHeight = depth === 1 ? 14 : 13;
      return measureText(doc, (token as Tokens.Heading).text, w, lineHeight) + 2;
    }
    case "paragraph":
      return measureText(doc, (token as Tokens.Paragraph).text, w, 11) + 2;
    case "list": {
      const list = token as Tokens.List;
      let h = 2;
      for (const item of list.items) {
        const inline = getListItemInline(item);
        let inlineText = "";
        for (const t of inline) {
          const txt = (t as { text?: string }).text;
          if (txt) inlineText += txt;
        }
        h += measureText(doc, inlineText, w - 14, 11) + 3;
      }
      return h + 2;
    }
    case "blockquote": {
      const bq = token as Tokens.Blockquote;
      let h = 2;
      for (const t of bq.tokens) {
        h += measureToken(doc, t as Token, w - 14);
      }
      return h + 4;
    }
    case "code": {
      const code = token as Tokens.Code;
      const lineH = 11;
      return code.text.split("\n").length * lineH + 10;
    }
    default:
      return 0;
  }
}

export function measureMarkdown(doc: PdfMetrics, raw: string, w: number): number {
  let h = 0;
  let first = true;
  for (const token of tokenize(raw)) {
    if (token.type === "space") continue;
    if (!first) h += 4;
    first = false;
    h += measureToken(doc, token, w);
  }
  return h;
}

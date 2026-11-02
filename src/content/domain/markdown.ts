import { marked, type Token, type Tokens } from "marked";

export type { Token };

function normalizeMarkers(text: string): string {
  return text.replace(/^[ \t]*[\u2022\u2023\u2043\u204C\u204D\u2219\u25E6\u00B7][ \t]+/gm, "- ");
}

export function tokenize(text: string): Token[] {
  return marked.lexer(normalizeMarkers(text));
}

export function tokenizeInline(text: string): Tokens.Generic[] {
  const tokens = marked.lexer(normalizeMarkers(text));
  for (const t of tokens) {
    if (t.type === "paragraph" && t.tokens) {
      return t.tokens as Tokens.Generic[];
    }
  }
  return [{ type: "text", raw: text, text } as Tokens.Generic];
}

export function parseExperienceSubgroups(text: string): string[] {
  const tokens = marked.lexer(normalizeMarkers(text));
  const groups: string[][] = [[]];
  for (const t of tokens) {
    if (t.type === "hr") {
      groups.push([]);
      continue;
    }
    groups[groups.length - 1].push((t as { raw: string }).raw);
  }
  return groups.map((g) => g.join("\n").trim()).filter((g) => g.length > 0);
}

export function extractPeriodTitle(
  body: string,
  index: number,
): { title: string; subtitle?: string } {
  const tokens = marked.lexer(normalizeMarkers(body));
  let title: string | undefined;
  let subtitle: string | undefined;
  for (const t of tokens) {
    if (t.type === "heading" && (t as Tokens.Heading).depth === 1) {
      title = (t as Tokens.Heading).text.split("\n")[0]?.trim();
      break;
    }
  }
  if (!title) {
    for (const t of tokens) {
      if (t.type === "list") {
        const firstItem = (t as Tokens.List).items[0];
        title = firstItem?.text.split("\n")[0]?.trim();
        break;
      }
    }
  }
  for (const t of tokens) {
    if (t.type === "blockquote") {
      subtitle = (t as Tokens.Blockquote).text.split("\n")[0]?.trim();
      break;
    }
  }
  return {
    title: title ?? `Period ${index + 1}`,
    subtitle: subtitle || undefined,
  };
}

export function stripExtractedTitleAndSubtitle(body: string): string {
  const tokens = marked.lexer(normalizeMarkers(body));
  const skipTypes = new Set<string>();
  let sawH1 = false;
  let sawFirstBlockquote = false;
  for (const t of tokens) {
    if (t.type === "heading" && (t as Tokens.Heading).depth === 1 && !sawH1) {
      skipTypes.add(t.raw);
      sawH1 = true;
    } else if (t.type === "blockquote" && !sawFirstBlockquote) {
      skipTypes.add(t.raw);
      sawFirstBlockquote = true;
    }
  }
  if (skipTypes.size === 0) return body;
  const lines = body.split("\n");
  const kept: string[] = [];
  let skipping = false;
  for (const line of lines) {
    if (skipTypes.has(line)) {
      skipping = true;
      continue;
    }
    if (skipping && line.trim() === "") continue;
    skipping = false;
    kept.push(line);
  }
  return kept.join("\n").trim();
}

export function getListItemInline(item: Tokens.ListItem): Token[] {
  for (const t of item.tokens) {
    if (t.type === "paragraph") {
      const p = t as Tokens.Paragraph;
      return p.tokens as Token[];
    } else if (t.type === "text") {
      const text = t as Tokens.Text;
      return text.tokens as Token[];
    }
  }
  return [];
}

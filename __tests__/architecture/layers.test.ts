import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vite-plus/test";

const SRC = path.resolve(process.cwd(), "src");
const CODE = /\.(ts|tsx|astro)$/;

interface Edge {
  from: string;
  to: string;
  specifier: string;
}

function codeFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return codeFiles(full);
    return CODE.test(entry.name) ? [full] : [];
  });
}

function resolve(specifier: string): string | null {
  const base = path.join(SRC, specifier.replace(/^src\//, ""));
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function specifiersOf(file: string): string[] {
  const text = fs.readFileSync(file, "utf8");
  return [
    ...text.matchAll(/from "(src\/[^"]+)"/g),
    ...text.matchAll(/import\("(src\/[^"]+)"\)/g),
  ].map((match) => match[1]);
}

function edges(): Edge[] {
  return codeFiles(SRC).flatMap((file) =>
    specifiersOf(file).flatMap((specifier) => {
      const target = resolve(specifier);
      if (!target) throw new Error(`cannot resolve ${specifier} from ${file}`);
      return [{ from: file, to: target, specifier }];
    }),
  );
}

const relative = (file: string) => path.relative(SRC, file).split(path.sep);
const capability = (file: string) => relative(file)[0];
const layer = (file: string) => relative(file)[1] ?? "";

const ALL_EDGES = edges();

const PUBLIC_UI_ENTRIES: Record<string, string[]> = {
  contact: ["contact/ui/Contact.tsx"],
  cv: ["cv/ui/CvLauncher.tsx"],
  theme: ["theme/ui/ThemeToggle.tsx"],
};

const asPath = (file: string) => path.relative(SRC, file).split(path.sep).join("/");

const PRESENTATION_DIRS = ["components", "hooks", "sections", "views", "layouts"];

function offenders(rule: (edge: Edge) => boolean): string[] {
  return ALL_EDGES.filter(rule).map(({ from, specifier }) => {
    return `${path.relative(SRC, from)} -> ${specifier}`;
  });
}

describe("architecture rules", () => {
  it("reads the tree it claims to check", () => {
    expect(ALL_EDGES.length).toBeGreaterThan(50);
  });

  it("keeps pages private to the router", () => {
    const broken = offenders(
      ({ from, to }) => capability(to) === "pages" && !from.startsWith(path.join(SRC, "pages")),
    );

    expect(broken).toEqual([]);
  });

  it("keeps domain and application free of adapters and views", () => {
    const broken = offenders(({ from, to }) => {
      const sourceLayer = layer(from);
      if (sourceLayer !== "domain" && sourceLayer !== "application") return false;
      return ["infrastructure", "ui", "components", "views", "pages"].includes(layer(to));
    });

    expect(broken).toEqual([]);
  });

  it("lets the site reach a capability only through its public entry", () => {
    const broken = ALL_EDGES.filter(
      ({ from, to }) =>
        capability(from) === "site" && capability(to) !== "site" && layer(to) === "ui",
    )
      .filter(({ to }) => !(PUBLIC_UI_ENTRIES[capability(to)] ?? []).includes(asPath(to)))
      .map(({ from, specifier }) => `${asPath(from)} -> ${specifier}`);

    expect(broken).toEqual([]);
  });

  it("keeps presentation inside a ui folder", () => {
    const broken = codeFiles(SRC).flatMap((file) => {
      const segments = relative(file).slice(0, -1);
      const misplaced = segments.some(
        (segment, index) => PRESENTATION_DIRS.includes(segment) && segments[index - 1] !== "ui",
      );
      return misplaced ? [asPath(file)] : [];
    });

    expect(broken).toEqual([]);
  });

  it("never imports another capability's infrastructure", () => {
    const broken = offenders(
      ({ from, to }) =>
        capability(from) !== "pages" &&
        layer(to) === "infrastructure" &&
        capability(to) !== capability(from),
    );

    expect(broken).toEqual([]);
  });
});

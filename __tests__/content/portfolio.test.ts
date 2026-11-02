import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vite-plus/test";

const portfolioDir = path.resolve(process.cwd(), "src/content/portfolio");

const entries = fs
  .readdirSync(portfolioDir)
  .filter((file) => file.endsWith(".md"))
  .map((file) => {
    const source = fs.readFileSync(path.join(portfolioDir, file), "utf8");
    const field = (name: string) => source.match(new RegExp(`^${name}: "(.*)"$`, "m"))?.[1];
    return { file, title: field("title"), image: field("image"), url: field("url") };
  });

describe("portfolio content", () => {
  it("declares title, image and url for every entry", () => {
    expect(entries.length).toBeGreaterThan(0);
    for (const { file, title, image, url } of entries) {
      expect(title, file).toBeTruthy();
      expect(image, file).toBeTruthy();
      expect(url, file).toMatch(/^https:\/\//);
    }
  });

  it("points every image at a file that exists", () => {
    for (const { file, image } of entries) {
      expect(fs.existsSync(path.resolve(portfolioDir, image ?? "")), `${file} -> ${image}`).toBe(
        true,
      );
    }
  });

  it("includes zix and prompty", () => {
    expect(entries.map(({ title }) => title)).toEqual(expect.arrayContaining(["zix", "prompty"]));
  });
});

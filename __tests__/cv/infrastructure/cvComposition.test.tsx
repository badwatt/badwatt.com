import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const rec = { page: 1, texts: [] as { text: string; page: number }[] };

vi.mock("jspdf", () => {
  class Recording {
    internal = { pageSize: { getWidth: () => 595, getHeight: () => 842 } };
    setTextColor = vi.fn();
    setFillColor = vi.fn();
    setDrawColor = vi.fn();
    setFont = vi.fn();
    setFontSize = vi.fn();
    setLineWidth = vi.fn();
    textWithLink = vi.fn();
    line = vi.fn();
    rect = vi.fn();
    roundedRect = vi.fn();
    ellipse = vi.fn();
    addImage = vi.fn();
    addPage = vi.fn(() => {
      rec.page += 1;
    });
    output = vi.fn(() => new Blob(["pdf"], { type: "application/pdf" }));
    text = vi.fn((text: string) => {
      rec.texts.push({ text: String(text), page: rec.page });
    });
    splitTextToSize = vi.fn((text: string, width: number) => {
      const perLine = Math.max(1, Math.floor(width / 4.5));
      return String(text).match(new RegExp(`.{1,${perLine}}`, "g")) ?? [""];
    });
    getTextWidth = vi.fn((text: string) => String(text).length * 4.5);
  }
  return { jsPDF: Recording };
});

const { generateCV } = await import("src/cv/infrastructure/pdf/generateCv");
const { getThemeById } = await import("src/cv/domain/theme");

const paragraph =
  "I feel very fortunate to have found what I am passionate about and to make it my job. I build software, keep learning, and care about the details.";

const experience = [
  {
    title: "Openbank",
    image: "",
    date_from: "June 2023",
    date_to: "Now",
    url: "https://openbank.es/",
    description: [
      "# Plexus",
      "",
      "> april 2025 - now",
      "",
      "# Projects:",
      "",
      "- Private client area for the bank's customers",
      "- AI chat with suggested responses",
      "- Call center agent performance dashboard",
      "",
      "# Tasks:",
      "",
      "- Building and maintaining the private client area",
      "- Developing the AI chat interface, including suggested responses",
      "- Integrating REST APIs for the client area and the chat",
      "",
      "# Technologies:",
      "",
      "TypeScript, React.js, Jest.js, Git, GitHub, Postman",
      "",
      "---",
      "# Azama",
      "",
      "> 2023 - 2025",
      "",
      "# Tasks:",
      "",
      "- Migrating the project from the legacy codebase",
    ].join("\n"),
  },
];

const about = [
  {
    email: "info@badwatt.com",
    location: "Asturias, Spain",
    languages: [
      { language: "Spanish", level: "Native" },
      { language: "English", level: "C1" },
    ],
    education: [{ institution: "U.N.E.D.", degree: "Business Administration", year: "2014" }],
    bio: [paragraph, paragraph, paragraph].join("\n\n"),
  },
];

const skills = [
  { title: "react.js", image: "", url: "", featured: true },
  { title: "typescript", image: "", url: "", featured: true },
  ...["vue.js", "node.js", "docker", "podman", "vitest", "jest", "astro", "sql", "tailwind"].map(
    (title) => ({ title, image: "", url: "", featured: false }),
  ),
];

describe("CV composition", () => {
  beforeEach(() => {
    rec.page = 1;
    rec.texts = [];
    global.fetch = vi.fn().mockRejectedValue(new Error("no network in tests"));
  });

  it("starts the experience on the first page, beside the sidebar", async () => {
    await generateCV(getThemeById("default"), experience, about, skills);

    const pageOf = (text: string) => rec.texts.find((t) => t.text.includes(text))?.page;

    expect(rec.texts.length).toBeGreaterThan(20);
    expect(pageOf("SKILLS")).toBe(1);
    expect(pageOf("Openbank")).toBe(1);
    expect(pageOf("Plexus")).toBe(1);
  });
});

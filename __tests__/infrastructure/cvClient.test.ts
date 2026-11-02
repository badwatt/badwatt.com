import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { createCvClient } from "src/infrastructure/cvClient";
import { testAboutData, testExperienceData, testSkillsData } from "../fixtures";

vi.mock("src/infrastructure/pdf/generateCv", () => ({
  generateCV: vi.fn().mockResolvedValue("blob:generated"),
}));

const content = {
  experienceData: testExperienceData,
  aboutData: testAboutData,
  skillsData: testSkillsData,
};

describe("cvClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the token to the verify endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    expect(await createCvClient(content).verifyCaptcha("tok")).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("/api/cap/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "tok" }),
    });
  });

  it("reports a rejected captcha", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });

    expect(await createCvClient(content).verifyCaptcha("tok")).toBe(false);
  });

  it("renders the pdf with the content it was built with", async () => {
    const { generateCV } = await import("src/infrastructure/pdf/generateCv");
    const theme = { id: "default" } as Parameters<typeof generateCV>[0];

    expect(await createCvClient(content).render(theme)).toBe("blob:generated");
    expect(generateCV).toHaveBeenCalledWith(
      theme,
      testExperienceData,
      testAboutData,
      testSkillsData,
    );
  });
});

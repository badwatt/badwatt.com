import { describe, expect, it, vi } from "vite-plus/test";
import { requestCv, type CvPorts } from "src/application/requestCv";
import { getThemeById } from "src/domain/cv/theme";

const theme = getThemeById("default");

function createPorts(overrides: Partial<CvPorts> = {}) {
  const verifyCaptcha = vi.fn().mockResolvedValue(true);
  const render = vi.fn().mockResolvedValue("blob:cv");
  const ports: CvPorts = { verifyCaptcha, render, ...overrides };
  return { ports, verifyCaptcha, render };
}

describe("requestCv", () => {
  it("returns the pdf url when verification and rendering succeed", async () => {
    const { ports, render } = createPorts();

    expect(await requestCv("tok", theme, ports)).toEqual({ ok: true, url: "blob:cv" });
    expect(render).toHaveBeenCalledWith(theme);
  });

  it("does not render when the captcha is rejected", async () => {
    const { ports, render } = createPorts({ verifyCaptcha: vi.fn().mockResolvedValue(false) });

    expect(await requestCv("tok", theme, ports)).toEqual({ ok: false, reason: "captcha" });
    expect(render).not.toHaveBeenCalled();
  });

  it("reports a generation failure and logs the error", async () => {
    const error = new Error("boom");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { ports } = createPorts({ render: vi.fn().mockRejectedValue(error) });

    expect(await requestCv("tok", theme, ports)).toEqual({ ok: false, reason: "generation" });
    expect(consoleSpy).toHaveBeenCalledWith("CV generation failed:", error);
    consoleSpy.mockRestore();
  });
});

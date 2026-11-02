import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { useCV } from "src/hooks/useCV";
import { createCvClient } from "src/infrastructure/cvClient";
import { getThemeById } from "src/domain/cv/theme";
import { testAboutData, testExperienceData, testSkillsData } from "../fixtures";

vi.mock("src/infrastructure/cvClient", () => ({ createCvClient: vi.fn() }));

const toastError = vi.fn();
vi.mock("react-hot-toast", () => ({
  default: { error: (...args: unknown[]) => toastError(...args) },
}));

const content = {
  experienceData: testExperienceData,
  aboutData: testAboutData,
  skillsData: testSkillsData,
};

const emerald = getThemeById("emerald");

function setup(overrides: { verifyCaptcha?: boolean; render?: () => Promise<string> } = {}) {
  const verifyCaptcha = vi.fn().mockResolvedValue(overrides.verifyCaptcha ?? true);
  const render = vi.fn(overrides.render ?? (() => Promise.resolve("blob:cv")));
  vi.mocked(createCvClient).mockReturnValue({ verifyCaptcha, render });

  const hook = renderHook(() => useCV(content));
  return { ...hook, verifyCaptcha, render };
}

describe("useCV", () => {
  beforeEach(() => {
    toastError.mockClear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts idle with the default theme and no viewer", () => {
    const { result } = setup();

    expect(result.current.step).toBe("idle");
    expect(result.current.theme.id).toBe("default");
    expect(result.current.viewerUrl).toBeNull();
  });

  it("opens and closes the theme picker", () => {
    const { result } = setup();

    act(() => result.current.openThemes());
    expect(result.current.step).toBe("themes");

    act(() => result.current.closeThemes());
    expect(result.current.step).toBe("idle");
  });

  it("returns to the captcha step when the picker was opened from there", () => {
    const { result } = setup();

    act(() => result.current.pickTheme(emerald));
    act(() => result.current.openThemes());
    act(() => result.current.closeThemes());

    expect(result.current.step).toBe("captcha");
  });

  it("keeps the chosen theme and asks for the captcha", () => {
    const { result } = setup();

    act(() => result.current.pickTheme(emerald));

    expect(result.current.theme.id).toBe("emerald");
    expect(result.current.step).toBe("captcha");
  });

  it("goes back to the picker from the captcha step", () => {
    const { result } = setup();

    act(() => result.current.pickTheme(emerald));
    act(() => result.current.backToThemes());

    expect(result.current.step).toBe("themes");
  });

  it("opens the viewer with the generated pdf", async () => {
    const { result, render } = setup();

    await act(async () => result.current.verify("tok"));

    expect(render).toHaveBeenCalledWith(expect.objectContaining({ id: "default" }));
    expect(result.current.viewerUrl).toBe("blob:cv");
    expect(result.current.step).toBe("idle");
  });

  it("returns to the captcha step when verification fails", async () => {
    const { result } = setup({ verifyCaptcha: false });

    await act(async () => result.current.verify("tok"));

    expect(result.current.viewerUrl).toBeNull();
    expect(result.current.step).toBe("captcha");
    expect(toastError).toHaveBeenCalledWith("Captcha verification failed. Please try again.");
  });

  it("returns to the captcha step when the render fails", async () => {
    const { result } = setup({ render: () => Promise.reject(new Error("boom")) });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => result.current.verify("tok"));

    expect(result.current.viewerUrl).toBeNull();
    expect(result.current.step).toBe("captcha");
    expect(toastError).toHaveBeenCalledWith("CV generation failed. Please try again.");
    consoleSpy.mockRestore();
  });

  it("revokes the blob url when the viewer closes", async () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const { result } = setup();

    await act(async () => result.current.verify("tok"));
    act(() => result.current.closeViewer());

    expect(revokeSpy).toHaveBeenCalledWith("blob:cv");
    expect(result.current.viewerUrl).toBeNull();
  });

  it("does nothing when there is no url to revoke", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const { result } = setup();

    act(() => result.current.closeViewer());

    expect(revokeSpy).not.toHaveBeenCalled();
  });
});

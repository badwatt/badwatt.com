import { useState } from "react";
import toast from "react-hot-toast";
import { requestCv } from "src/application/requestCv";
import { createCvClient, type CvContent } from "src/infrastructure/cvClient";
import { getThemeById, type CVTheme } from "src/utils/cvThemes";

export type CvStep = "idle" | "themes" | "captcha" | "loading";

const MESSAGES = {
  captcha: "Captcha verification failed. Please try again.",
  generation: "CV generation failed. Please try again.",
} as const;

/**
 * The CV flow shared by every view that offers it: pick a palette, clear the
 * captcha, render, open the viewer. Keeping it here means the two entry points
 * cannot drift apart.
 */
export function useCV(content: CvContent) {
  const [step, setStep] = useState<CvStep>("idle");
  const [theme, setTheme] = useState<CVTheme>(getThemeById("default"));
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [stepBeforeThemes, setStepBeforeThemes] = useState<CvStep>("idle");

  const openThemes = () => {
    setStepBeforeThemes(step === "captcha" ? "captcha" : "idle");
    setStep("themes");
  };

  const closeThemes = () => setStep(stepBeforeThemes);

  const pickTheme = (next: CVTheme) => {
    setTheme(next);
    setStep("captcha");
  };

  const backToThemes = () => {
    setStepBeforeThemes("captcha");
    setStep("themes");
  };

  const verify = async (token: string) => {
    setStep("loading");

    const result = await requestCv(token, theme, createCvClient(content));

    if (result.ok) {
      setViewerUrl(result.url);
      setStep("idle");
      return;
    }

    toast.error(MESSAGES[result.reason]);
    setStep("captcha");
  };

  const closeViewer = () => {
    if (viewerUrl) URL.revokeObjectURL(viewerUrl);
    setViewerUrl(null);
  };

  return {
    step,
    theme,
    viewerUrl,
    openThemes,
    closeThemes,
    pickTheme,
    backToThemes,
    verify,
    closeViewer,
  };
}

import type { CVTheme } from "src/cv/domain/theme";

/** Ports the CV request needs; both are implemented at the edge. */
export interface CvPorts {
  verifyCaptcha(token: string): Promise<boolean>;
  render(theme: CVTheme): Promise<string>;
}

export type CvRequest = { ok: true; url: string } | { ok: false; reason: "captcha" | "generation" };

/**
 * Verifies the token and renders the CV. The caller gets an outcome, never an
 * exception, so the UI only has to map reason to copy.
 */
export async function requestCv(token: string, theme: CVTheme, ports: CvPorts): Promise<CvRequest> {
  if (!(await ports.verifyCaptcha(token))) return { ok: false, reason: "captcha" };

  try {
    return { ok: true, url: await ports.render(theme) };
  } catch (error) {
    console.error("CV generation failed:", error);
    return { ok: false, reason: "generation" };
  }
}

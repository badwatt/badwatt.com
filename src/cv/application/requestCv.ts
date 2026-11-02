import type { CVTheme } from "src/cv/domain/theme";

export interface CvPorts {
  verifyCaptcha(token: string): Promise<boolean>;
  render(theme: CVTheme): Promise<string>;
}

export type CvRequest = { ok: true; url: string } | { ok: false; reason: "captcha" | "generation" };

export async function requestCv(token: string, theme: CVTheme, ports: CvPorts): Promise<CvRequest> {
  if (!(await ports.verifyCaptcha(token))) return { ok: false, reason: "captcha" };

  try {
    return { ok: true, url: await ports.render(theme) };
  } catch (error) {
    console.error("CV generation failed:", error);
    return { ok: false, reason: "generation" };
  }
}

/** What the contact form collects; the mail adapter decides how to send it. */
export interface ContactMessage {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface Mailer {
  send(message: ContactMessage): Promise<boolean>;
}

export interface ContactDeps {
  verifyCaptcha: (token: string) => Promise<boolean>;
  mailer: Mailer;
}

export type ContactResult = { ok: true } | { ok: false; reason: "captcha" | "mail" };

/**
 * A message leaves only if the token is genuine and the provider accepts it.
 * The reason comes back so the view can say which of the two failed.
 */
export async function sendContactMessage(
  token: string,
  message: ContactMessage,
  { verifyCaptcha, mailer }: ContactDeps,
): Promise<ContactResult> {
  if (!(await verifyCaptcha(token))) return { ok: false, reason: "captcha" };
  if (!(await mailer.send(message))) return { ok: false, reason: "mail" };
  return { ok: true };
}

import type { ContactMessage, Mailer } from "src/contact/application/sendContactMessage";

const EMAILJS_API = "https://api.emailjs.com/api/v1.0/email/send";

/** Only the part of `fetch` the mailer needs, so a test can pass its own. */
export type MailFetcher = (url: string, init: RequestInit) => Promise<{ ok: boolean }>;

export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey: string;
  fetchImpl?: MailFetcher;
}

/**
 * Sends through the EmailJS server API. The private key lives only here, on the
 * server: the browser never sees it, and the captcha is checked before we get
 * this far.
 */
export function createMailer(config: EmailJsConfig): Mailer {
  const { serviceId, templateId, publicKey, privateKey, fetchImpl = fetch } = config;

  return {
    async send(message: ContactMessage) {
      const res = await fetchImpl(EMAILJS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          accessToken: privateKey,
          template_params: message,
        }),
      });
      return res.ok;
    },
  };
}

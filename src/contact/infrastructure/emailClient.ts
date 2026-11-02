import type { ContactMessage, Mailer } from "src/contact/application/sendContactMessage";

const EMAILJS_API = "https://api.emailjs.com/api/v1.0/email/send";

export type MailFetcher = (url: string, init: RequestInit) => Promise<{ ok: boolean }>;

export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey: string;
  fetchImpl?: MailFetcher;
}

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

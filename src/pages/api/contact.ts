import type { APIRoute } from "astro";
import { verifyCapToken } from "src/captcha/application/verifyCapToken";
import {
  sendContactMessage,
  type ContactMessage,
} from "src/contact/application/sendContactMessage";
import { createMailer } from "src/contact/infrastructure/emailClient";

export const POST: APIRoute = async ({ request }) => {
  const { token, ...message } = (await request.json()) as { token: string } & ContactMessage;

  const result = await sendContactMessage(token, message, {
    verifyCaptcha: async (candidate) => {
      const { ok } = await verifyCapToken(candidate, {
        endpoint: process.env.CAP_URL ?? "",
        siteKey: process.env.CAP_SITE_KEY ?? "",
        secret: process.env.CAP_SECRET ?? "",
        fetchImpl: fetch,
      });
      return ok;
    },
    mailer: createMailer({
      serviceId: process.env.EMAILJS_SERVICE_ID ?? "",
      templateId: process.env.EMAILJS_TEMPLATE_ID ?? "",
      publicKey: process.env.EMAILJS_PUBLIC_KEY ?? "",
      privateKey: process.env.EMAILJS_PRIVATE_KEY ?? "",
    }),
  });

  return new Response(JSON.stringify(result), { status: result.ok ? 200 : 400 });
};

import type { APIRoute } from "astro";
import { verifyCapToken } from "src/captcha/application/verifyCapToken";

export const POST: APIRoute = async ({ request }) => {
  const { token } = (await request.json()) as { token: string };

  const { ok } = await verifyCapToken(token, {
    endpoint: process.env.CAP_URL ?? "",
    siteKey: process.env.CAP_SITE_KEY ?? "",
    secret: process.env.CAP_SECRET ?? "",
    fetchImpl: fetch,
  });

  return new Response(JSON.stringify({ ok }), { status: ok ? 200 : 400 });
};

import type { APIRoute } from "astro";
import { verifyCapToken } from "src/captcha/application/verifyCapToken";

export const POST: APIRoute = async ({ request }) => {
  const { token } = (await request.json()) as { token: string };

  const { ok } = await verifyCapToken(token, {
    endpoint: import.meta.env.PUBLIC_CAP_URL,
    siteKey: import.meta.env.PUBLIC_CAP_SITE_KEY,
    secret: import.meta.env.CAP_SECRET,
    fetchImpl: fetch,
  });

  return new Response(JSON.stringify({ ok }), { status: ok ? 200 : 400 });
};

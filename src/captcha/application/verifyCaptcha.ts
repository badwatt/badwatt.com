const VERIFY_ENDPOINT = "/api/cap/verify";

/** Only the part of `fetch` this use case needs, so a test can pass its own. */
export type CaptchaFetcher = (url: string, init: RequestInit) => Promise<{ ok: boolean }>;

/**
 * Asks our own route whether a widget token is genuine. Both the CV and the
 * contact form go through here, so the request shape lives in one place.
 */
export async function verifyCaptcha(
  token: string,
  fetchImpl: CaptchaFetcher = fetch,
): Promise<boolean> {
  const res = await fetchImpl(VERIFY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return res.ok;
}

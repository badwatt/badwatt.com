const VERIFY_ENDPOINT = "/api/cap/verify";

export type CaptchaFetcher = (url: string, init: RequestInit) => Promise<{ ok: boolean }>;

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

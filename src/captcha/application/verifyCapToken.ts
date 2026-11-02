export type CapVerification = { success: boolean };

export type CapFetcher = (
  url: string,
  init: RequestInit,
) => Promise<{ json: () => Promise<CapVerification> }>;

export interface VerifyCapTokenDeps {
  endpoint: string;
  siteKey: string;
  secret: string;
  fetchImpl: CapFetcher;
}

export interface CapResult {
  ok: boolean;
}

export async function verifyCapToken(
  token: string,
  { endpoint, siteKey, secret, fetchImpl }: VerifyCapTokenDeps,
): Promise<CapResult> {
  const res = await fetchImpl(`${endpoint}/${siteKey}/siteverify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token }),
  });
  const { success } = await res.json();
  return { ok: success };
}

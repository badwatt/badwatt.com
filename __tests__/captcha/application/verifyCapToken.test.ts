import { describe, expect, it, vi } from "vite-plus/test";
import { verifyCapToken } from "src/captcha/application/verifyCapToken";

const config = {
  endpoint: "https://cap.example.com",
  siteKey: "site123",
  secret: "secret123",
};

describe("verifyCapToken", () => {
  it("sends the token to the siteverify endpoint with the secret", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });

    const result = await verifyCapToken("tok", { ...config, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith("https://cap.example.com/site123/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: "secret123", response: "tok" }),
    });
    expect(result).toEqual({ ok: true });
  });

  it("reports failure when the provider rejects the token", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false }),
    });

    expect(await verifyCapToken("tok", { ...config, fetchImpl })).toEqual({ ok: false });
  });
});

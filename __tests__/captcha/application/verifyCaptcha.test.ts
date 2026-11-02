import { describe, expect, it, vi } from "vite-plus/test";
import { verifyCaptcha } from "src/captcha/application/verifyCaptcha";

describe("verifyCaptcha", () => {
  it("posts the token to our verify route", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });

    expect(await verifyCaptcha("tok", fetchImpl)).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith("/api/cap/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "tok" }),
    });
  });

  it("reports a token the route rejected", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false });

    expect(await verifyCaptcha("tok", fetchImpl)).toBe(false);
  });
});

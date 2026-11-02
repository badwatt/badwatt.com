import { describe, expect, it, vi } from "vite-plus/test";
import { POST } from "src/pages/api/cap/verify";

function sentSecret(): string | undefined {
  const [, init] = vi.mocked(global.fetch).mock.calls[0] as [string, RequestInit];
  return JSON.parse(init.body as string).secret;
}

function createMockRequest(body: unknown) {
  return {
    json: () => Promise.resolve(body),
  } as unknown as Request;
}

describe("POST /api/cap/verify", () => {
  beforeEach(() => {
    vi.stubEnv("PUBLIC_CAP_URL", "https://cap.example.com");
    vi.stubEnv("PUBLIC_CAP_SITE_KEY", "site123");
    vi.stubEnv("CAP_SECRET", "secret123");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns 200 when verification succeeds", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
    const res = await POST({
      request: createMockRequest({ token: "tok" }),
    } as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("reads the secret from the process at runtime", async () => {
    vi.stubEnv("CAP_SECRET", "from-process");
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });

    await POST({ request: createMockRequest({ token: "tok" }) } as unknown as Parameters<
      typeof POST
    >[0]);

    expect(sentSecret()).toBe("from-process");
  });

  it("sends an empty secret when the process has none", async () => {
    vi.stubEnv("CAP_SECRET", "unused");
    delete process.env.CAP_SECRET;
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });

    await POST({ request: createMockRequest({ token: "tok" }) } as unknown as Parameters<
      typeof POST
    >[0]);

    expect(sentSecret()).toBe("");
  });

  it("returns 400 when verification fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false }),
    });
    const res = await POST({
      request: createMockRequest({ token: "tok" }),
    } as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false });
  });
});

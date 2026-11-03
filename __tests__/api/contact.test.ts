import { describe, expect, it, vi } from "vite-plus/test";
import { POST } from "src/pages/api/contact";

const message = { name: "Alvaro", email: "a@b.com", phone: "", message: "Hello" };

function createMockRequest(body: unknown) {
  return { json: () => Promise.resolve(body) } as unknown as Request;
}

function setEnv() {
  vi.stubEnv("CAP_URL", "https://cap.example.com");
  vi.stubEnv("CAP_SITE_KEY", "site123");
  vi.stubEnv("CAP_SECRET", "secret123");
  vi.stubEnv("EMAILJS_SERVICE_ID", "service_1");
  vi.stubEnv("EMAILJS_TEMPLATE_ID", "template_1");
  vi.stubEnv("EMAILJS_PUBLIC_KEY", "public_1");
  vi.stubEnv("EMAILJS_PRIVATE_KEY", "private_1");
}

function mockFetch(captcha: boolean, mail: boolean) {
  const fetchMock = vi.fn((url: string) =>
    Promise.resolve(
      url.endsWith("/siteverify")
        ? { ok: true, json: () => Promise.resolve({ success: captcha }) }
        : { ok: mail },
    ),
  );
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("POST /api/contact", () => {
  it("sends the message when the captcha is genuine", async () => {
    setEnv();
    const fetchMock = mockFetch(true, true);

    const res = await POST({
      request: createMockRequest({ token: "tok", ...message }),
    } as Parameters<typeof POST>[0]);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.emailjs.com/api/v1.0/email/send");
    expect(JSON.parse(init.body as string)).toMatchObject({
      accessToken: "private_1",
      template_params: message,
    });
    vi.unstubAllEnvs();
  });

  it("does not reach EmailJS when the captcha fails", async () => {
    setEnv();
    const fetchMock = mockFetch(false, true);

    const res = await POST({
      request: createMockRequest({ token: "tok", ...message }),
    } as Parameters<typeof POST>[0]);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, reason: "captcha" });
    expect(fetchMock).toHaveBeenCalledOnce();
    vi.unstubAllEnvs();
  });

  it("does not invent credentials when the environment is missing", async () => {
    setEnv();
    for (const key of [
      "CAP_URL",
      "CAP_SITE_KEY",
      "CAP_SECRET",
      "EMAILJS_SERVICE_ID",
      "EMAILJS_TEMPLATE_ID",
      "EMAILJS_PUBLIC_KEY",
      "EMAILJS_PRIVATE_KEY",
    ]) {
      delete process.env[key];
    }
    const fetchMock = mockFetch(true, false);

    const res = await POST({
      request: createMockRequest({ token: "tok", ...message }),
    } as Parameters<typeof POST>[0]);

    expect(res.status).toBe(400);
    const [capUrl, capInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(capUrl).toContain("/siteverify");
    expect(JSON.parse(capInit.body as string).secret).toBe("");
    const [, mailInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(JSON.parse(mailInit.body as string)).toMatchObject({
      service_id: "",
      template_id: "",
      user_id: "",
      accessToken: "",
    });
    vi.unstubAllEnvs();
  });

  it("reports a refused message", async () => {
    setEnv();
    mockFetch(true, false);

    const res = await POST({
      request: createMockRequest({ token: "tok", ...message }),
    } as Parameters<typeof POST>[0]);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, reason: "mail" });
    vi.unstubAllEnvs();
  });
});

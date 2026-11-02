import { describe, expect, it, vi } from "vite-plus/test";
import { createMailer } from "src/contact/infrastructure/emailClient";

const message = { name: "Alvaro", email: "a@b.com", phone: "", message: "Hello" };

const config = {
  serviceId: "service_1",
  templateId: "template_1",
  publicKey: "public_1",
  privateKey: "private_1",
};

describe("createMailer", () => {
  it("posts the message to the EmailJS api with both keys", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });

    expect(await createMailer({ ...config, fetchImpl }).send(message)).toBe(true);

    expect(fetchImpl).toHaveBeenCalledWith("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: "service_1",
        template_id: "template_1",
        user_id: "public_1",
        accessToken: "private_1",
        template_params: message,
      }),
    });
  });

  it("uses the global fetch when none is injected", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    expect(await createMailer(config).send(message)).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("reports a message the provider refused", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false });

    expect(await createMailer({ ...config, fetchImpl }).send(message)).toBe(false);
  });
});

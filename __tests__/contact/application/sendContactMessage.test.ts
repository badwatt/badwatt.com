import { describe, expect, it, vi } from "vite-plus/test";
import {
  sendContactMessage,
  type ContactMessage,
  type Mailer,
} from "src/contact/application/sendContactMessage";

const message: ContactMessage = {
  name: "Alvaro",
  email: "a@b.com",
  phone: "",
  message: "Hello",
};

function setup(mailDelivered = true, captchaAccepted = true) {
  const verifyCaptcha = vi.fn().mockResolvedValue(captchaAccepted);
  const send = vi.fn().mockResolvedValue(mailDelivered);
  const mailer: Mailer = { send };
  return { deps: { verifyCaptcha, mailer }, verifyCaptcha, send };
}

describe("sendContactMessage", () => {
  it("delivers the message once the captcha is accepted", async () => {
    const { deps, send } = setup();

    expect(await sendContactMessage("tok", message, deps)).toEqual({ ok: true });
    expect(send).toHaveBeenCalledWith(message);
  });

  it("does not send anything when the captcha is rejected", async () => {
    const { deps, send } = setup(true, false);

    expect(await sendContactMessage("tok", message, deps)).toEqual({
      ok: false,
      reason: "captcha",
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("reports a provider that refused the message", async () => {
    const { deps } = setup(false);

    expect(await sendContactMessage("tok", message, deps)).toEqual({ ok: false, reason: "mail" });
  });
});

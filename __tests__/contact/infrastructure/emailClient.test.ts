import { describe, expect, it, vi } from "vite-plus/test";
import { sendContactForm } from "src/contact/infrastructure/emailClient";

vi.mock("@emailjs/browser", () => ({
  default: { sendForm: vi.fn().mockResolvedValue({ status: 200, text: "OK" }) },
}));

describe("sendContactForm", () => {
  it("sends the form with the ids from the environment", async () => {
    const { default: emailjs } = await import("@emailjs/browser");
    const form = document.createElement("form");

    await sendContactForm(form);
    expect(emailjs.sendForm).toHaveBeenCalledWith(
      import.meta.env.PUBLIC_SERVICE_ID,
      import.meta.env.PUBLIC_TEMPLATE_ID,
      form,
      import.meta.env.PUBLIC_PUBLIC_KEY,
    );
  });

  it("refuses to send when the form is not mounted", async () => {
    const { default: emailjs } = await import("@emailjs/browser");
    vi.mocked(emailjs.sendForm).mockClear();

    await expect(sendContactForm(null)).rejects.toThrow("contact form is not mounted");
    expect(emailjs.sendForm).not.toHaveBeenCalled();
  });
});

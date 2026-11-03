import { type ChangeEvent, useState } from "react";
import { CapWidget } from "src/captcha/ui/CapWidget";
import { PaperPlaneTiltIcon, CheckCircleIcon } from "@phosphor-icons/react";
import toast, { Toaster } from "react-hot-toast";

const MESSAGES = {
  captcha: "Captcha verification failed. Please try again.",
  mail: "Message failed to send. Please try again.",
} as const;

export const Contact = ({ cap }: { cap: { url: string; siteKey: string } }) => {
  const [_isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!data.name.trim()) newErrors.name = "Name is required";
    if (!data.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!data.message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateData = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleClickSend = () => {
    if (!validate()) return;
    setShowCaptcha(true);
  };

  const doSubmit = async (token: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...data }),
      });
      if (!res.ok) {
        const { reason } = (await res.json()) as { reason: keyof typeof MESSAGES };
        toast.error(MESSAGES[reason]);
        setShowCaptcha(false);
        return;
      }
      setIsSubmitted(true);
    } catch {
      toast.error(MESSAGES.mail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section-curve min-h-[80vh] px-4 md:px-0 relative">
      <div id="contact-nav" className="absolute top-0 left-0" aria-hidden="true" />
      <div className="h-12 md:h-24" />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--color-badwatt-surface)",
            color: "var(--color-badwatt-white)",
            border: "1px solid var(--color-badwatt-border)",
          },
        }}
      />
      {!isSubmitted ? (
        <section
          className="grid grid-cols-1 md:grid-cols-[1fr_2fr] p-8 md:p-10 rounded-2xl bg-badwatt-surface border border-badwatt-border hover:border-badwatt-primary/20 transition-all duration-500"
          aria-label="contact-form"
        >
          <div className="mb-8 md:mb-0 md:pr-8">
            <h2 className="text-3xl md:text-4xl tracking-[-0.03em] leading-none font-bold mb-4">
              Get in touch
            </h2>
            <p className="text-badwatt-muted leading-relaxed max-w-[35ch]">
              Have a project or opportunity?
              <br /> Drop a message.
            </p>
          </div>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="contact-name" className="text-sm font-medium text-badwatt-muted">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                name="name"
                value={data.name}
                onChange={updateData}
                autoComplete="name"
                className="bg-badwatt-base text-badwatt-white p-4 border border-badwatt-border rounded-lg focus:outline-none focus:border-badwatt-primary transition-colors duration-200"
                aria-describedby={errors.name ? "name-error" : undefined}
                required
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="contact-email" className="text-sm font-medium text-badwatt-muted">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                name="email"
                value={data.email}
                onChange={updateData}
                autoComplete="email"
                className="bg-badwatt-base text-badwatt-white p-4 border border-badwatt-border rounded-lg focus:outline-none focus:border-badwatt-primary transition-colors duration-200"
                aria-describedby={errors.email ? "email-error" : undefined}
                required
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="contact-phone" className="text-sm font-medium text-badwatt-muted">
                Phone <span className="text-badwatt-border">(optional)</span>
              </label>
              <input
                id="contact-phone"
                type="tel"
                name="phone"
                value={data.phone}
                onChange={updateData}
                autoComplete="tel"
                className="bg-badwatt-base text-badwatt-white p-4 border border-badwatt-border rounded-lg focus:outline-none focus:border-badwatt-primary transition-colors duration-200"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="contact-message" className="text-sm font-medium text-badwatt-muted">
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                value={data.message}
                onChange={updateData}
                className="bg-badwatt-base text-badwatt-white p-4 border border-badwatt-border rounded-lg focus:outline-none focus:border-badwatt-primary transition-colors duration-200 min-h-[120px] resize-y"
                aria-describedby={errors.message ? "message-error" : undefined}
                required
              />
              {errors.message && (
                <p id="message-error" className="text-sm text-red-400">
                  {errors.message}
                </p>
              )}
            </div>

            {showCaptcha && (
              <CapWidget
                url={cap.url}
                siteKey={cap.siteKey}
                onVerified={(token) => {
                  void doSubmit(token);
                }}
              />
            )}

            {!showCaptcha && (
              <button
                type="button"
                onClick={handleClickSend}
                aria-label="submit"
                className="flex items-center justify-center gap-2 p-4 mt-2 rounded-lg bg-badwatt-primary text-badwatt-dark font-medium cursor-pointer hover:opacity-90 transition-all duration-200 active:scale-[0.98]"
              >
                Send message
                <PaperPlaneTiltIcon size={20} weight="bold" />
              </button>
            )}
          </form>
        </section>
      ) : (
        <section className="grid place-items-center p-12 rounded-2xl bg-badwatt-surface border border-badwatt-border animate-[scaleIn_0.5s_ease-out]">
          <CheckCircleIcon size={48} weight="bold" className="text-badwatt-primary mb-4" />
          <h2 className="text-2xl font-semibold tracking-tight mb-2">Message sent</h2>
          <p className="text-badwatt-muted">I will get back to you soon.</p>
        </section>
      )}
    </section>
  );
};

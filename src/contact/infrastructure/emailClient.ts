import emailjs from "@emailjs/browser";

/**
 * Sends the contact form through EmailJS. The ids are read here, at the edge,
 * so the view never touches the provider's configuration.
 */
export async function sendContactForm(form: HTMLFormElement | null): Promise<void> {
  if (!form) throw new Error("contact form is not mounted");

  await emailjs.sendForm(
    import.meta.env.PUBLIC_SERVICE_ID,
    import.meta.env.PUBLIC_TEMPLATE_ID,
    form,
    import.meta.env.PUBLIC_PUBLIC_KEY,
  );
}

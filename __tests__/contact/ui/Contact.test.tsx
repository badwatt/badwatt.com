import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Contact } from "src/contact/ui/Contact";
import toast from "react-hot-toast";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("src/captcha/ui/CapWidget", () => {
  const React = require("react");
  return {
    CapWidget: ({ onVerified }: { onVerified?: (token: string) => void }) => {
      return React.createElement(
        "button",
        { type: "button", onClick: () => onVerified?.("test-token") },
        "Verify",
      );
    },
  };
});

function setupFetchMock({ ok = true, reason = "mail" }: { ok?: boolean; reason?: string } = {}) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(ok ? { ok } : { ok, reason }),
  });
}

describe("<Contact />", () => {
  beforeEach(() => {
    window.IntersectionObserver = class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    } as unknown as typeof window.IntersectionObserver;
    setupFetchMock();
  });
  afterEach(() => {
    cleanup();
    document.querySelector("[data-rht-toaster]")?.remove();
    toast.remove();
    vi.restoreAllMocks();
  });

  it("renders heading and form", () => {
    render(<Contact />);
    expect(screen.getByRole("heading", { name: /get in touch/i })).toBeDefined();
  });

  it("shows validation errors on empty send click", () => {
    render(<Contact />);
    fireEvent.click(screen.getByLabelText("submit"));
    expect(screen.getByText("Name is required")).toBeDefined();
    expect(screen.getByText("Email is required")).toBeDefined();
    expect(screen.getByText("Message is required")).toBeDefined();
  });

  it("shows invalid email error", () => {
    render(<Contact />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: "email", value: "not-an-email" },
    });
    fireEvent.click(screen.getByLabelText("submit"));
    expect(screen.getByText("Invalid email address")).toBeDefined();
  });

  it("clears error when field is corrected", () => {
    render(<Contact />);
    fireEvent.click(screen.getByLabelText("submit"));
    expect(screen.getByText("Name is required")).toBeDefined();
    fireEvent.change(screen.getByLabelText(/name/i), { target: { name: "name", value: "Alvaro" } });
    expect(screen.queryByText("Name is required")).toBeNull();
  });

  it("shows captcha widget after clicking send", () => {
    render(<Contact />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { name: "name", value: "Alvaro" } });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: "email", value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { name: "message", value: "Hello" },
    });
    fireEvent.click(screen.getByLabelText("submit"));
    expect(screen.queryByLabelText("submit")).toBeNull();
    expect(screen.getByText("Verify")).toBeDefined();
  });

  it("shows the failure message when the route refuses the mail", async () => {
    setupFetchMock({ ok: false, reason: "mail" });
    render(<Contact />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { name: "name", value: "Alvaro" } });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: "email", value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { name: "message", value: "Hello" },
    });
    fireEvent.click(screen.getByLabelText("submit"));
    fireEvent.click(screen.getByText("Verify"));

    await waitFor(() => {
      expect(screen.getByText(/Message failed to send/i)).toBeDefined();
    });
  });

  it("shows the failure message when the request cannot be made", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("offline"));
    render(<Contact />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { name: "name", value: "Alvaro" } });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: "email", value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { name: "message", value: "Hello" },
    });
    fireEvent.click(screen.getByLabelText("submit"));
    fireEvent.click(screen.getByText("Verify"));

    await waitFor(() => {
      expect(screen.getByText(/Message failed to send/i)).toBeDefined();
    });
  });

  it("shows the success panel when the route accepts the message", async () => {
    render(<Contact />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { name: "name", value: "Alvaro" } });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: "email", value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { name: "message", value: "Hello" },
    });
    fireEvent.click(screen.getByLabelText("submit"));
    fireEvent.click(screen.getByText("Verify"));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Message sent/i })).toBeDefined();
    });
  });

  it("updates form data on input change", () => {
    render(<Contact />);
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { name: "name", value: "Alvaro" } });
    expect(nameInput.value).toBe("Alvaro");
  });

  it("blocks submit when captcha verification fails", async () => {
    setupFetchMock({ ok: false, reason: "captcha" });
    render(<Contact />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { name: "name", value: "Alvaro" } });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: "email", value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { name: "message", value: "Hello" },
    });
    fireEvent.click(screen.getByLabelText("submit"));
    fireEvent.click(screen.getByText("Verify"));

    await waitFor(() => {
      expect(screen.getByText(/Captcha verification failed/i)).toBeDefined();
    });
  });

  it("matches snapshot", () => {
    const { container } = render(<Contact />);
    expect(container).toMatchSnapshot();
  });
});

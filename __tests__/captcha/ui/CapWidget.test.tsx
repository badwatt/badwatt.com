import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { CapWidget } from "src/captcha/ui/CapWidget";

const SCRIPT_ID = "cap-widget-script";

function widgetIn(container: HTMLElement): HTMLElement | null {
  return container.querySelector("cap-widget");
}

describe("<CapWidget />", () => {
  beforeEach(() => {
    vi.stubEnv("PUBLIC_CAP_URL", "https://cap.example.com");
    vi.stubEnv("PUBLIC_CAP_SITE_KEY", "site123");
  });

  afterEach(() => {
    cleanup();
    document.querySelectorAll(`#${SCRIPT_ID}`).forEach((node) => node.remove());
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("loads the widget script once and points it at the configured endpoint", () => {
    document.getElementById(SCRIPT_ID)?.remove();

    const { container } = render(
      <CapWidget url="https://cap.example.com" siteKey="site123" onVerified={vi.fn()} />,
    );

    expect(document.querySelectorAll(`#${SCRIPT_ID}`)).toHaveLength(1);
    expect(document.getElementById(SCRIPT_ID)?.getAttribute("src")).toBe(
      "https://cdn.jsdelivr.net/npm/cap-widget",
    );
    expect(widgetIn(container)?.getAttribute("data-cap-api-endpoint")).toBe(
      "https://cap.example.com/site123/",
    );
  });

  it("reuses the script when it is already on the page", () => {
    const existing = document.createElement("script");
    existing.id = SCRIPT_ID;
    document.body.appendChild(existing);

    render(<CapWidget url="https://cap.example.com" siteKey="site123" onVerified={vi.fn()} />);

    expect(document.querySelectorAll(`#${SCRIPT_ID}`)).toHaveLength(1);
  });

  it("forwards the solved token", () => {
    const onVerified = vi.fn();
    const { container } = render(
      <CapWidget url="https://cap.example.com" siteKey="site123" onVerified={onVerified} />,
    );

    widgetIn(container)?.dispatchEvent(
      new CustomEvent("solve", { detail: { token: "cap-token" } }),
    );

    expect(onVerified).toHaveBeenCalledWith("cap-token");
  });

  it("ignores a solve event without a token", () => {
    const onVerified = vi.fn();
    const { container } = render(
      <CapWidget url="https://cap.example.com" siteKey="site123" onVerified={onVerified} />,
    );

    widgetIn(container)?.dispatchEvent(new CustomEvent("solve"));

    expect(onVerified).not.toHaveBeenCalled();
  });

  it("releases the listener on unmount", () => {
    const onVerified = vi.fn();
    const { container, unmount } = render(
      <CapWidget url="https://cap.example.com" siteKey="site123" onVerified={onVerified} />,
    );
    const widget = widgetIn(container);

    unmount();
    widget?.dispatchEvent(new CustomEvent("solve", { detail: { token: "late" } }));

    expect(onVerified).not.toHaveBeenCalled();
  });
});

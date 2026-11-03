import { useEffect, useState } from "react";

export interface CapWidgetProps {
  url: string;
  siteKey: string;
  onVerified: (token: string) => void;
}

const SCRIPT_ID = "cap-widget-script";
const SCRIPT_URL = "https://cdn.jsdelivr.net/npm/cap-widget";

export const CapWidget = ({ url, siteKey, onVerified }: CapWidgetProps) => {
  const [widget, setWidget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!widget) return;

    const handleSolve = (event: Event) => {
      const token = (event as CustomEvent<{ token?: string }>).detail?.token;
      if (token) onVerified(token);
    };

    widget.addEventListener("solve", handleSolve);
    return () => widget.removeEventListener("solve", handleSolve);
  }, [widget, onVerified]);

  const endpoint = `${url}/${siteKey}/`;

  return (
    <div>
      <cap-widget ref={setWidget} data-cap-api-endpoint={endpoint} />
    </div>
  );
};

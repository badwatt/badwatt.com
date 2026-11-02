/// <reference types="astro/client" />

// A module, so the declaration below augments React's JSX types instead of
// replacing the react/jsx-runtime module with our two lines.
export {};

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "cap-widget": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

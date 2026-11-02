# badwatt.com

> "The most powerful weapon on earth is the human soul on fire." - Ferdinand Foch

Personal site: portfolio, experience and skills, plus a CV generated in the browser
from a set of colour palettes.

![badwatt.com](public/images/readme/demo.png)

## Stack

- [Astro](https://astro.build) in `server` output mode, standalone adapter (`@astrojs/node`)
- React islands for the interactive sections
- Tailwind CSS v4 through `@tailwindcss/vite`
- TypeScript
- jsPDF to build the CV, pdf.js to preview it
- Outfit and JetBrains Mono, served through Astro's fontsource provider

## Local development

The project runs on [Vite+](https://viteplus.dev). `vp <name>` is a built-in command,
`vp run <name>` runs the matching `package.json` script.

```sh
pnpm install
vp dev          # http://localhost:4321
```

| Command           | What it does                  |
| ----------------- | ----------------------------- |
| `vp dev`          | Dev server with HMR           |
| `vp build`        | Production build into `dist/` |
| `vp preview`      | Serve the built site          |
| `vp test`         | Vitest suite                  |
| `vp run coverage` | Suite with Istanbul coverage  |
| `vp check`        | Format, lint and type check   |

## Environment

Copy `.env.example` to `.env` and fill it in:

- `FQDN` — host the site is served from
- `PUBLIC_CAP_URL`, `PUBLIC_CAP_SITE_KEY`, `CAP_SECRET` — [Cap](https://capjs.js.org)
  captcha, used by `/api/cap/verify` before the CV is generated
- `PUBLIC_SERVICE_ID`, `PUBLIC_TEMPLATE_ID`, `PUBLIC_PUBLIC_KEY` — EmailJS, for the
  contact form

## Content

Everything the page renders comes from `src/content`: `portfolio/`, `experience/`,
`about/` and `skills/`, with the schemas in `src/content.config.ts`. Adding a
portfolio entry means a markdown file with `title`, `image` and `url`; the image
must exist next to the other portfolio assets, and a test checks both.

## Deployment

`compose.yml` (Caddy labels) and `compose.traefik.yml` install dependencies, build
and run `node dist/server/entry.mjs` on port 4321.

# syntax=docker/dockerfile:1

# --- build stage: the official Vite+ toolchain image ---
FROM ghcr.io/voidzero-dev/vite-plus:latest AS build
WORKDIR /app

# Vite inlines import.meta.env while building, and the captcha widget needs these
# two in the browser. Everything else is read from the environment at runtime:
# CAP_SECRET and the four EMAILJS_* values never reach the image or the visitor.
ARG PUBLIC_CAP_URL=""
ARG PUBLIC_CAP_SITE_KEY=""
ENV PUBLIC_CAP_URL=$PUBLIC_CAP_URL \
    PUBLIC_CAP_SITE_KEY=$PUBLIC_CAP_SITE_KEY

# Dependencies first, so this layer survives source changes.
COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version* ./
RUN vp install --frozen-lockfile

COPY --chown=vp:vp . .
RUN vp run build

# The exact Node.js binary vp resolved from .node-version.
RUN cp "$(vp env which node | head -1)" /tmp/node

# --- deps stage: production-only dependencies ---
# A fresh --prod install: pruning the build stage would keep devDependencies.
FROM ghcr.io/voidzero-dev/vite-plus:latest AS deps
WORKDIR /app
COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version* ./
RUN vp install --frozen-lockfile --prod

# --- runtime stage: glibc, no toolchain, no source ---
FROM debian:bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321

COPY --from=build /tmp/node /usr/local/bin/node
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=deps /app/node_modules ./node_modules

# The node adapter keeps sessions on disk under .astro/
RUN mkdir -p /app/.astro && chown nobody /app/.astro

USER nobody
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]

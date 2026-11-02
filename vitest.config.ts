import { defineConfig, mergeConfig } from "vite-plus";
import viteConfig from "./vite.config.ts";
import path from "node:path";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "happy-dom",
      include: ["__tests__/**/*.test.{ts,tsx}"],
      setupFiles: ["__tests__/setup.ts"],
      alias: {
        src: path.resolve(__dirname, "./src"),
      },
      fakeTimers: {
        toFake: [
          "setTimeout",
          "clearTimeout",
          "setInterval",
          "clearInterval",
          "setImmediate",
          "clearImmediate",
          "Date",
        ],
      },
      coverage: {
        provider: "istanbul",
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/env.d.ts",
          "src/content.config.ts",
          // Bridge to the third-party cap-widget custom element: it injects the CDN
          // script and forwards the "solve" event, nothing of ours to assert beyond
          // what the widget itself already guarantees.
          "src/components/CapWidget.tsx",
          ".astro/**",
        ],
        thresholds: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  }),
);

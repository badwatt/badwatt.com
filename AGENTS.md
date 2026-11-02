# AGENTS.md

## Package manager

Always use **pnpm**. Never npm, yarn, or bun.

```sh
pnpm install
pnpm add <package>
pnpm remove <package>
```

---

## MANDATORY skills

Every task — no exceptions — must use these skills:

| Skill                 | File                                              | Purpose                                                                                 |
| --------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `tdd`                 | `~/.pi/agent/skills/tdd/SKILL.md`                 | Red-green-refactor loop. Write failing test first, then implement.                      |
| `gpt-taste`           | `~/.pi/agent/skills/gpt-taste/SKILL.md`           | Award-winning design engineering. AIDA structure, hero rules, bento grids, GSAP motion. |
| `conventional-commit` | `~/.pi/agent/skills/conventional-commit/SKILL.md` | Structured commit messages (`feat:`, `fix:`, `refactor:`, `BREAKING:`).                 |

**Before any implementation**, read the relevant skill files and follow their directives.

---

## TDD — NEGOTIABLE

1. **Write failing test first.**
2. **Run test — confirm it fails.**
3. **Write minimal code to pass.**
4. **Run test — confirm it passes.**
5. **Refactor — keep tests green.**

No code without a test. No exceptions.

---

## Coverage — 100%, enforced

`vp run coverage` must end at **100% statements, branches, functions and lines** over
`src/**`. The thresholds in `vitest.config.ts` fail the run otherwise, so a line without a
test breaks the build: write the test first.

Excluded, and only for this reason: `src/env.d.ts` (types), `src/content.config.ts`
(schema read by Astro's content layer), `src/components/CapWidget.tsx` (bridge to the
third-party `cap-widget` custom element) and the generated `.astro/` output. Excluding
anything else needs a reason in the commit message.

When a branch cannot be covered, the branch is wrong: delete the unreachable fallback or
reshape the state so that the impossible case does not exist.

---

## Architecture — hexagonal

Four layers. Dependencies point inward only:

| Layer            | Path                                                                                  | May import                            |
| ---------------- | ------------------------------------------------------------------------------------- | ------------------------------------- |
| `domain`         | `src/domain/**`                                                                       | nothing but itself                    |
| `application`    | `src/application/**`                                                                  | `domain`, its own ports               |
| `infrastructure` | `src/infrastructure/**`                                                               | `application`, `domain`, libraries    |
| `ui`             | `src/views/**`, `src/components/**`, `src/hooks/**`, `src/pages/**`, `src/layouts/**` | `application`, `domain`, React, Astro |

- `domain` holds the rules: the CV data model, date parsing, pagination maths. No React,
  no Astro, no jsPDF, no `import.meta.env`, no `fetch`, no DOM.
- `application` holds the use cases (`generateCv`, `verifyCapToken`) and declares the
  ports they need next to them. A port is a small `type` with the two or three members
  the use case actually calls, not a folder of empty interfaces.
- `infrastructure` holds one adapter per port: `getCollection` for content, jsPDF for the
  PDF, `fetch` for Cap, EmailJS for mail.
- `ui` orchestrates and renders. It never parses markdown, never touches jsPDF and never
  knows a provider's payload. `src/hooks/**` is UI as well: state and effects shared by
  more than one view (`useCV`, `useZoom`).
- Side effects and configuration are injected as arguments (`now`, `fetchImpl`, endpoint,
  secret). The core receives values; only the edge reads `import.meta.env`.
- Routes under `src/pages/api/**` are adapters: parse the request, call a use case, build
  the response. No logic beyond that.
- No port without an adapter, no adapter with logic. A use case with one implementation
  called from one place is a plain function; the structure exists to keep the core
  testable, not to draw a diagram.
- Composition happens in exactly two places: `src/pages/index.astro` builds the content
  source and `src/hooks/useCV.ts` builds the CV client. Every other UI module talks to
  `application` or `domain`; the only components that touch a browser adapter
  (`PdfCanvas`, `ThemeToggle`) are the ones rendering it.

---

## Clean code

- One reason to change per module. A file that mixes rules, rendering and I/O is split by
  those three reasons, not by layer names.
- Functions do one thing and read top to bottom. Extract a named function instead of
  writing a comment.
- No duplicated logic: two call sites that parse the same date or close the same viewer
  are one function or one hook used twice.
- No magic numbers: page sizes, zoom steps and thresholds live in a constants module.
- No `any`, no `!` to silence the compiler, no `@ts-ignore`.
- No dead code, no commented-out code, no speculative options nobody passes.
- No `index.ts` barrels; import the module you mean.

---

## Banned practices

- Hardcoded values in components (use constants, props, or config)
- Inline styles mixing with Tailwind classes (pick one system)
- `any` types — use proper TypeScript typing
- Direct DOM manipulation outside React hooks/refs
- Unused imports — Biome linter runs on commit, keep it clean
- `console.log` in production code (use proper logging or remove)
- Skipping tests — if a test is hard to write, fix the design, don't skip the test
- Committing without conventional commit format

---

## Design rules (gpt-taste)

- Follow AIDA structure: Attention → Interest → Desire → Action
- Hero: 2-3 lines max, ultra-wide container, no centered text at high variance
- No "SECTION 01" or similar meta-labels
- No emojis in code, markup, or content
- No Inter font — use Outfit, Geist, Satoshi, or Cabinet Grotesk
- No purple/blue "AI gradient" aesthetic — single accent color, saturation < 80%
- Massive vertical spacing between sections (`py-32 md:py-48`)
- Gapless bento grids with `grid-flow-dense`

---

## Commit format

```
type(scope?): description

body?
```

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `style`, `build`, `ci`

Breaking changes: `!` after type or `BREAKING CHANGE:` in footer.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

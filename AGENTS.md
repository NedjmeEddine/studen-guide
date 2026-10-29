<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

# AGENTS.md

## Repository Workflow & Commands

- Local commits on `main` are standard. Push only upon explicit user request.
- **Verification Commands**:
  - `npm test` — Run Vitest suite (14 dialect, SVG generators, and 3D parser tests).
  - `npm run lint` — ESLint 9 check (must have 0 errors).
  - `npm run format` — Prettier format across all files (normalizes CRLF to LF).
  - `npm run build` — Production build (Vite + Nitro for Cloudflare Workers; generates `.output/server/wrangler.json`).
  - `npm run dev -- --port 5174` — Local dev server.

---

## Non-Obvious Engineering Quirks & Invariants

- **Prism UMD / Node SSR Crash**: Never statically import `prismjs/components/*` at the top level in ESM without setting `(globalThis as any).Prism = Prism` first; otherwise Node SSR throws `ReferenceError: Prism is not defined`. Always import `{ ensurePrismLanguages, highlightCode } from "@/embeds/syntax"`.
- **Zero-Eval Math & CSP**: Never use `eval()` or `new Function("...", "with(Math)...")` in `Embed.tsx` or `Plot3D.tsx`. Both 2D and 3D mathematical parsers use CSP-compliant recursive descent parsers (`parseMath` / `parseMath2D`).
- **SVG Text XSS Sanitization**: Dynamic user text interpolated into in-house SVG generators (`circuit.ts`, `ecg.ts`, `odontogram.ts`) MUST pass through `escapeHtml()` from `@/dialect/markdown` before template string assembly.
- **SSR Hydration in TanStack Start**: Do not read `localStorage` in initial `useState` calls (e.g. in `routes/index.tsx`); hydrate stored sheets inside `useEffect` on client mount to prevent React 19 SSR hydration mismatches.
- **Store Prefix Collision**: In `store.ts`, key listeners must enforce colon boundaries (`k === key || (k.endsWith(':') ? key.startsWith(k) : key.startsWith(k + ':'))`) so `ck:1` does not trigger re-renders for `ck:10`–`ck:19`.
- **CSS Grid Mobile Blowout**: In `.ss-layout`, mobile grid column MUST be `minmax(0, 1fr)` (not bare `1fr`), otherwise KaTeX display math, 3D canvas, or SVG diagrams expand past the viewport and cause horizontal scrolling.
- **Touch-Safe Charts**: In `Embed.tsx`, keep `disableZoom: true` on `function-plot` so mobile thumb scrolling is not trapped by the canvas.
- **Oscilloscope Waveforms**: `# Vin:` in `plot` blocks renders dashed reference traces (`stroke-dasharray: 6,4`); `# Vout:` renders bold lines with translucent shaded pulse fill (`closed: true`).
- **Math Placeholder Pass**: Must run **before** the markdown-it pass (`%%M<i>%%` tokens); otherwise `_` inside LaTeX `$…$` turns into `<em>` italics.
- **WaveDrom Convention**: WaveDrom uses a **prefix + index** id convention (`RenderWaveForm(idx, json, "ss-wave-")`), with a classic fallback.
- **Flashcard Button Collapse**: In `.ss-card`, inner container needs explicit `display: block; height: 200px` to prevent `<button>` flex child collapse.

---

## Dialect & Authoring Rules

- The dialect specification lives in `skills/SKILL.md` (and `studysheet/SKILL.md`).
- All **6 domain packs** are implemented in `skills/references/`:
  - `domain-cs.md` (Mermaid trees/flow, bytecode terminal, Graphviz DOT state machines, 3D ML loss landscapes)
  - `domain-math.md` (KaTeX matrices, complexity curves, 3D quadric surfaces & saddle points via `plot3d`)
  - `domain-electronics.md` (SPICE netlists with live Falstad simulation button, dual-trace oscilloscope plots)
  - `domain-medicine.md` (Parametric Lead-II ECG telemetry strips, coronary lead mapping, biomarker kinetics)
  - `domain-dentistry.md` (Parametric adult FDI odontogram via `odontogram`, G.V. Black cavity classes, Lidocaine MRD)
  - `domain-pharmacy.md` (2D chemical structures via `smiles`, pKa Henderson-Hasselbalch plots, receptor cascades)
- Always do the Step-0 student preference interview first (`mode`, `extras`, `lang`, optional `exam-date`).
- Quizzes and flashcards exist **only if opted in** (`extras` in front matter).

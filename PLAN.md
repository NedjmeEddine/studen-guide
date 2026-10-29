# StudySheet Refactoring & Visual Capabilities Roadmap

> **Target**: Hardened, multi-disciplinary proof-of-concept ready for Cloudflare Workers deployment.
> **Branch**: `refactor` (dedicated work branch; preserves `main` as an instant rollback point).

---

## [x] Milestone 1: Security & Concurrency Hardening

- [x] **1.1 Close Stored XSS in ECG Generator (`src/embeds/ecg.ts`)**
  - Sanitize and HTML-escape dynamic parameters (`p.rhythm`, `p.st`, `p.axis`) before SVG string assembly.
- [x] **1.2 Safe Mathematical Evaluator (`src/embeds/Embed.tsx`)**
  - Replace `new Function("x", "with(Math){...}")` with a safe, zero-eval recursive-descent math sampler to satisfy strict Content Security Policy (CSP).
- [x] **1.3 Concurrency-Safe Heading Tracking (`src/dialect/markdown.ts`)**
  - Eliminate module-level mutable global `headingSeen`; pass tracking state through Markdown-It's per-render `env` object.
- [x] **1.4 Fix Store Key Collision (`src/lib/store.ts`)**
  - Enforce strict colon delimiter on key prefix matching to prevent `ck:1` from triggering updates for `ck:10`–`ck:19`.
- [x] **1.5 Fix SSR / Client Hydration Mismatch (`src/routes/index.tsx`)**
  - Ensure server-side rendering (Cloudflare Workers / Nitro) and initial client hydration match cleanly before reading saved sheets from `localStorage`.

---

## [x] Milestone 2: Unlock the Full Visual Potential Across All Core Disciplines

- [x] **2.1 Dentistry: Parametric FDI Adult Odontogram (`src/embeds/odontogram.ts`)**
  - Implement zero-dependency parametric SVG dental chart supporting FDI two-digit notation (quadrants 1–4, teeth 1–8).
  - Support surfaces (Mesial, Occlusal, Distal, Buccal, Lingual) and statuses (`caries`, `composite`, `amalgam`, `crown`, `missing`, `endo`).
  - Wire into `src/embeds/Embed.tsx` and style in `src/studysheet.css`.
- [x] **2.2 Pharmacy & Chemistry: 2D SMILES Molecular Structures (`src/embeds/Embed.tsx`)**
  - Lazy-load `smiles-drawer` to render 2D skeletal chemical structures from plain text SMILES strings (Aspirin, Ibuprofen, Epinephrine, etc.).
- [x] **2.3 Computer Science & Compilers: Graphviz DOT State Machines (`src/embeds/Embed.tsx`)**
  - Integrate Graphviz DOT rendering for finite automata (DFA/NFA), call graphs, and syntax trees.
- [x] **2.4 Electronics & Engineering: Live Falstad Circuit Simulation**
  - Add interactive `"Simulate Live in Falstad ⏵"` action button to `circuit` blocks for animated current-flow visualization.

---

## [x] Milestone 3: Authentic Exam-Grade Subject Showcases

- [x] **3.1 Dentistry Sheet (`public/examples/dentistry_caries.md`)**
  - Black's Cavity Classifications (Classes I–VI), local anesthetics max dosing formulas, and interactive FDI odontogram.
- [x] **3.2 Pharmacy / Pharmacology Sheet (`public/examples/pharmacology_nsaids.md`)**
  - NSAIDs mechanism of action, 2D SMILES structures for Aspirin and Ibuprofen, COX-1 vs COX-2 selectivity table, and pKa absorption plot.
- [x] **3.3 Update Sample Picker (`src/examples/all-examples.ts` & `src/routes/index.tsx`)**
  - Register all 6 subjects (Electronics, CS, Mathematics, Medicine, Dentistry, Pharmacy) for instant modal switching.

---

## [x] Milestone 4: Scroll & Storage Performance Optimization

- [x] **4.1 Smooth 60fps Table of Contents Tracking (`src/ui/SheetView.tsx`)**
  - Replace unthrottled `scroll` listener layout reflows (`getBoundingClientRect`) with passive `requestAnimationFrame` / `IntersectionObserver`.
- [x] **4.2 Progress Storage Consolidation**
  - Eliminate synchronous disk I/O storms when calculating progress across 50+ checklist and quiz items.

---

## [x] Milestone 5: Cloudflare Worker Verification & Production Build

- [x] **5.1 Vitest Unit Suite**
  - Add tests for `odontogram`, `smiles`, and `dot` in `src/test/dialect.test.ts`.
- [x] **5.2 ESLint & Prettier Audit**
  - Ensure 0 errors and uniform formatting.
- [x] **5.3 Nitro / Cloudflare Worker Build**
  - Verify `npm run build` succeeds and produces valid `.output/server/wrangler.json`.
- [x] **5.4 Clean Git History on `refactor`**
  - Commit milestones cleanly so `main` is completely untouched as the rollback fallback.

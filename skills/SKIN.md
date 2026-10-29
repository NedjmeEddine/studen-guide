# StudySheet Theme Ricing Skill (CSS Dotfiles)

Use this skill whenever an AI agent or human designer is asked to create, customize, or "rice" a visual theme for the StudySheet web application.

StudySheet themes are single-file CSS stylesheets (analogous to Linux window manager dotfiles like `i3/config` or `hyprland.conf`). The HTML DOM tree is frozen and semantic; all styling, atmosphere, typography, borders, and personality are driven purely through scoped CSS rules under `[data-skin="<skin-name>"]` (or `[data-skin="custom"]` for user-imported themes).

---

## 1. The Core Variable Contract

Every theme must define these 13 root variables inside its skin selector:

```css
[data-skin="my-theme"] {
  --ss-bg: #090c10; /* Canvas background behind the sheet */
  --ss-fg: #d1d5db; /* Primary body text color */
  --ss-muted: #6b7280; /* Secondary metadata, subtitles, timestamps */
  --ss-panel: #0f131a; /* Primary surface: sheet background, callout boxes */
  --ss-panel-2: #151b24; /* Secondary surface: table zebra rows, solution body */
  --ss-line: #1e2638; /* Borders, dividers, table grid lines */
  --ss-accent: #22c55e; /* Primary interactive accent and brand highlight */
  --ss-accent-soft: rgba(34, 197, 94, 0.12); /* Translucent tint for hovers & pill backgrounds */
  --ss-ok: #10b981; /* Success indicators, green badges, correct answers */
  --ss-bad: #ef4444; /* Error indicators, trap borders, incorrect options */
  --ss-warn: #f59e0b; /* Warning highlights, mnemonics, caution alerts */
  --ss-font: ui-monospace, monospace; /* Primary font family stack */
  --ss-radius: 4px; /* Base border radius for boxes, buttons, cards */
}
```

---

## 2. Complete DOM Target Map (What You Can Rice)

The HTML skeleton never changes. Target these exact selectors to create deep structural themes:

### A. App Shell & Layout

| Target Selector                 | Description & Ricing Opportunities                                                                |
| :------------------------------ | :------------------------------------------------------------------------------------------------ |
| `[data-skin="..."]`             | The top-level wrapper (`.ss-app`). Set background gradients, scanlines, or paper textures here.   |
| `[data-skin="..."] .ss-topbar`  | Top navigation bar (sticky). Control backdrop blur, borders, box-shadows.                         |
| `[data-skin="..."] .ss-sheet`   | The main content card. Control max-width, margins, drop-shadows, paper borders, notebook margins. |
| `[data-skin="..."] .ss-hero`    | The header containing course, title, and metadata chips.                                          |
| `[data-skin="..."] .ss-hero h1` | Main study sheet title. Add prefixes (`> `, Roman numerals), text-shadows, or underline rules.    |
| `[data-skin="..."] .ss-chip`    | Metadata pills (Subject, Difficulty, Time). Style as terminal flags, tags, or stamps.             |

### B. Semantic Callout Boxes (`.ss-box`)

Callout boxes communicate academic purpose. Customize borders, background tints, and badges by `data-kind`:

| Kind Selector                                       | Academic Purpose               | Typical Ricing Treatment                                 |
| :-------------------------------------------------- | :----------------------------- | :------------------------------------------------------- |
| `[data-skin="..."] .ss-box[data-kind="definition"]` | Core concept definitions       | Solid accent left border, subtle brand tint.             |
| `[data-skin="..."] .ss-box[data-kind="theorem"]`    | Mathematical / formal theorems | Double chalk border, small-caps serif typography.        |
| `[data-skin="..."] .ss-box[data-kind="formula"]`    | Key quantitative equations     | Monospace formula card, glowing accent border.           |
| `[data-skin="..."] .ss-box[data-kind="trap"]`       | Critical exam traps / pitfalls | Urgent red warning border (`--ss-bad`), hazard striping. |
| `[data-skin="..."] .ss-box[data-kind="warning"]`    | Caveats and exceptions         | Amber warning border (`--ss-warn`).                      |
| `[data-skin="..."] .ss-box[data-kind="mnemonic"]`   | Memory hooks and acronyms      | Playful badge, dashed border, accent tint.               |
| `[data-skin="..."] .ss-box[data-kind="checklist"]`  | Exam-readiness checklist       | Clipboard aesthetic, custom checkboxes.                  |
| `[data-skin="..."] .ss-box[data-kind="exercise"]`   | Practice exam questions        | Numbered exercise card, tag pills (`tag:exam`).          |

Box sub-elements:

- `.ss-box-head`: Header strip with kind badge and optional custom title.
- `.ss-box-kind`: The category label (`Definition`, `Trap`, etc.). Use `::before` for icons or prompts (e.g. `content: "$ ";` or `content: "⚠ ";`).
- `.ss-box-title`: Title of the callout box.
- `.ss-box-body`: Body content inside the box.

### C. Solutions & Derivations (`details.ss-solution`)

Worked exercises contain collapsible solutions:

- `[data-skin="..."] details.ss-solution`: Outer collapsible container.
- `[data-skin="..."] details.ss-solution summary`: The interactive bar toggling solution visibility.
- `[data-skin="..."] details.ss-solution[open] summary`: Opened state.
- `[data-skin="..."] details.ss-solution .ss-box-body`: Revealed step-by-step derivation.

### D. Code Blocks & Terminal

- `[data-skin="..."] .ss-code-container`: IDE code snippet card.
- `[data-skin="..."] .ss-code-header`: Top bar with language badge and Copy button.
- `[data-skin="..."] .ss-code-lang`: Language pill (e.g. `JAVA`, `PYTHON`).
- `[data-skin="..."] .ss-copy-btn`: 1-click clipboard button.
- `[data-skin="..."] .ss-terminal`: Bytecode / shell terminal card.
- `[data-skin="..."] .ss-terminal-bar span`: macOS/Linux traffic light buttons (Red, Amber, Green).

### E. Visual Embeds & Canvas Containers

- `[data-skin="..."] .ss-embed`: Generic container for visual diagrams.
- `[data-skin="..."] .ss-embed-cap`: Figure caption.
- `[data-skin="..."] .ss-mermaid`: Flowcharts and class diagrams.
- `[data-skin="..."] .ss-dot`: Graphviz DOT state machine automata.
- `[data-skin="..."] .ss-plot`: 2D function plot canvas.
- `[data-skin="..."] .ss-circuit`: SVG electronic circuit schematics.
- `[data-skin="..."] .ss-wave`: WaveDrom digital timing diagrams.
- `[data-skin="..."] .ss-ecg`: Lead-II ECG telemetry strips.
- `[data-skin="..."] .ss-odontogram`: FDI adult dental chart.
- `[data-skin="..."] .ss-smiles-card`: 2D chemical molecular cards.
- `[data-skin="..."] .ss-3d-viewport-wrap`: 3D WebGL Three.js viewport.

---

## 3. The Craft Floor & Non-Negotiable Invariants

When creating a new theme, follow these rules strictly to ensure usability, accessibility, and stability:

1. **Strict Scope Isolation**:
   Every CSS rule MUST be prefixed with `[data-skin="<theme-name>"]` (or `[data-skin="custom"]`). Never write un-scoped global rules like `body { ... }` or `h1 { ... }`, as they break other skins and topbar navigation.
2. **Contrast Ratio $\ge 4.5:1$ (WCAG AA)**:
   Body text (`--ss-fg`) must have sharp, high-contrast readability against both `--ss-bg` and `--ss-panel`. Never pair low-contrast grays on dark or pastel on white.
3. **Touch Targets $\ge 44\,\text{px}$**:
   Never decrease interactive heights below $44\,\text{px}$. Checklist labels, buttons, summary toggles, and dropdowns must remain easy to tap with a mobile thumb.
4. **Mobile Zero-Blowout ($360\,\text{px}$ safety)**:
   Never set fixed pixel widths on `.ss-sheet`, `.ss-box`, or `.ss-embed` (e.g. `width: 800px;` is prohibited; use `max-width: 800px; width: 100%;`).
5. **Preserve KaTeX Math & SVG Proportions**:
   Never add overflow clipping or fixed pixel heights that truncate LaTeX display equations or SVG diagrams.

---

## 4. Deep Ricing Techniques (Beyond Colors & Fonts)

High-grade ricing transforms the physical metaphor of the page. Use these advanced techniques:

### A. Textures and Background Atmosphere

```css
/* Example: Engineering Millimetric Grid Paper */
[data-skin="my-theme"] {
  background:
    linear-gradient(rgba(34, 197, 94, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34, 197, 94, 0.04) 1px, transparent 1px), #050e09;
  background-size: 20px 20px;
}
```

### B. Technical Corner Reticles & Ornaments

```css
/* Precision crosshairs on technical box corners */
[data-skin="my-theme"] .ss-box {
  position: relative;
}
[data-skin="my-theme"] .ss-box::before {
  content: "+";
  position: absolute;
  top: 2px;
  left: 4px;
  font-family: monospace;
  font-size: 10px;
  color: var(--ss-accent);
  opacity: 0.6;
}
[data-skin="my-theme"] .ss-box::after {
  content: "+";
  position: absolute;
  top: 2px;
  right: 4px;
  font-family: monospace;
  font-size: 10px;
  color: var(--ss-accent);
  opacity: 0.6;
}
```

### C. CRT Phosphor Glow / Neon Radiance

```css
/* Glowing waveform and circuit traces */
[data-skin="my-theme"] .ss-circuit svg,
[data-skin="my-theme"] .ss-plot svg,
[data-skin="my-theme"] .ss-wave svg {
  filter: drop-shadow(0 0 3px rgba(57, 255, 20, 0.5));
}
```

### D. Archival Manuscript / Small-Caps Headings

```css
/* Academic Bourbaki mathematics presentation */
[data-skin="my-theme"] .ss-hero h1,
[data-skin="my-theme"] h2 {
  font-family: "Latin Modern Roman", Georgia, serif;
  font-variant: small-caps;
  letter-spacing: 0.07em;
  border-bottom: 2px solid var(--ss-line);
  padding-bottom: 6px;
}
```

---

## 5. Complete Reference Theme: "Cyberpunk 2077 Night City"

Here is a complete, copy-pasteable example of an advanced custom dotfile theme:

```css
/* ============================================================
   Theme: Cyberpunk 2077 Night City
   Scope: [data-skin="custom"]
   ============================================================ */

[data-skin="custom"] {
  --ss-bg: #0d0e15;
  --ss-fg: #f3f4f6;
  --ss-muted: #9ca3af;
  --ss-panel: #131722;
  --ss-panel-2: #1b2030;
  --ss-line: #2e384d;
  --ss-accent: #fcee0a; /* Cyberpunk Yellow */
  --ss-accent-soft: rgba(252, 238, 10, 0.12);
  --ss-ok: #00ff9f; /* Neon Mint */
  --ss-bad: #ff0055; /* Neon Pink */
  --ss-warn: #fcee0a;
  --ss-font: "Rajdhani", system-ui, -apple-system, sans-serif;
  --ss-radius: 0px; /* Hard angular edges */
}

/* Atmospheric Scanline Vignette */
[data-skin="custom"] {
  background:
    radial-gradient(ellipse at 50% 0%, rgba(255, 0, 85, 0.06) 0%, transparent 60%),
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), #0d0e15;
  background-size:
    100% 100%,
    100% 3px,
    100% 100%;
}

/* Hard-Edged Sheet Container */
[data-skin="custom"] .ss-sheet {
  border: 1px solid var(--ss-line);
  border-top: 4px solid var(--ss-accent);
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.6),
    0 0 20px rgba(252, 238, 10, 0.08);
}

/* Glitch Prompt on Header */
[data-skin="custom"] .ss-hero h1 {
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #ffffff;
  text-shadow:
    2px 2px 0px rgba(255, 0, 85, 0.7),
    -2px -2px 0px rgba(0, 255, 159, 0.7);
}

/* Angular Cyberpunk Badges */
[data-skin="custom"] .ss-chip {
  text-transform: uppercase;
  font-family: ui-monospace, monospace;
  font-weight: 700;
  border-radius: 0;
  border: 1px solid var(--ss-accent);
  color: var(--ss-accent);
  background: rgba(252, 238, 10, 0.05);
}

/* Neo-Brutalist Box Callouts */
[data-skin="custom"] .ss-box {
  border-radius: 0;
  border: 1px solid var(--ss-line);
  background: var(--ss-panel);
}

[data-skin="custom"] .ss-box[data-kind="definition"] {
  border-left: 4px solid var(--ss-accent);
}

[data-skin="custom"] .ss-box[data-kind="trap"] {
  border-left: 4px solid var(--ss-bad);
  background: rgba(255, 0, 85, 0.05);
}

[data-skin="custom"] .ss-box-kind {
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 800;
  font-size: 11px;
}

/* Glowing Neon Curves */
[data-skin="custom"] .ss-circuit svg,
[data-skin="custom"] .ss-plot svg {
  filter: drop-shadow(0 0 3px rgba(0, 255, 159, 0.6));
}
```

---

## 6. How Students Import Their Themes

In the StudySheet app:

1. Open the top navigation bar.
2. Click the **`🎨` (Theme Studio)** button next to the skin picker.
3. Paste any custom CSS dotfile into the editor, or click **Import `.css`** to upload a file from disk.
4. The theme applies live immediately and automatically persists in `localStorage` across reloads.
5. Click **Export `.css`** anytime to save the theme file to share with classmates.

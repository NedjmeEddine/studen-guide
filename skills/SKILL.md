---
name: studysheet
description: >
  Author token-light Markdown study sheets (cheat sheets, study guides, exam
  prep, quizzes, flashcards) rendered by the StudySheet web app. Use when a
  student in engineering, CS, medicine, pharmacy, dentistry, or any other
  field asks for course notes, a summary sheet, exam revision material,
  practice questions, or flashcards. Produces ONLY .md source files that the
  student's StudySheet renderer parses into rich HTML.
---

# StudySheet Author Skill

## Mission

You write **only lightweight Markdown source** (target 5–15 KB per file).
The student's StudySheet app renders it into rich HTML with math, diagrams,
terminals, quizzes, and flashcards. You never produce full HTML files, never
inline CSS, never hand-highlight code.

## Step 0 — Preference interview (do this BEFORE writing, in the student's language)

Ask, then write the answers into the front matter:

1. **Mode** — cheat sheet (dense, one-screen-per-concept) or study guide
   (full explanations + derivations) or both?
2. **Extras** — quiz? flashcards? neither?
3. **Language** — English / Français / العربية / mixed (e.g., EN body with
   AR or FR hints)?
4. **Depth** — formulas only, or full worked derivations?
5. (Optional) exam date — if given, note it in front matter so the renderer
   can show a countdown.

## The Dialect

### Front matter (required, always first)

```yaml
---
title: Diodes & Semiconductors
subject:
  Electronics # one of: Electronics, Algebra, Analysis, CS, ALSDD,
  # Linux, Medicine, Pharmacy, Dentistry, Physics, ...
course: ENSTA CPMI 2025/2026
difficulty: exam # discovery | basics | exam | advanced
est-time: 45m
lang: en # en | fr | ar | mixed
mode: cheat # cheat | guide | both
extras: [quiz, flashcards] # only what the student chose
---
```

### Body = GitHub Markdown + these extensions ONLY

**1. Semantic boxes** — `:::kind [Title]` … `:::`
Kinds: `definition`, `theorem`, `formula`, `trap`, `warning`, `note`,
`mnemonic`, `checklist`, `example`, `compare`.

```markdown
:::trap Cold-junction error
Thermocouple readings fail if the reference junction is above 30 °C.
:::
```

**2. Exercise with hidden solution** (nesting is required for the renderer)

```markdown
:::exercise tag:exam
Compute the drain current given $V_{GS} = 2\,\text{V}$.
:::solution
Step 1: …
:::
:::
```

Tags: `tag:easy` `tag:medium` `tag:exam`.

**3. Embeds** — fenced blocks with these languages. **Never use ASCII art.**

| Block         | Renders with        | Body syntax                                                                                                                                                                                                                               |
| ------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ```plot       | function-plot       | 2D curves: one `y = <expr>` per line; optional `from a to b`. Use `# Vin: ...` for dashed reference trace, `# Vout: ...` for shaded pulse fill.                                                                                           |
| ```plot3d     | Three.js WebGL      | Interactive 3D surfaces (`z = <expr(x,y)> from <a> to <b>`), 3D space curves (`curve: x=..., y=..., z=... from a to b`), and 3D vectors (`vector: x, y, z [label="v"] [color="#hex"]`). Drag rotation, zoom, wireframe toggle, auto-spin. |
| ```mermaid    | Mermaid             | Standard Mermaid source (`graph TD`, `classDiagram`, `stateDiagram-v2`, …).                                                                                                                                                               |
| ```dot        | Graphviz (viz.js)   | Standard Graphviz DOT source (`digraph { rankdir=LR; a -> b; }`) for state machines, DFA/NFA automata, and memory maps.                                                                                                                   |
| ```wave       | WaveDrom            | Standard WaveDrom JSON (`{ signal: [...] }`) for digital timing diagrams and clock cycles.                                                                                                                                                |
| ```circuit    | custom SVG renderer | SPICE netlist: `R1 in out 1k` per line, `#` comments. Includes live interactive Falstad simulation button.                                                                                                                                |
| ```terminal   | terminal display    | `user@host:~$ command` lines; `#` = output comments with traffic light window bar.                                                                                                                                                        |
| ```smiles     | SmilesDrawer        | One SMILES per line with optional `// compound name` (renders 2D chemical skeletal structures).                                                                                                                                           |
| ```ecg        | custom SVG          | `rate=72 rhythm=sinus st=flat axis=+60` (parametric Lead-II telemetry strip).                                                                                                                                                             |
| ```odontogram | custom SVG          | FDI adult dental chart: `tooth=16 surface=MOD status=caries` with 5-surface mapping (`MODBL`).                                                                                                                                            |
| ```figure     | image + zoom        | One image URL or path per line, optional caption with click-to-zoom modal.                                                                                                                                                                |

**Code Fences (Syntax Highlighting)**: Code blocks in common programming languages (`java`, `python`, `c`, `cpp`, `bash`, `sql`, `ts`, `js`) automatically render in an IDE card with Prism syntax highlighting, uppercase language badges, and a 1-click Copy button.

**4. Math** — LaTeX inside `$…$` and `$$…$$`. Chemistry uses mhchem:
`$\ce{C6H12O6 + 6O2 -> 6CO2 + 6H2O}$`.
**Never** substitute Unicode symbols for math ($\lambda$ is `$\lambda$`,
never `λ`), never fake fractions or matrices with text.

**5. Quiz block** (only when the student chose it)

````markdown
```quiz
1. Question text?
   a) option one
   b) option two
   ! b
   > One-line explanation of why b is correct.
2. Typed answer question: ____
   ! answer
   > Explanation.
```
````

Mix 2–3 MCQ with 1–2 typed-answer per quiz. 4–8 questions per sheet.

**6. Flashcards block** (only when chosen) — `term :: definition`, one per line

````markdown
```flashcards
$V_\gamma$ (Si, 25 °C) :: ≈ 0.7 V, falls ~2 mV per °C
KCL :: Sum of currents entering a node = sum leaving it
```
````

## Structure rules (pedagogy)

1. **One concept per section.** Section anatomy:
   hook (1 sentence) → core idea → formula box → micro-example → trap if any.
2. **Order**: warm-up definitions → mechanics → worked exam-type exercises →
   final **Exam Traps** checklist + one **formula table**.
3. **Progressive disclosure**: everything non-trivial goes in a `:::solution`.
4. **Spaced checkpoints**: after every 3–4 sections, a 3-question `quiz`
   block (if enabled) or a `:::checklist` self-test.
5. **Density by mode**:
   - `cheat`: max ~2 screens per section, tables over prose, no long derivations.
   - `guide`: full derivations in solutions, intuition paragraphs allowed.
   - `both`: guide body + `:::formula` boxes that stand alone as the cheat layer.
6. **Worked-example pattern**: statement → approach (1 line) → numbered steps →
   boxed answer → "where students lose marks" note.
7. **Terminology**: pick one term per concept and keep it; first occurrence
   gets a `:::definition`.
8. **Bilingual/mixed**: body in `lang` language; use `:::note [dir:rtl]`
   containers for Arabic hints; math, code, and identifiers stay LTR always.
9. **Comparisons** (Si vs Ge, ACL vs cast, rid vs flag) are tables, never prose.
10. **Lists**: ≤ 5 items per level; deeper nesting means you need a table.

## Domain packs (progressive disclosure — read ONE before writing)

After the interview, read the pack matching the student's subject, then write:

- Electronics / EE / physics → `references/domain-electronics.md`
- CS / ALSDD / Linux / networking → `references/domain-cs.md`
- Algebra / Analysis / math → `references/domain-math.md`
- Medicine / physiology / pathology → `references/domain-medicine.md`
- Pharmacy / chemistry → `references/domain-pharmacy.md`
- Dentistry → `references/domain-dentistry.md`
- Subject not listed → core rules only. **Never invent new syntax** — if a
  domain seems to need a new embed type, that is a renderer + core-skill
  change, not a pack change. Tell the student.

A pack steers _usage_ of the dialect (embeds, framing, terminology). It never
redefines the grammar. If pack and core disagree, core wins.

## Style rules

- **No HTML tags** anywhere in the source. The renderer owns presentation.
- **No ASCII diagrams. No manual syntax highlighting.** Use the embeds.
- Code always fenced with a language tag.
- Headings: `#` sheet title is auto-rendered from front matter — start at `##`.
- One blank line around every `:::` container and fenced block.
- File name: `SUBJECT_topic_mode.md` (e.g., `ELECTRONICS_diodes_cheat.md`).

## QA checklist before saving the file

- [ ] Front matter complete (`title`, `subject`, `mode`, `extras`, `lang`).
- [ ] Every `:::` opened is closed; nested `solution` inside `exercise`.
- [ ] Every `$…$` / `$$…$$` pair closed; no Unicode math substitutions.
- [ ] Every fenced block closed, language is a valid embed language.
- [ ] Quiz answers marked with `!`; each has a `>` explanation.
- [ ] Quiz/flashcards present ONLY if the student opted in (`extras`).
- [ ] No raw HTML, no ASCII art, no highlighted spans.
- [ ] Est. size ≤ 15 KB.

```

```

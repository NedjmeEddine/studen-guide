# Domain Pack — Medicine

Applies when `subject:` is one of: Medicine, Physiology, Anatomy, Pathology,
Pharmacology, semiology, or clinical coursework. (Pharmacy and Dentistry have
their own packs; borrow from here only for shared clinical conventions.)

## Embeds to favor

| Need                                                 | Embed       | Convention                                                             |
| ---------------------------------------------------- | ----------- | ---------------------------------------------------------------------- |
| Anatomy / histology / radiographs                    | `figure`    | One image per line; label pins described in the caption, never assumed |
| Rhythms / strips                                     | `ecg`       | `rate=.. rhythm=.. st=.. axis=..`; one strip per concept               |
| Pathways (physiology, drug cascades, diff. dx trees) | `mermaid`   | `graph TD`; label edges with the triggering condition                  |
| Syndrome vs mimic / drug vs drug                     | table (GFM) | Columns: feature, condition A, condition B — never prose               |
| Red flags, "never miss" items                        | `:::trap`   | Use generously — safety content outranks density                       |

## Pedagogy conventions

1. **Vignette-first where possible.** Section anatomy becomes:
   presentation (1–2 lines) → mechanism → diagnosis → management.
2. **Exam = vignette.** Every 3–4 sections, one `:::exercise` written as a
   mini-case (stem → question), solution as a one-paragraph clinical reasoning.
3. **Doses** always in `:::formula` boxes: mg/kg, route, max dose, and the
   population (adult/peds). Never inline in prose.
4. **Lab values** in reference-range tables; state units in every table header
   (mmol/L vs mg/dL — pick per your country's convention and keep it).
5. **Pharmacology order is fixed**: mechanism → indications → adverse
   effects → interactions → contraindications. Same order for every drug.
6. **Eponyms**: give the modern descriptive name alongside
   (e.g., "Wolff–Parkinson–White (pre-excitation)"); pick one as primary.
7. **Progressive disclosure**: management details go in `:::solution`;
   the visible layer stays mechanism-level.

## Copyable section skeleton

```markdown
## <Finding or condition>

:::definition <One-sentence mechanism-level definition>
:::

<table: key features / criteria>

:::formula <Dose or reference range, if any>
:::

:::trap <The classic misdiagnosis or safety red flag>
:::

:::exercise tag:exam
<Stem: presentation + one perturbation.> What is the most likely…?
:::solution
<Reasoning paragraph: pattern → rule-out → answer.>
:::
:::
```

## Content traps in this domain (sheet-level)

- Mimics that share one symptom (STEMI vs pericarditis vs PE).
- Adult vs pediatric dose confusion — never merge them in one table column.
- Normal variants that look pathological (benign early repolarization…).

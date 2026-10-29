# Domain Pack — Dentistry & Oral Health

Applies when `subject:` is Dentistry, Operative Dentistry, Endodontics, Periodontics, Prosthodontics, Oral Surgery, or Pediatric Dentistry.

## The Odontogram Mandate (Hard Rule)

**Every study sheet introducing caries diagnosis, cavity restoration, endodontic treatment, or periodontal charting MUST include an `odontogram` block rendering an FDI Two-Digit adult dental chart.**

| Clinical Concept                   | Render it as | Convention                                                                                                                                        |
| ---------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dental Chart & Tooth Status        | `odontogram` | FDI two-digit notation (`tooth=11..48 surface=MODBL status=caries/composite/amalgam/crown/missing/endo`).                                         |
| Treatment Decision Pathways        | `mermaid`    | `graph TD` decision tree (e.g., reversible vs irreversible pulpitis $\to$ direct pulp cap vs root canal therapy).                                 |
| Cavity Classifications             | GFM Table    | G.V. Black's Classes I through VI with anatomical location, teeth involved, and preferred restorative technique.                                  |
| Local Anesthetic Maximum Doses     | `:::formula` | Explicit $\text{mg/kg}$ formulas, maximum absolute milligram caps, and cartridge volume equivalents ($1.8\,\text{mL}$ carpules).                  |
| Clinical Traps & Diagnostic Errors | `:::trap`    | Pitfalls like the necrotic pulp cold-test false negative, biological width violations, or composite polymerization shrinkage stress ($C$-factor). |

## Odontogram Syntax (`odontogram`)

The renderer generates a complete anatomical adult maxillary and mandibular dental arch from FDI lines:

```odontogram
# Adult Restorative Dental Chart (FDI System)
tooth=16 surface=MOD status=caries
tooth=14 surface=DO status=amalgam
tooth=21 surface=M status=composite
tooth=26 surface=all status=crown
tooth=36 surface=all status=crown
tooth=46 status=missing
tooth=47 surface=O status=caries
```

- **Tooth Numbers**: Two-digit FDI notation:
  - Quadrant 1: Maxillary Right (18 to 11)
  - Quadrant 2: Maxillary Left (21 to 28)
  - Quadrant 3: Mandibular Left (31 to 38)
  - Quadrant 4: Mandibular Right (48 to 41)
- **Surfaces**:
  - `M` (Mesial), `D` (Distal), `O` or `I` (Occlusal/Incisal), `B` or `V` (Buccal/Vestibular), `L` or `P` (Lingual/Palatal), or `all`
- **Statuses**:
  - `caries` (active decay $\to$ red `#ef4444`)
  - `composite` (tooth-colored resin $\to$ sky blue `#38bdf8`)
  - `amalgam` (silver filling $\to$ slate gray `#64748b`)
  - `crown` (full coverage $\to$ gold `#f59e0b`)
  - `missing` (extracted/missing $\to$ crossed-out diagonal lines)
  - `endo` (root canal treated $\to$ purple canal line `#a855f7`)

## Pedagogy & Clinical Conventions

1. **FDI Over Universal Notation**: Always use FDI two-digit numbering (universal 1–32 numbers cause cross-border confusion on exams).
2. **C-Factor Awareness**: In adhesive restorations, always highlight the Configuration Factor ($C\text{-Factor} = \frac{\text{Bonded Walls}}{\text{Unbonded Walls}}$) and mandate incremental placement ($\le 2\,\text{mm}$) when $C \ge 3$.
3. **Emergency Local Anesthesia Calculations**: Every pharmacology-related dentistry sheet must include the maximum recommended dose (MRD) calculation for 2% Lidocaine with 1:100,000 epinephrine ($4.4\,\text{mg/kg}$, absolute max $300\,\text{mg}$ / 8.3 cartridges).

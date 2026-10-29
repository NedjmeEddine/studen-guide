# Domain Pack — Pharmacy, Pharmacology & Medicinal Chemistry

Applies when `subject:` is Pharmacy, Pharmacology, Medicinal Chemistry, Pharmacokinetics (PK/PD), Toxicology, or Pharmacotherapy.

## The Molecular & Pathway Mandate (Hard Rule)

**Every study sheet introducing a drug class (NSAIDs, antibiotics, beta-blockers, opioids, local anesthetics) MUST include 2D chemical skeletal structures via `smiles` and a biochemical mechanism pathway via `mermaid`.**

| Need                             | Embed     | Convention                                                                                                                                            |
| -------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chemical Molecular Structures    | `smiles`  | One SMILES string per line with `// Generic Drug Name`. The renderer turns this into a clean 2D skeletal bond diagram.                                |
| Receptor & Signaling Pathways    | `mermaid` | `graph TD` showing ligand $\to$ receptor $\to$ second messenger $\to$ physiological effect $\to$ drug blockade/activation point.                      |
| Pharmacokinetic Absorption & pKa | `plot`    | Henderson-Hasselbalch ionization curve $y = 1 / (1 + 10^{\text{pH} - \text{p}K_a})$ showing gastric vs intestinal absorption.                         |
| Drug Class Comparisons           | GFM Table | Columns: Drug Name, Receptor Selectivity / Mechanism, Half-life ($t_{1/2}$), Primary Elimination, Black Box Warnings.                                 |
| Toxicities & Fatal Interactions  | `:::trap` | Document life-threatening drug-drug interactions (e.g. Aspirin + Ibuprofen competitive block, Triple Whammy acute renal failure, Serotonin syndrome). |

## 2D Molecular Structure Syntax (`smiles`)

```smiles
# 2D Skeletal Molecular Structures of Key Analgesic Compounds
CC(=O)Oc1ccccc1C(=O)O // Aspirin (Acetylsalicylic Acid - Irreversible COX Inhibitor)
CC(C)Cc1ccc(cc1)C(C)C(=O)O // Ibuprofen (Propionic Acid NSAID)
CC(=O)Nc1ccc(O)cc1 // Acetaminophen (Paracetamol)
Cc1ccc(cc1)c2cc(nn2c3ccc(cc3)S(=O)(=O)N)C(F)(F)F // Celecoxib (Selective COX-2 Inhibitor)
```

- Write standard SMILES strings.
- Add `// Drug Name (and mechanism)` to create an automatic card caption below the molecule.

## Pedagogy Conventions

1. **Structure-Activity Relationship (SAR)**: Highlight the pharmacophore (e.g., carboxylic acid group binding to Arg120 in COX-1, beta-lactam ring binding to PBP).
2. **PK/PD Kinetics**: Always provide half-life ($t_{1/2}$), volume of distribution ($V_d$), bioavailability ($F$), and active metabolites where relevant.
3. **Calculations in `:::formula`**: Include loading dose ($LD = \frac{C_p \times V_d}{F}$), maintenance dose ($MD = \frac{C_{ss} \times CL}{F}$), or creatinine clearance ($\text{CrCl}$ Cockcroft-Gault formula).
4. **Vignette-First Exam Exercises**: Frame exam exercises as patient cases (age, renal function, current medications) asking for drug of choice or interaction mechanism.

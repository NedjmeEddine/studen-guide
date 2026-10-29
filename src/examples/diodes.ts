export const DIODES_SHEET_SOURCE = `---
title: Diodes & Semiconductors
subject: Electronics
course: ENSTA CPMI 2025/2026
difficulty: exam
est-time: 40m
lang: en
mode: both
extras: [quiz, flashcards]
---

## The PN Junction in 60 Seconds

Hook: a diode is a one-way valve for current; everything below is just
consequences of that.

:::definition Diode equation
$$I_D = I_S\\left(e^{\\,V_D / nV_T} - 1\\right), \\qquad V_T = \\frac{kT}{q} \\approx 25\\,\\text{mV} \\text{ at } 300\\,\\text{K}$$
:::

:::formula Threshold voltages
| Material | $V_\\gamma$ (25 °C) |
|---|---|
| Silicon | 0.7 V |
| Germanium | 0.3 V |
| Schottky | 0.2–0.4 V |

:::

:::trap The 0.7 V reflex
0.7 V is a room-temperature silicon average. In forward bias exercises with
$I_S$ given, use the **diode equation** — the difference between 0.6 and 0.75 V
changes $I_D$ by an order of magnitude.
:::

## I–V Characteristic

\`\`\`plot
y = exp(40*x) - 1 from 0.5 to 0.8
y = 0 from 0.5 to 0.8
\`\`\`

:::mnemonic PIAN
**P**ositive = **A**node, **I**n = **N**-side conduction… remember instead:
arrow = current direction when forward-biased.
:::

## Rectifier Circuits

\`\`\`circuit
# Half-wave rectifier
V1 in 0 SINE(10, 50)
D1 out in 1N4148
R1 out 0 1k
\`\`\`

\`\`\`plot
# Half-Wave Rectifier Waveforms (Oscilloscope View)
# Vin: 10 V AC input sine wave
y = 10 * sin(x) from 0 to 12.57
# Vout: Rectified output across 1k load (0.7 V drop)
y = max(0, 10 * sin(x) - 0.7) from 0 to 12.57
\`\`\`

:::checklist Rectifier self-test
- [ ] Can I sketch Vout without the diagram?
- [ ] Do I know which half-cycle conducts?
- [ ] PIV — can I state it for half-wave and bridge?
:::

## Worked Exercise

:::exercise tag:exam
$I_S = 10\\,\\text{nA}$, $n = 1$. Find $I_D$ at $V_D = 0.65\\,\\text{V}$, $T = 300\\,\\text{K}$.
:::solution
1. Approach: diode equation, not the 0.7 V shortcut.
2. $I_D = 10^{-9}\\left(e^{0.65/0.025} - 1\\right)$
3. $0.65 / 0.025 = 26 \\Rightarrow e^{26} \\approx 2 \\times 10^{11}$
4. $I_D \\approx 0.2\\,\\text{A}$ — the 0.7 V shortcut would have said ~zero current.
:::
:::

:::exercise tag:medium
A diode drops 0.70 V at 1 mA. Estimate $V_D$ at 100 mA ($n = 1$).
:::solution
$\\Delta V = nV_T \\ln(100) = 0.025 \\times 4.6 \\approx 0.12\\,\\text{V} \\Rightarrow V_D \\approx 0.82\\,\\text{V}$.
:::
:::

## Exam Traps

:::checklist Night-before list
- [ ] Ge 0.3 V, Si 0.7 V, Schottky ~0.3 V — don't mix.
- [ ] $V_T$ is 25 mV, not 25 V.
- [ ] Reverse bias: only $I_S$ flows; breakdown ≠ destruction (Zener).
- [ ] Bridge rectifier PIV = $V_m$; half-wave PIV = $V_m$; full-wave center-tap = $2V_m$.
:::

\`\`\`quiz
1. A silicon diode at 25 °C conducts noticeably above:
   a) 0.3 V   b) 0.7 V   c) 1.2 V
   ! b
   > Ge is ~0.3 V; 1.2 V is a red LED forward voltage.
2. In the diode equation, doubling $I_S$ at fixed $V_D$ does what to $I_D$?
   a) halves it   b) leaves it unchanged   c) doubles it
   ! c
   > $I_D$ is proportional to $I_S$ at fixed $V_D$ and $T$.
3. PIV for a bridge rectifier equals ____.
   ! V_m (peak of the input)
   > Each diode blocks at most the full peak.
\`\`\`

\`\`\`flashcards
$V_\\gamma$ Si / Ge / Schottky (25 °C) :: 0.7 / 0.3 / 0.2–0.4 V
$V_T$ at 300 K :: kT/q ≈ 25–26 mV
Bridge PIV :: $V_m$ — one diode pair blocks the full peak
Diode equation :: $I_D = I_S\\left(e^{V_D/nV_T} - 1\\right)$
\`\`\`
`;

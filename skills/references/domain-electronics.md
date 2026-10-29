# Domain Pack — Electronics & Electrical Engineering

Applies when `subject:` is Electronics, Electrical Engineering, Circuit Analysis, Semiconductors, or Analog/Digital Signal Processing.

## The Diagram & Waveform Mandate (Hard Rule)

**Every section that introduces a circuit topology (rectifier, filter, amplifier, logic gate, clipper/clamper) MUST include a `circuit` schematic and/or an oscilloscope `plot` waveform.**

| Circuit / Phenomenon           | Render it as | Convention                                                                                                                                                   |
| ------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Analog Circuit Schematic       | `circuit`    | SPICE-like netlist: `Comp nodeA nodeB [value]`, ground rail on node `0` or `gnd`. Clicking the diagram activates the live interactive Falstad simulator.     |
| Oscilloscope Waveforms         | `plot`       | Dual-trace analog signals: `# Vin: ...` produces a dashed reference input curve; `# Vout: ...` produces a bold trace with shaded pulse fill under the curve. |
| Digital Timing & Bus Protocols | `wave`       | WaveDrom JSON `{ signal: [...] }` for clock cycles, setup/hold times, and bus state transitions.                                                             |
| Frequency Response (Bode Plot) | `plot`       | Magnitude $                                                                                                                                                  | H(j\omega) | $ in dB or cutoff roll-off curves ($20\,\text{dB/decade}$). |
| I–V Diode / Transistor Curves  | `plot`       | Non-linear exponential curve $I_D = I_S(e^{V_D/nV_T} - 1)$ overlaid with threshold knee voltage ($0.7\,\text{V}$).                                           |

## Circuit Netlist Syntax (`circuit`)

The renderer generates clean, scalable SVG circuit schematics directly from netlist lines:

```circuit
# Half-wave rectifier with resistive load
V1 in 0 SINE(10, 50)
D1 out in 1N4148
R1 out 0 1k
```

- **Component types supported**: `R` (resistor), `C` (capacitor), `L` (inductor), `D` (diode/LED), `V` (voltage source), `I` (current source), `0`/`gnd` (ground rail).
- **Falstad Live Simulation**: A `"⚡ Simulate Live ⏵"` action button is automatically added above the schematic.

## Oscilloscope Dual-Trace Waveform Conventions (`plot`)

When plotting input and output waveforms for clippers, clampers, rectifiers, or filters:

```plot
# Half-Wave Rectifier Waveforms (Oscilloscope View)
# Vin: 10 V AC input sine wave (CH1 Reference)
y = 10 * sin(x) from 0 to 12.57
# Vout: Rectified output across 1k load (CH2 Peak 9.3 V, 0.7 V drop)
y = max(0, 10 * sin(x) - 0.7) from 0 to 12.57
```

- Prefixing a comment with `# Vin` or `# input` automatically renders the trace with a dashed stroke.
- Prefixing a comment with `# Vout` or `# rectif` automatically renders the trace with translucent area shading under the pulse.

## Pedagogy & Engineering Conventions

1. **Threshold Voltage Rule**: Always state the semiconductor material: Silicon ($V_\gamma \approx 0.7\,\text{V}$), Germanium ($V_\gamma \approx 0.3\,\text{V}$), Schottky ($V_\gamma \approx 0.2–0.4\,\text{V}$).
2. **Failure Mode Warnings**: Highlight component ratings (Peak Inverse Voltage $\text{PIV}$, power dissipation $P = I^2 R$, breakdown voltage $V_{BR}$) inside a `:::trap` box.
3. **Worked Calculations**: Must show numeric values with engineering units ($\text{V}$, $\text{mV}$, $\text{A}$, $\text{mA}$, $\mu\text{A}$, $\text{k}\Omega$, $\text{MHz}$) inside `:::formula` or `:::solution` boxes.

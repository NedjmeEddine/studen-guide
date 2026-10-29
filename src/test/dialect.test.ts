import { describe, expect, it } from "vitest";
import {
  parseFrontMatter,
  tokenize,
  parseSheet,
  parseQuiz,
  typedMatches,
  parseFlashcards,
  walk,
} from "@/dialect/parse";
import { protectMath, releaseMath, renderMd } from "@/dialect/markdown";
import { circuitSvg, parseNetlist } from "@/embeds/circuit";
import { ecgSvg, parseEcg } from "@/embeds/ecg";
import { odontogramSvg, parseOdontogram } from "@/embeds/odontogram";
import { parsePlot3D } from "@/embeds/Plot3D";
import { DIODES_SHEET_SOURCE } from "@/examples/diodes";

describe("StudySheet Dialect Engine", () => {
  describe("Front Matter Parser", () => {
    it("parses valid front matter fields", () => {
      const { meta, body, warnings } = parseFrontMatter(DIODES_SHEET_SOURCE);
      expect(warnings).toHaveLength(0);
      expect(meta.title).toBe("Diodes & Semiconductors");
      expect(meta.subject).toBe("Electronics");
      expect(meta.course).toBe("ENSTA CPMI 2025/2026");
      expect(meta.difficulty).toBe("exam");
      expect(meta["est-time"]).toBe("40m");
      expect(meta.mode).toBe("both");
      expect(meta.extras).toEqual(["quiz", "flashcards"]);
      expect(body).toContain("## The PN Junction in 60 Seconds");
    });
  });

  describe("Tokenizer & Semantic Boxes", () => {
    it("parses semantic boxes and embeds", () => {
      const sheet = parseSheet(DIODES_SHEET_SOURCE);
      expect(sheet.warnings).toHaveLength(0);

      const kinds: string[] = [];
      const embeds: string[] = [];
      walk(sheet.nodes, (n) => {
        if (n.type === "box") kinds.push(n.kind);
        if (n.type === "fence") embeds.push(n.lang);
      });

      expect(kinds).toContain("definition");
      expect(kinds).toContain("formula");
      expect(kinds).toContain("trap");
      expect(kinds).toContain("mnemonic");
      expect(kinds).toContain("checklist");
      expect(kinds).toContain("exercise");
      expect(kinds).toContain("solution");

      expect(embeds).toContain("plot");
      expect(embeds).toContain("circuit");
      expect(embeds).toContain("quiz");
      expect(embeds).toContain("flashcards");
    });

    it("parses wave block syntax", () => {
      const nodes = tokenize('```wave\n{ "signal": [{ "name": "clk", "wave": "p..." }] }\n```');
      expect(nodes[0]).toEqual({
        type: "fence",
        lang: "wave",
        code: '{ "signal": [{ "name": "clk", "wave": "p..." }] }',
        unclosed: false,
      });
    });

    it("parses exercise tags and nested solution", () => {
      const { body } = parseFrontMatter(DIODES_SHEET_SOURCE);
      const nodes = tokenize(body);
      const exercises = nodes.filter((n) => n.type === "box" && n.kind === "exercise");
      expect(exercises.length).toBe(2);

      const examEx = exercises.find((e) => e.type === "box" && e.attrs.tag === "exam");
      expect(examEx).toBeDefined();
      if (examEx && examEx.type === "box") {
        const sol = examEx.children.find((c) => c.type === "box" && c.kind === "solution");
        expect(sol).toBeDefined();
      }

      const medEx = exercises.find((e) => e.type === "box" && e.attrs.tag === "medium");
      expect(medEx).toBeDefined();
    });
  });

  describe("Quiz Parser", () => {
    const quizCode = `1. A silicon diode at 25 °C conducts noticeably above:
   a) 0.3 V   b) 0.7 V   c) 1.2 V
   ! b
   > Ge is ~0.3 V; 1.2 V is a red LED forward voltage.
2. In the diode equation, doubling $I_S$ at fixed $V_D$ does what to $I_D$?
   a) halves it   b) leaves it unchanged   c) doubles it
   ! c
   > $I_D$ is proportional to $I_S$ at fixed $V_D$ and $T$.
3. PIV for a bridge rectifier equals ____.
   ! V_m (peak of the input)
   > Each diode blocks at most the full peak.`;

    it("parses questions, MCQ options, and typed answer", () => {
      const { questions, warnings } = parseQuiz(quizCode);
      expect(warnings).toHaveLength(0);
      expect(questions).toHaveLength(3);

      expect(questions[0]?.n).toBe(1);
      expect(questions[0]?.options).toHaveLength(3);
      expect(questions[0]?.answer).toBe("b");
      expect(questions[0]?.letters).toEqual(["b"]);

      expect(questions[1]?.n).toBe(2);
      expect(questions[1]?.answer).toBe("c");
      expect(questions[1]?.letters).toEqual(["c"]);

      expect(questions[2]?.n).toBe(3);
      expect(questions[2]?.options).toHaveLength(0);
      expect(questions[2]?.letters).toBeNull();
      expect(questions[2]?.answer).toBe("V_m (peak of the input)");
    });

    it("evaluates typed answers with alias matching", () => {
      const expected = "V_m (peak of the input)";
      expect(typedMatches("V_m", expected)).toBe(true);
      expect(typedMatches("v_m", expected)).toBe(true);
      expect(typedMatches("v_m (peak of the input)", expected)).toBe(true);
      expect(typedMatches("2*V_m", expected)).toBe(false);
    });
  });

  describe("Flashcards Parser", () => {
    const fcCode = `$V_\\gamma$ Si / Ge / Schottky (25 °C) :: 0.7 / 0.3 / 0.2–0.4 V
$V_T$ at 300 K :: kT/q ≈ 25–26 mV
Bridge PIV :: $V_m$ — one diode pair blocks the full peak
Diode equation :: $I_D = I_S\\left(e^{V_D/nV_T} - 1\\right)`;

    it("parses 4 card pairs with math terms", () => {
      const { cards, warnings } = parseFlashcards(fcCode);
      expect(warnings).toHaveLength(0);
      expect(cards).toHaveLength(4);
      expect(cards[0]?.front).toContain("$V_\\gamma$");
      expect(cards[2]?.front).toBe("Bridge PIV");
      expect(cards[2]?.back).toContain("one diode pair blocks the full peak");
    });
  });

  describe("Math Protection & Rendering", () => {
    it("preserves underscores inside LaTeX math without turning into italics", () => {
      const src = "$I_D = I_S\\left(e^{\\,V_D / nV_T} - 1\\right)$";
      const { text, store } = protectMath(src);
      expect(text).toMatch(/%%M\d+%%/);
      expect(store).toHaveLength(1);
      expect(store[0]).toContain("katex");

      const html = renderMd(src);
      expect(html).toContain("katex");
      expect(html).not.toContain("<em>");
    });
  });

  describe("Custom Circuit SVG Generator", () => {
    const netlist = `# Half-wave rectifier
V1 in 0 SINE(10, 50)
D1 out in 1N4148
R1 out 0 1k`;

    it("parses netlist and generates valid SVG", () => {
      const { comps } = parseNetlist(netlist);
      expect(comps).toHaveLength(3);

      const res = circuitSvg(netlist);
      expect(res.count).toBe(3);
      expect(res.svg).toContain("<svg");
      expect(res.svg).toContain("1N4148");
      expect(res.svg).toContain("1k");
      expect(res.svg).toContain("rail");
    });
  });

  describe("Custom ECG Strip Generator", () => {
    it("parses ECG params and produces SVG trace", () => {
      const src = "rate=75 rhythm=sinus st=elevated axis=+60";
      const p = parseEcg(src);
      expect(p.rate).toBe(75);
      expect(p.st).toBe("elevated");

      const svg = ecgSvg(src);
      expect(svg).toContain("<svg");
      expect(svg).toContain('class="ss-ecg"');
    });
  });

  describe("Custom Odontogram Generator (Dentistry)", () => {
    it("parses FDI tooth numbers and surfaces into anatomical SVG", () => {
      const src = `# Adult Dental Chart
tooth=16 surface=MOD status=caries
tooth=21 surface=M status=composite
tooth=36 surface=all status=crown
tooth=46 status=missing`;

      const { records, warnings, title } = parseOdontogram(src);
      expect(warnings).toHaveLength(0);
      expect(title).toBe("Adult Dental Chart");
      expect(records.size).toBe(4);

      const t16 = records.get(16);
      expect(t16?.status).toBe("caries");
      expect(t16?.surfaces.has("M")).toBe(true);
      expect(t16?.surfaces.has("O")).toBe(true);
      expect(t16?.surfaces.has("D")).toBe(true);

      const res = odontogramSvg(src);
      expect(res.count).toBe(4);
      expect(res.svg).toContain("<svg");
      expect(res.svg).toContain('class="ss-odontogram"');
      expect(res.svg).toContain("Maxillary (Right)");
      expect(res.svg).toContain("16");
      expect(res.svg).toContain("21");
    });
  });

  describe("Plot3D Parser (Three.js WebGL)", () => {
    it("parses 3D multivariable surface expressions and bounds", () => {
      const src = `# Hyperbolic Paraboloid Loss Landscape
z = x^2 - y^2 from -2 to 2`;
      const p = parsePlot3D(src);
      expect(p.title).toBe("Hyperbolic Paraboloid Loss Landscape");
      expect(p.surface?.expr).toBe("x^2 - y^2");
      expect(p.surface?.min).toBe(-2);
      expect(p.surface?.max).toBe(2);
    });

    it("parses 3D vectors and parametric space curves", () => {
      const src = `# 3D Coordinate Basis and Helix Trajectory
vector: 2, 3, 1 label="v1" color="#38bdf8"
curve: x = 2*cos(t), y = 2*sin(t), z = 0.5*t from 0 to 20 color="#22c55e"`;
      const p = parsePlot3D(src);
      expect(p.vectors).toHaveLength(1);
      expect(p.vectors[0]?.x).toBe(2);
      expect(p.vectors[0]?.label).toBe("v1");

      expect(p.curves).toHaveLength(1);
      expect(p.curves[0]?.xExpr).toBe("2*cos(t)");
      expect(p.curves[0]?.max).toBe(20);
    });
  });

  describe("Print Stylesheet Integrity (Summary Course Mode)", () => {
    it("ensures interactive blocks and controls are excluded in @media print", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const cssPath = path.resolve(__dirname, "../studysheet.css");
      const css = fs.readFileSync(cssPath, "utf8");

      // Verify print media query exists
      expect(css).toContain("@media print");

      // Verify interactive quiz & flashcards are set to display: none !important
      const printBlock = css.slice(css.indexOf("@media print"));
      expect(printBlock).toContain(".ss-quiz");
      expect(printBlock).toContain(".ss-fc");
      expect(printBlock).toMatch(/\.ss-quiz[\s\S]*?display:\s*none\s*!important/);
      expect(printBlock).toMatch(/\.ss-fc[\s\S]*?display:\s*none\s*!important/);

      // Verify interactive buttons are hidden
      expect(printBlock).toContain(".ss-copy-btn");
      expect(printBlock).toContain(".ss-circuit-sim-btn");
      expect(printBlock).toContain(".ss-3d-controls");
      expect(printBlock).toContain(".ss-3d-hint");

      // Verify solution summary is preserved with clean badge
      expect(printBlock).toContain("details.ss-solution summary::after");
      expect(printBlock).toMatch(
        /details\.ss-solution summary::after[\s\S]*?display:\s*none\s*!important/,
      );

      // Verify flowcharts and diagrams have capped print max-height
      expect(printBlock).toContain(".ss-mermaid svg");
      expect(printBlock).toMatch(/\.ss-mermaid svg[\s\S]*?max-height:\s*280px\s*!important/);
      expect(printBlock).toMatch(/\.ss-dot svg[\s\S]*?max-height:\s*280px\s*!important/);
    });
  });

  describe("In-App AI Skills & Prompt Builder", () => {
    it("assembles complete authoring prompts with domain guidelines", async () => {
      const { buildAuthoringPrompt, buildRicingPrompt, DOMAINS, SKILL_MD, SKIN_MD } =
        await import("@/skills/all-skills");
      expect(DOMAINS.length).toBe(7);
      expect(SKILL_MD).toContain("StudySheet Author Skill");
      expect(SKIN_MD).toContain("StudySheet Theme Ricing Skill");

      const prompt = buildAuthoringPrompt({
        domainId: "cs",
        courseTopic: "Operating Systems: Virtual Memory & Page Tables",
        mode: "exam",
      });
      expect(prompt).toContain("Operating Systems: Virtual Memory & Page Tables");
      expect(prompt).toContain("mode: exam");
      expect(prompt).toContain("domain-cs");
      expect(prompt).toContain("recursion");

      const ricePrompt = buildRicingPrompt("Cyberpunk Neon Night");
      expect(ricePrompt).toContain("Cyberpunk Neon Night");
      expect(ricePrompt).toContain('[data-skin="custom"]');
    });
  });
});

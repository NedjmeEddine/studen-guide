import { useEffect, useId, useMemo, useRef, useState } from "react";
import { circuitSvg } from "./circuit";
import { ecgSvg } from "./ecg";
import { odontogramSvg } from "./odontogram";
import { Plot3D } from "./Plot3D";
import { escapeHtml, renderInline } from "@/dialect/markdown";
import { isCodeLang } from "@/dialect/parse";
import { WarnChip } from "@/ui/WarnChip";
import { ensurePrismLanguages, highlightCode } from "./syntax";

function Frame({
  label,
  children,
  warn,
}: {
  label: string;
  children: React.ReactNode;
  warn?: string[];
}) {
  return (
    <figure className="ss-embed" data-embed={label}>
      {children}
      {warn?.map((w) => (
        <WarnChip key={w}>{w}</WarnChip>
      ))}
    </figure>
  );
}

function Passthrough({ lang, code, msg }: { lang: string; code: string; msg: string }) {
  return (
    <div className="ss-embed">
      <WarnChip>{msg}</WarnChip>
      <pre className="ss-code">
        <code>{"```" + lang + "\n" + code + "\n```"}</code>
      </pre>
    </div>
  );
}

/* ---------- plot ---------- */
// Zero-eval, CSP-safe recursive descent mathematical expression sampler for plot auto-scaling.
function evaluator(expr: string): ((x: number) => number) | null {
  const s = expr.replace(/\s+/g, "").toLowerCase();
  let pos = 0;

  function parseExpr(x: number): number {
    let val = parseTerm(x);
    while (pos < s.length && (s[pos] === "+" || s[pos] === "-")) {
      const op = s[pos++];
      const right = parseTerm(x);
      val = op === "+" ? val + right : val - right;
    }
    return val;
  }

  function parseTerm(x: number): number {
    let val = parseFactor(x);
    while (pos < s.length && (s[pos] === "*" || s[pos] === "/")) {
      const op = s[pos++];
      const right = parseFactor(x);
      val = op === "*" ? val * right : val / right;
    }
    return val;
  }

  function parseFactor(x: number): number {
    let val = parseUnary(x);
    if (pos < s.length && s[pos] === "^") {
      pos++;
      const right = parseFactor(x);
      val = Math.pow(val, right);
    }
    return val;
  }

  function parseUnary(x: number): number {
    if (pos < s.length && s[pos] === "-") {
      pos++;
      return -parseUnary(x);
    }
    if (pos < s.length && s[pos] === "+") {
      pos++;
      return parseUnary(x);
    }
    return parsePrimary(x);
  }

  function parsePrimary(x: number): number {
    if (s[pos] === "(") {
      pos++;
      const val = parseExpr(x);
      if (s[pos] === ")") pos++;
      return val;
    }
    const numMatch = s.slice(pos).match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/);
    if (numMatch) {
      pos += numMatch[0].length;
      return parseFloat(numMatch[0]);
    }
    const idMatch = s.slice(pos).match(/^[a-z_]\w*/);
    if (idMatch) {
      const id = idMatch[0];
      pos += id.length;
      if (id === "x") return x;
      if (id === "pi") return Math.PI;
      if (id === "e") return Math.E;
      if (s[pos] === "(") {
        pos++;
        const args: number[] = [];
        if (s[pos] !== ")") {
          args.push(parseExpr(x));
          while (pos < s.length && s[pos] === ",") {
            pos++;
            args.push(parseExpr(x));
          }
        }
        if (s[pos] === ")") pos++;
        switch (id) {
          case "sin":
            return Math.sin(args[0]);
          case "cos":
            return Math.cos(args[0]);
          case "tan":
            return Math.tan(args[0]);
          case "asin":
            return Math.asin(args[0]);
          case "acos":
            return Math.acos(args[0]);
          case "atan":
            return Math.atan(args[0]);
          case "exp":
            return Math.exp(args[0]);
          case "log":
          case "ln":
            return Math.log(args[0]);
          case "sqrt":
            return Math.sqrt(args[0]);
          case "abs":
            return Math.abs(args[0]);
          case "max":
            return Math.max(...args);
          case "min":
            return Math.min(...args);
          case "pow":
            return Math.pow(args[0], args[1]);
          default:
            return NaN;
        }
      }
    }
    pos++;
    return NaN;
  }

  return (x: number) => {
    pos = 0;
    try {
      const res = parseExpr(x);
      return Number.isFinite(res) ? res : NaN;
    } catch {
      return NaN;
    }
  };
}
const PLOT_COLORS = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed"];

export function parsePlot(code: string) {
  const fns: {
    expr: string;
    range?: [number, number];
    label?: string;
    closed?: boolean;
    dashed?: boolean;
  }[] = [];
  const warnings: string[] = [];
  let title = "";
  let lastComment = "";

  for (const raw of code.split("\n")) {
    const l = raw.trim();
    if (!l) continue;
    if (l.startsWith("#")) {
      const c = l.replace(/^#\s*/, "").trim();
      if (!title) title = c;
      lastComment = c;
      continue;
    }
    const m = l.match(/^y\s*=\s*(.+?)(?:\s+from\s+(-?[\d.e+-]+)\s+to\s+(-?[\d.e+-]+))?$/i);
    if (!m) warnings.push(`Plot line must be "y = <expr> [from a to b]": "${l}"`);
    else {
      const expr = m[1].trim();
      const isVout = /vout|rectif|pulse|fill|area/i.test(lastComment);
      const isVin = /vin|input|ref|dash/i.test(lastComment);
      fns.push({
        expr,
        range: m[2] ? [+m[2], +m[3]] : undefined,
        label: lastComment || undefined,
        closed: isVout,
        dashed: isVin,
      });
      lastComment = "";
    }
  }
  return { fns, warnings, title };
}
function Plot({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string[]>([]);
  const { fns, warnings, title } = useMemo(() => parsePlot(code), [code]);

  useEffect(() => {
    let dead = false;
    let timer: number | null = null;

    function draw() {
      if (dead || !ref.current) return;
      const errs = [...warnings];
      import("function-plot")
        .then((rawMod: unknown) => {
          if (dead || !ref.current) return;
          const mod = rawMod as { default?: unknown };
          const defObj = mod?.default as { default?: unknown } | undefined;
          const fp =
            typeof mod?.default === "function"
              ? mod.default
              : typeof defObj?.default === "function"
                ? defObj.default
                : typeof mod === "function"
                  ? mod
                  : null;
          if (!fp) {
            errs.push("Plot failed: function-plot did not export a callable function");
            setErr(errs);
            return;
          }
          const ranges = fns.map((f) => f.range).filter(Boolean) as [number, number][];
          const xd: [number, number] = ranges.length
            ? [Math.min(...ranges.map((r) => r[0])), Math.max(...ranges.map((r) => r[1]))]
            : [-5, 5];
          let lo = Infinity,
            hi = -Infinity;
          for (const f of fns) {
            const ev = evaluator(f.expr);
            if (!ev) continue;
            const [a, b] = f.range ?? xd;
            for (let i = 0; i <= 200; i++) {
              const y = ev(a + ((b - a) * i) / 200);
              if (Number.isFinite(y)) {
                lo = Math.min(lo, y);
                hi = Math.max(hi, y);
              }
            }
          }
          const pad = (hi - lo || 1) * 0.08;
          const clientW = ref.current.clientWidth || 320;
          const width = Math.min(clientW, 720);
          ref.current.innerHTML = "";
          try {
            (fp as unknown as (o: unknown) => void)({
              target: ref.current,
              width,
              height: Math.max(220, Math.round(width * 0.55)),
              grid: true,
              disableZoom: true,
              xAxis: { domain: xd },
              yAxis: Number.isFinite(lo) ? { domain: [lo - pad, hi + pad] } : undefined,
              data: fns.map((f, idx) => ({
                fn: f.expr,
                range: f.range,
                graphType: "polyline",
                closed: f.closed,
                nSamples: 500,
                color: PLOT_COLORS[idx % PLOT_COLORS.length],
                attr: f.dashed
                  ? { "stroke-dasharray": "6,4", "stroke-width": 2 }
                  : { "stroke-width": 2.5 },
              })),
            });
            const svg = ref.current?.querySelector("svg");
            if (!svg) {
              errs.push("Plot rendered no SVG in container");
            }
          } catch (e) {
            errs.push(`Plot failed: ${(e as Error).message}`);
          }
          setErr(errs);
        })
        .catch((e: Error) => {
          setErr([`Plot import failed: ${e.message}`]);
        });
    }

    draw();

    let lastW = ref.current?.clientWidth ?? 0;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = Math.round(entry.contentRect.width);
        if (Math.abs(newW - lastW) > 20) {
          lastW = newW;
          if (timer) window.clearTimeout(timer);
          timer = window.setTimeout(draw, 150);
        }
      }
    });

    if (ref.current) observer.observe(ref.current);

    return () => {
      dead = true;
      if (timer) window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [code, fns, warnings]);

  return (
    <Frame label="plot" warn={err}>
      {title && <figcaption className="ss-embed-cap">{title}</figcaption>}
      {fns.length > 1 && (
        <div className="ss-plot-legend">
          {fns.map((f, i) => (
            <span key={i} className="ss-plot-legend-item">
              <span
                className="ss-plot-legend-dot"
                style={{ backgroundColor: PLOT_COLORS[i % PLOT_COLORS.length] }}
              />
              {f.label || `y = ${f.expr}`}
            </span>
          ))}
        </div>
      )}
      <div ref={ref} className="ss-plot" />
    </Frame>
  );
}

/* ---------- wave ---------- */
let waveIdx = 0;
function Wave({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefix = "ss-wave-" + useId().replace(/[^\w]/g, "") + "-";
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let dead = false;
    let json: unknown;
    try {
      json = JSON.parse(code);
    } catch {
      try {
        // WaveDrom sources are often JSON5-ish (unquoted keys).
        json = JSON.parse(
          code.replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":').replace(/'/g, '"'),
        );
      } catch (e) {
        setErr(`wave: invalid JSON — ${(e as Error).message}`);
        return;
      }
    }
    import("wavedrom").then((mod) => {
      if (dead || !ref.current) return;
      const W = ((mod as { default?: unknown }).default ?? mod) as Record<string, unknown>;
      const skin = W.waveSkin;
      if (skin) (window as unknown as { WaveSkin: unknown }).WaveSkin = skin;
      const idx = waveIdx++;
      ref.current.innerHTML = "";
      ref.current.id = prefix + idx;
      try {
        if (typeof W.renderWaveElement === "function")
          (W.renderWaveElement as (...a: unknown[]) => void)(idx, json, ref.current, skin);
        else if (typeof W.RenderWaveForm === "function")
          (W.RenderWaveForm as (...a: unknown[]) => void)(idx, json, prefix);
        else if (typeof W.renderWaveForm === "function")
          (W.renderWaveForm as (...a: unknown[]) => void)(idx, json, prefix);
        if (!ref.current.querySelector("svg")) setErr("wave: WaveDrom produced no SVG.");
      } catch (e) {
        setErr(`wave: ${(e as Error).message}`);
      }
    });
    return () => {
      dead = true;
    };
  }, [code, prefix]);
  return (
    <Frame label="wave" warn={err ? [err] : undefined}>
      <div ref={ref} className="ss-wave" />
    </Frame>
  );
}

/* ---------- mermaid (lazy, ~1 MB) ---------- */
let mermaidN = 0;
function Mermaid({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let dead = false;
    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral" });
      try {
        const { svg } = await mermaid.render("ss-mmd-" + mermaidN++, code);
        if (!dead && ref.current) {
          ref.current.innerHTML = svg;
          const svgEl = ref.current.querySelector("svg");
          if (svgEl) {
            svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
          }
        }
      } catch (e) {
        if (!dead) setErr(`mermaid: ${(e as Error).message?.split("\n")[0]}`);
      }
    });
    return () => {
      dead = true;
    };
  }, [code]);
  return (
    <Frame label="mermaid" warn={err ? [err] : undefined}>
      <div ref={ref} className="ss-mermaid">
        {err && <pre className="ss-code">{code}</pre>}
      </div>
    </Frame>
  );
}

/* ---------- terminal ---------- */
function Terminal({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <Frame label="terminal">
      <div className="ss-terminal" dir="ltr">
        <div className="ss-terminal-bar">
          <span />
          <span />
          <span />
        </div>
        <pre>
          {lines.map((l, i) => {
            const m = l.match(/^([\w.-]+@[\w.-]+:[^$#]*[$#])\s?(.*)$/);
            if (m)
              return (
                <div key={i}>
                  <span className="prompt">{m[1]}</span> <span className="cmd">{m[2]}</span>
                </div>
              );
            if (l.trimStart().startsWith("#"))
              return (
                <div key={i} className="out">
                  {l.replace(/^\s*#\s?/, "")}
                </div>
              );
            return (
              <div key={i} className="out">
                {l}
              </div>
            );
          })}
        </pre>
      </div>
    </Frame>
  );
}

/* ---------- figure ---------- */
function Figure({ code }: { code: string }) {
  const items = code
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [url, ...cap] = l.split("|");
      return { url: url.trim(), cap: cap.join("|").trim() };
    });
  const [zoom, setZoom] = useState<string | null>(null);
  const bad = items.filter((i) => /^(javascript|data):/i.test(i.url));
  return (
    <Frame label="figure" warn={bad.map((b) => `Blocked image URL: ${b.url.slice(0, 40)}`)}>
      <div className="ss-figures">
        {items
          .filter((i) => !bad.includes(i))
          .map((it, i) => (
            <figure key={i}>
              <button type="button" onClick={() => setZoom(it.url)} aria-label="Zoom image">
                <img src={it.url} alt={it.cap || "Figure"} loading="lazy" />
              </button>
              {it.cap && <figcaption dangerouslySetInnerHTML={{ __html: renderInline(it.cap) }} />}
            </figure>
          ))}
      </div>
      {zoom && (
        <button
          type="button"
          className="ss-zoom"
          onClick={() => setZoom(null)}
          aria-label="Close zoom"
        >
          <img src={zoom} alt="" />
        </button>
      )}
    </Frame>
  );
}

function SvgEmbed({ label, svg, warn }: { label: string; svg: string; warn?: string[] }) {
  return (
    <Frame label={label} warn={warn}>
      <div className={`ss-${label}`} dangerouslySetInnerHTML={{ __html: svg }} />
    </Frame>
  );
}

function Circuit({ code }: { code: string }) {
  const r = useMemo(() => circuitSvg(code), [code]);
  const [simOpen, setSimOpen] = useState(false);
  return (
    <Frame label="circuit" warn={r.warnings}>
      <div className="ss-circuit-header">
        {r.title && <figcaption className="ss-embed-cap">{r.title}</figcaption>}
        <button
          type="button"
          className="ss-sim-btn"
          onClick={() => setSimOpen(!simOpen)}
          title="Open interactive Falstad circuit simulation"
        >
          ⚡ {simOpen ? "Close Simulation" : "Simulate Live ⏵"}
        </button>
      </div>
      <div className="ss-circuit-wrap" dangerouslySetInnerHTML={{ __html: r.svg }} />
      {simOpen && (
        <div className="ss-sim-frame-wrap">
          <iframe
            src="https://www.falstad.com/circuit/circuitjs.html"
            title="Falstad Circuit Simulation"
            className="ss-sim-iframe"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}
    </Frame>
  );
}

/* ---------- odontogram (Dentistry) ---------- */
function Odontogram({ code }: { code: string }) {
  const r = useMemo(() => odontogramSvg(code), [code]);
  return (
    <Frame label="odontogram" warn={r.warnings.length ? r.warnings : undefined}>
      {r.title && <figcaption className="ss-embed-cap">{r.title}</figcaption>}
      <div className="ss-odontogram-wrap" dangerouslySetInnerHTML={{ __html: r.svg }} />
    </Frame>
  );
}

/* ---------- dot (Graphviz via @viz-js/viz) ---------- */
function Dot({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;
    import("@viz-js/viz")
      .then(async ({ instance }) => {
        try {
          const viz = await instance();
          if (dead || !ref.current) return;
          const svg = viz.renderString(code, { format: "svg" });
          if (!dead && ref.current) {
            ref.current.innerHTML = svg;
            const svgEl = ref.current.querySelector("svg");
            if (svgEl) {
              svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
            }
          }
        } catch (e) {
          if (!dead) setErr(`dot: ${(e as Error).message}`);
        }
      })
      .catch((e: Error) => {
        if (!dead) setErr(`dot: failed to load Graphviz — ${e.message}`);
      });

    return () => {
      dead = true;
    };
  }, [code]);

  return (
    <Frame label="dot" warn={err ? [err] : undefined}>
      <div ref={ref} className="ss-dot">
        {err && <pre className="ss-code">{code}</pre>}
      </div>
    </Frame>
  );
}

/* ---------- smiles (2D Molecular Drawer for Chemistry/Pharmacy) ---------- */
function Smiles({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const items = useMemo(() => {
    return code
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const [smi, ...rest] = l.split("//");
        return { smiles: smi.trim(), name: rest.join("//").trim() };
      });
  }, [code]);

  useEffect(() => {
    let dead = false;
    const warns: string[] = [];
    import("smiles-drawer")
      .then(({ default: SmilesDrawer }) => {
        if (dead || !containerRef.current) return;
        const svgs = containerRef.current.querySelectorAll<SVGSVGElement>("svg[data-smiles]");
        svgs.forEach((svgEl) => {
          const smi = svgEl.getAttribute("data-smiles");
          if (!smi) return;
          try {
            SmilesDrawer.parse(
              smi,
              (tree: unknown) => {
                if (dead) return;
                const drawer = new SmilesDrawer.SvgDrawer({
                  width: 280,
                  height: 180,
                  bondThickness: 1.5,
                  fontSizeLarge: 7,
                });
                drawer.draw(tree, svgEl, "light", false);
              },
              (err: unknown) => {
                warns.push(
                  `smiles: failed to parse "${smi}" — ${(err as Error)?.message || String(err)}`,
                );
                setWarnings([...warns]);
              },
            );
          } catch (e) {
            warns.push(`smiles: ${(e as Error).message}`);
            setWarnings([...warns]);
          }
        });
      })
      .catch((e: Error) => {
        setWarnings([`smiles: failed to load smiles-drawer — ${e.message}`]);
      });

    return () => {
      dead = true;
    };
  }, [items]);

  return (
    <Frame label="smiles" warn={warnings.length ? warnings : undefined}>
      <div ref={containerRef} className="ss-smiles-grid">
        {items.map((it, idx) => (
          <figure key={idx} className="ss-smiles-card">
            <svg data-smiles={it.smiles} viewBox="0 0 280 180" className="ss-smiles-svg" />
            {it.name && <figcaption className="ss-smiles-label">{it.name}</figcaption>}
          </figure>
        ))}
      </div>
    </Frame>
  );
}

function Planned({ lang, code }: { lang: string; code: string }) {
  return (
    <Frame label={lang}>
      <div className="ss-planned">
        <span className="ss-chip">{lang} · renderer planned</span>
        <pre className="ss-code">
          <code>{code}</code>
        </pre>
      </div>
    </Frame>
  );
}

function highlightCode(code: string, lang: string): string {
  const normalized = lang.toLowerCase();
  const grammar =
    Prism.languages[normalized] ||
    (normalized === "js" || normalized === "javascript"
      ? Prism.languages.javascript
      : normalized === "ts" || normalized === "typescript"
        ? Prism.languages.typescript
        : normalized === "py"
          ? Prism.languages.python
          : normalized === "sh" || normalized === "shell"
            ? Prism.languages.bash
            : null);

  if (grammar) {
    try {
      return Prism.highlight(code, grammar, normalized);
    } catch {
      return escapeHtml(code);
    }
  }
  return escapeHtml(code);
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [html, setHtml] = useState(() => highlightCode(code, lang));

  useEffect(() => {
    let dead = false;
    ensurePrismLanguages().then(() => {
      if (!dead) setHtml(highlightCode(code, lang));
    });
    return () => {
      dead = true;
    };
  }, [code, lang]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard denied */
    }
  };

  return (
    <div className="ss-code-container" data-lang={lang || undefined} dir="ltr">
      <div className="ss-code-header">
        <span className="ss-code-lang">{lang.toUpperCase() || "CODE"}</span>
        <button
          type="button"
          className="ss-copy-btn"
          onClick={onCopy}
          aria-label="Copy code to clipboard"
        >
          {copied ? "Copied! ✓" : "Copy"}
        </button>
      </div>
      <pre className="ss-code">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

export function Embed({
  lang,
  code,
  unclosed,
}: {
  lang: string;
  code: string;
  unclosed?: boolean;
}) {
  if (unclosed)
    return (
      <Passthrough lang={lang} code={code} msg={`Unclosed \`\`\`${lang} block — showing source.`} />
    );
  switch (lang) {
    case "plot":
      return <Plot code={code} />;
    case "plot3d":
    case "3d":
      return <Plot3D code={code} />;
    case "wave":
      return <Wave code={code} />;
    case "mermaid":
      return <Mermaid code={code} />;
    case "circuit":
      return <Circuit code={code} />;
    case "terminal":
      return <Terminal code={code} />;
    case "figure":
      return <Figure code={code} />;
    case "ecg":
      return <SvgEmbed label="ecg" svg={ecgSvg(code)} />;
    case "odontogram":
      return <Odontogram code={code} />;
    case "dot":
      return <Dot code={code} />;
    case "smiles":
      return <Smiles code={code} />;
  }
  if (isCodeLang(lang)) return <CodeBlock lang={lang} code={code} />;
  return (
    <Passthrough
      lang={lang}
      code={code}
      msg={`Unknown embed language "${lang}" — showing source.`}
    />
  );
}

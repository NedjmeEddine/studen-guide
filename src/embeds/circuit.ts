// Custom netlist → SVG. `Comp nodeA nodeB [value]`, `#` comments, node 0/gnd = ground rail.
import { escapeHtml as esc } from "@/dialect/markdown";

type Comp = { name: string; a: string; b: string; value: string };
const isGnd = (n: string) => n === "0" || n.toLowerCase() === "gnd";

export function parseNetlist(src: string) {
  const comps: Comp[] = [];
  const warnings: string[] = [];
  let title = "";
  for (const raw of src.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      if (!title) title = line.slice(1).trim();
      continue;
    }
    const p = line.split(/\s+/);
    if (p.length < 3) {
      warnings.push(`Circuit line needs "Comp nodeA nodeB": "${line}"`);
      continue;
    }
    comps.push({ name: p[0], a: p[1], b: p[2], value: p.slice(3).join(" ") });
  }
  return { comps, warnings, title };
}

const kindOf = (name: string) => name[0].toUpperCase();

function symbol(kind: string, len: number): string {
  // Drawn horizontally from (0,0) to (len,0); caller rotates.
  const m = len / 2;
  const lead = (a: number, b: number) => `<path d="M0 0H${a}M${b} 0H${len}"/>`;
  switch (kind) {
    case "R": {
      let d = `M${m - 20} 0`;
      for (let i = 0; i < 6; i++) d += `L${m - 20 + 3.33 + i * 6.67} ${i % 2 ? 7 : -7}`;
      d += `L${m + 20} 0`;
      return lead(m - 20, m + 20) + `<path d="${d}" fill="none"/>`;
    }
    case "C":
      return lead(m - 4, m + 4) + `<path d="M${m - 4} -12V12M${m + 4} -12V12"/>`;
    case "L": {
      let d = `M${m - 20} 0`;
      for (let i = 0; i < 4; i++) d += `a5 5 0 0 1 10 0`;
      return lead(m - 20, m + 20) + `<path d="${d}" fill="none"/>`;
    }
    case "D":
      return (
        lead(m - 9, m + 9) +
        `<path d="M${m - 9} -9L${m + 9} 0L${m - 9} 9Z" class="fill"/><path d="M${m + 9} -10V10"/>`
      );
    case "V":
    case "I":
      return (
        lead(m - 15, m + 15) +
        `<circle cx="${m}" cy="0" r="15" fill="none"/>` +
        (kind === "V"
          ? `<path d="M${m - 9} 0q4.5 -9 9 0t9 0" fill="none"/>`
          : `<path d="M${m - 8} 0H${m + 8}M${m + 3} -5L${m + 8} 0L${m + 3} 5" fill="none"/>`)
      );
    default:
      return (
        lead(m - 16, m + 16) + `<rect x="${m - 16}" y="-9" width="32" height="18" fill="none"/>`
      );
  }
}

export function circuitSvg(src: string) {
  const { comps, warnings, title } = parseNetlist(src);
  const nodes: string[] = [];
  for (const c of comps)
    for (const n of [c.a, c.b]) if (!isGnd(n) && !nodes.includes(n)) nodes.push(n);
  const STEP = 160,
    X0 = 60,
    TOP = 50,
    GND = 170;
  const x = (n: string) => X0 + nodes.indexOf(n) * STEP;
  const W = Math.max(X0 * 2 + (nodes.length - 1) * STEP, 220);
  const parts: string[] = [];
  const pairCount = new Map<string, number>();
  let hasGnd = false;

  for (const c of comps) {
    const k = kindOf(c.name);
    const label = `<tspan class="nm">${esc(c.name)}</tspan>${c.value ? ` <tspan class="val">${esc(c.value)}</tspan>` : ""}`;
    if (isGnd(c.a) || isGnd(c.b)) {
      hasGnd = true;
      const n = isGnd(c.a) ? c.b : c.a;
      if (isGnd(n)) continue;
      const key = `${n}|g`;
      const off = (pairCount.get(key) ?? 0) * 46;
      pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
      const cx = x(n) + off;
      // Draw from top node (a-end) to ground; sources point upward.
      const flip = isGnd(c.b) && (k === "V" || k === "I");
      parts.push(
        `<g transform="translate(${cx} ${flip ? GND : TOP}) rotate(${flip ? -90 : 90})">${symbol(k, GND - TOP)}</g>`,
        off ? `<path d="M${x(n)} ${TOP}H${cx}M${x(n)} ${GND}H${cx}"/>` : "",
        `<text x="${cx + 20}" y="${(TOP + GND) / 2 + 4}">${label}</text>`,
      );
    } else {
      const [p, q] = [c.a, c.b].sort((u, v) => x(u) - x(v));
      const key = `${p}|${q}`;
      const lane = pairCount.get(key) ?? 0;
      pairCount.set(key, lane + 1);
      const y = TOP - lane * 44;
      const reversed = x(c.a) > x(c.b); // symbol points from nodeA to nodeB
      const len = Math.abs(x(q) - x(p));
      parts.push(
        lane ? `<path d="M${x(p)} ${TOP}V${y}M${x(q)} ${TOP}V${y}"/>` : "",
        `<g transform="translate(${reversed ? x(q) : x(p)} ${y})${reversed ? " scale(-1 1)" : ""}">${symbol(k, len)}</g>`,
        `<text x="${(x(p) + x(q)) / 2}" y="${y - 16}" text-anchor="middle">${label}</text>`,
      );
    }
  }
  if (hasGnd) {
    const gx = X0 + ((nodes.length - 1) * STEP) / 2;
    parts.push(
      `<path d="M${X0 - 20} ${GND}H${W - X0 + 20 + Math.max(0, ...[...pairCount.values()].map((v) => (v - 1) * 46))}" class="rail"/>`,
      `<path d="M${gx} ${GND}V${GND + 10}M${gx - 12} ${GND + 10}H${gx + 12}M${gx - 7} ${GND + 15}H${gx + 7}M${gx - 3} ${GND + 20}H${gx + 3}"/>`,
    );
  }
  for (const n of nodes) {
    parts.push(
      `<circle cx="${x(n)}" cy="${TOP}" r="3.5" class="fill"/>`,
      `<text x="${x(n)}" y="${TOP - 26 - Math.max(0, ...[...pairCount.entries()].filter(([k]) => k.includes(n) && !k.endsWith("|g")).map(([, v]) => (v - 1) * 44))}" text-anchor="middle" class="node">${esc(n)}</text>`,
    );
  }
  const maxLane = Math.max(
    0,
    ...[...pairCount.entries()].filter(([k]) => !k.endsWith("|g")).map(([, v]) => v - 1),
  );
  const top = -maxLane * 44;
  const extraW = Math.max(
    0,
    ...[...pairCount.entries()].filter(([k]) => k.endsWith("|g")).map(([, v]) => (v - 1) * 46),
  );
  const svg = `<svg class="ss-circuit" viewBox="0 ${top} ${W + extraW + 40} ${GND + 30 - top}" role="img" aria-label="${esc(title || "Circuit")}">${parts.join("")}</svg>`;
  return { svg, warnings, title, count: comps.length };
}

// `rate=72 rhythm=sinus st=flat axis=+60` → schematic lead-II strip (custom SVG).
import { escapeHtml as esc } from "@/dialect/markdown";

export function parseEcg(src: string) {
  const o: Record<string, string> = {};
  for (const m of src.matchAll(/(\w+)=([^\s]+)/g)) o[m[1].toLowerCase()] = m[2];
  return {
    rate: Math.min(220, Math.max(20, Number(o.rate) || 72)),
    rhythm: (o.rhythm || "sinus").toLowerCase(),
    st: (o.st || "flat").toLowerCase(),
    axis: o.axis || "+60",
  };
}

export function ecgSvg(src: string) {
  const p = parseEcg(src);
  const W = 600,
    H = 140,
    base = 80,
    pxPerSec = 100; // 6 s strip
  const rr = 60 / p.rate;
  const stOff =
    p.st === "elevated" || p.st === "up" ? -12 : p.st === "depressed" || p.st === "down" ? 10 : 0;
  let d = `M0 ${base}`;
  let t = 0.2;
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  while (t * pxPerSec < W - 40) {
    const x = t * pxPerSec;
    const noP = p.rhythm === "af" || p.rhythm === "afib";
    if (noP) {
      for (let k = 0; k < 8; k++) d += ` L${x - 20 + k * 2.5} ${base + (rnd() - 0.5) * 5}`;
    } else d += ` L${x - 22} ${base} q6 -10 12 0`;
    d += ` L${x - 4} ${base} l3 6 l5 -58 l5 70 l4 -18 l6 ${stOff} l14 0 q10 -16 20 ${-stOff}`;
    const jitter = noP ? rr * (0.6 + rnd() * 0.8) : rr;
    t += jitter;
  }
  d += ` L${W} ${base}`;
  const grid: string[] = [];
  for (let gx = 0; gx <= W; gx += 20) grid.push(`M${gx} 0V${H}`);
  for (let gy = 0; gy <= H; gy += 20) grid.push(`M0 ${gy}H${W}`);
  return `<svg class="ss-ecg" viewBox="0 0 ${W} ${H}" role="img" aria-label="ECG strip"><path d="${grid.join("")}" class="grid" fill="none"/><path d="${d}" class="trace" fill="none"/><text x="8" y="16">Lead II · ${p.rate} bpm · ${esc(p.rhythm)} · ST ${esc(p.st)} · axis ${esc(p.axis)}°</text></svg>`;
}

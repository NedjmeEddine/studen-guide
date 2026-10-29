// Parametric FDI Two-Digit Adult Odontogram (Dental Chart) Generator.
// Pure SVG — zero dependencies, works offline and in Cloudflare Workers.
import { escapeHtml as esc } from "@/dialect/markdown";

export type ToothSurface = "M" | "O" | "D" | "B" | "L";

export type ToothRecord = {
  tooth: number;
  surfaces: Set<ToothSurface>;
  status: "caries" | "composite" | "amalgam" | "crown" | "missing" | "endo" | "sound";
  notes?: string;
};

export function parseOdontogram(src: string) {
  const records = new Map<number, ToothRecord>();
  const warnings: string[] = [];
  let title = "";

  for (const raw of src.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      if (!title) title = line.replace(/^#\s*/, "").trim();
      continue;
    }

    const o: Record<string, string> = {};
    for (const m of line.matchAll(/(\w+)=([^\s]+)/g)) {
      o[m[1].toLowerCase()] = m[2];
    }

    const tNum = parseInt(o.tooth ?? o.t ?? "", 10);
    if (isNaN(tNum) || tNum < 11 || tNum > 48) {
      warnings.push(`Odontogram: invalid FDI tooth number in "${line}" (expected 11–48)`);
      continue;
    }

    const rawSurf = (o.surface ?? o.s ?? "").toUpperCase();
    const surfaces = new Set<ToothSurface>();
    if (rawSurf === "ALL" || o.status === "crown") {
      surfaces.add("M");
      surfaces.add("O");
      surfaces.add("D");
      surfaces.add("B");
      surfaces.add("L");
    } else {
      for (const ch of rawSurf) {
        if (ch === "M" || ch === "O" || ch === "D" || ch === "B" || ch === "L") {
          surfaces.add(ch as ToothSurface);
        } else if (ch === "I" || ch === "V" || ch === "P") {
          // Incisal -> Occlusal, Vestibular -> Buccal, Palatal -> Lingual
          if (ch === "I") surfaces.add("O");
          if (ch === "V") surfaces.add("B");
          if (ch === "P") surfaces.add("L");
        }
      }
    }

    const rawStatus = (o.status ?? o.st ?? "caries").toLowerCase();
    let status: ToothRecord["status"] = "sound";
    if (rawStatus.startsWith("car") || rawStatus === "c") status = "caries";
    else if (rawStatus.startsWith("comp") || rawStatus === "resin") status = "composite";
    else if (rawStatus.startsWith("amal") || rawStatus === "am") status = "amalgam";
    else if (rawStatus.startsWith("crow") || rawStatus === "cr") status = "crown";
    else if (rawStatus.startsWith("miss") || rawStatus === "x") status = "missing";
    else if (rawStatus.startsWith("endo") || rawStatus === "rct") status = "endo";

    records.set(tNum, {
      tooth: tNum,
      surfaces: surfaces.size > 0 ? surfaces : new Set(["O"]),
      status,
      notes: o.notes ? o.notes.replace(/_/g, " ") : undefined,
    });
  }

  return { records, warnings, title };
}

// FDI Adult Dental Arch Quadrants
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

const STATUS_COLORS: Record<string, string> = {
  caries: "#ef4444", // Red for active decay
  composite: "#38bdf8", // Sky blue for aesthetic resin
  amalgam: "#64748b", // Silver/slate for amalgam restoration
  crown: "#f59e0b", // Gold/amber for full coverage crown
  endo: "#a855f7", // Purple for endodontic treatment
  sound: "var(--ss-panel-2, #f1f5f9)",
};

function renderToothSvg(tNum: number, cx: number, cy: number, rec?: ToothRecord): string {
  const size = 30;
  const half = size / 2;
  const centerSize = 10;
  const cHalf = centerSize / 2;

  // Determine which side is Mesial vs Distal
  // In Q1 & Q4 (Patient Right): Mesial is toward the patient midline (RIGHT side of visual tooth)
  // In Q2 & Q3 (Patient Left): Mesial is toward the patient midline (LEFT side of visual tooth)
  const isPatientRight = tNum < 20 || (tNum >= 40 && tNum <= 48);

  const getSurfaceColor = (surf: ToothSurface): string => {
    if (!rec) return STATUS_COLORS.sound;
    if (rec.status === "crown") return STATUS_COLORS.crown;
    if (rec.surfaces.has(surf)) return STATUS_COLORS[rec.status] || STATUS_COLORS.caries;
    return STATUS_COLORS.sound;
  };

  const isMissing = rec?.status === "missing";
  const isEndo = rec?.status === "endo";

  const mesialColor = isPatientRight ? getSurfaceColor("M") : getSurfaceColor("M");
  const distalColor = isPatientRight ? getSurfaceColor("D") : getSurfaceColor("D");
  const buccalColor = getSurfaceColor("B");
  const lingualColor = getSurfaceColor("L");
  const occlusalColor = getSurfaceColor("O");

  const leftColor = isPatientRight ? distalColor : mesialColor;
  const rightColor = isPatientRight ? mesialColor : distalColor;

  // 5 surfaces: Center (Occlusal) + 4 Trapezoids (Buccal/Top, Lingual/Bottom, Left, Right)
  const x1 = cx - half,
    y1 = cy - half;
  const x2 = cx + half,
    y2 = cy + half;
  const cx1 = cx - cHalf,
    cy1 = cy - cHalf;
  const cx2 = cx + cHalf,
    cy2 = cy + cHalf;

  let shapes = `
    <!-- Buccal (Top) -->
    <polygon points="${x1},${y1} ${x2},${y1} ${cx2},${cy1} ${cx1},${cy1}" fill="${buccalColor}" stroke="var(--ss-line, #94a3b8)" stroke-width="0.8"/>
    <!-- Lingual (Bottom) -->
    <polygon points="${x1},${y2} ${x2},${y2} ${cx2},${cy2} ${cx1},${cy2}" fill="${lingualColor}" stroke="var(--ss-line, #94a3b8)" stroke-width="0.8"/>
    <!-- Left -->
    <polygon points="${x1},${y1} ${cx1},${cy1} ${cx1},${cy2} ${x1},${y2}" fill="${leftColor}" stroke="var(--ss-line, #94a3b8)" stroke-width="0.8"/>
    <!-- Right -->
    <polygon points="${x2},${y1} ${cx2},${cy1} ${cx2},${cy2} ${x2},${y2}" fill="${rightColor}" stroke="var(--ss-line, #94a3b8)" stroke-width="0.8"/>
    <!-- Occlusal (Center) -->
    <rect x="${cx1}" y="${cy1}" width="${centerSize}" height="${centerSize}" fill="${occlusalColor}" stroke="var(--ss-line, #94a3b8)" stroke-width="0.8"/>
  `;

  if (isEndo) {
    shapes += `<line x1="${cx}" y1="${y1 - 4}" x2="${cx}" y2="${y2 + 4}" stroke="${STATUS_COLORS.endo}" stroke-width="2.5" stroke-linecap="round"/>`;
  }

  if (isMissing) {
    shapes += `
      <rect x="${x1}" y="${y1}" width="${size}" height="${size}" fill="rgba(0,0,0,0.06)" stroke="var(--ss-line, #94a3b8)" stroke-dasharray="2,2"/>
      <line x1="${x1 - 2}" y1="${y1 - 2}" x2="${x2 + 2}" y2="${y2 + 2}" stroke="#ef4444" stroke-width="2.5"/>
      <line x1="${x1 - 2}" y1="${y2 + 2}" x2="${x2 + 2}" y2="${y1 - 2}" stroke="#ef4444" stroke-width="2.5"/>
    `;
  }

  return shapes;
}

export function odontogramSvg(src: string) {
  const { records, warnings, title } = parseOdontogram(src);

  const toothW = 38;
  const rowH = 75;
  const marginX = 40;
  const midlineW = 20;
  const totalW = marginX * 2 + 16 * toothW + midlineW;
  const totalH = rowH * 2 + 65;

  const parts: string[] = [];

  // Midline separator
  const midX = marginX + 8 * toothW + midlineW / 2;
  parts.push(
    `<line x1="${midX}" y1="20" x2="${midX}" y2="${totalH - 35}" stroke="var(--ss-line, #cbd5e1)" stroke-width="1.5" stroke-dasharray="4,3"/>`,
  );
  parts.push(
    `<line x1="20" y1="${rowH + 28}" x2="${totalW - 20}" y2="${rowH + 28}" stroke="var(--ss-line, #cbd5e1)" stroke-width="1" stroke-dasharray="2,2"/>`,
  );

  // Labels for Patient Orientation
  parts.push(
    `<text x="${marginX}" y="16" font-size="10" font-weight="700" fill="var(--ss-muted, #64748b)">Maxillary (Right)</text>`,
  );
  parts.push(
    `<text x="${totalW - marginX}" y="16" text-anchor="end" font-size="10" font-weight="700" fill="var(--ss-muted, #64748b)">Maxillary (Left)</text>`,
  );
  parts.push(
    `<text x="${marginX}" y="${totalH - 8}" font-size="10" font-weight="700" fill="var(--ss-muted, #64748b)">Mandibular (Right)</text>`,
  );
  parts.push(
    `<text x="${totalW - marginX}" y="${totalH - 8}" text-anchor="end" font-size="10" font-weight="700" fill="var(--ss-muted, #64748b)">Mandibular (Left)</text>`,
  );

  // Render Upper Row (Maxillary): Q1 (18->11) then Q2 (21->28)
  const upperY = 44;
  UPPER_RIGHT.forEach((tNum, idx) => {
    const x = marginX + idx * toothW + toothW / 2;
    parts.push(
      `<text x="${x}" y="${upperY - 14}" text-anchor="middle" font-size="10.5" font-weight="600" fill="var(--ss-fg, #0f172a)">${tNum}</text>`,
    );
    parts.push(renderToothSvg(tNum, x, upperY + 6, records.get(tNum)));
  });

  UPPER_LEFT.forEach((tNum, idx) => {
    const x = marginX + 8 * toothW + midlineW + idx * toothW + toothW / 2;
    parts.push(
      `<text x="${x}" y="${upperY - 14}" text-anchor="middle" font-size="10.5" font-weight="600" fill="var(--ss-fg, #0f172a)">${tNum}</text>`,
    );
    parts.push(renderToothSvg(tNum, x, upperY + 6, records.get(tNum)));
  });

  // Render Lower Row (Mandibular): Q4 (48->41) then Q3 (31->38)
  const lowerY = upperY + rowH + 20;
  LOWER_RIGHT.forEach((tNum, idx) => {
    const x = marginX + idx * toothW + toothW / 2;
    parts.push(renderToothSvg(tNum, x, lowerY, records.get(tNum)));
    parts.push(
      `<text x="${x}" y="${lowerY + 28}" text-anchor="middle" font-size="10.5" font-weight="600" fill="var(--ss-fg, #0f172a)">${tNum}</text>`,
    );
  });

  LOWER_LEFT.forEach((tNum, idx) => {
    const x = marginX + 8 * toothW + midlineW + idx * toothW + toothW / 2;
    parts.push(renderToothSvg(tNum, x, lowerY, records.get(tNum)));
    parts.push(
      `<text x="${x}" y="${lowerY + 28}" text-anchor="middle" font-size="10.5" font-weight="600" fill="var(--ss-fg, #0f172a)">${tNum}</text>`,
    );
  });

  const svg = `<svg class="ss-odontogram" viewBox="0 0 ${totalW} ${totalH}" role="img" aria-label="${esc(title || "Dental Odontogram")}">${parts.join("")}</svg>`;

  return { svg, warnings, title, count: records.size };
}

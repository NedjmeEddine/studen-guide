// StudySheet Markdown-dialect v1 (frozen). Pure parsing — no DOM, no React.

export const BOX_KINDS = [
  "definition",
  "theorem",
  "formula",
  "trap",
  "warning",
  "note",
  "mnemonic",
  "checklist",
  "example",
  "compare",
  "exercise",
  "solution",
] as const;
export type BoxKind = (typeof BOX_KINDS)[number];

export const EMBED_LANGS = [
  "plot",
  "plot3d",
  "3d",
  "mermaid",
  "dot",
  "wave",
  "circuit",
  "terminal",
  "smiles",
  "ecg",
  "odontogram",
  "figure",
  "quiz",
  "flashcards",
] as const;

export type Meta = {
  title?: string;
  subject?: string;
  course?: string;
  difficulty?: string;
  "est-time"?: string;
  lang?: string;
  mode?: string;
  extras: string[];
  "exam-date"?: string;
  [k: string]: unknown;
};

export type Node =
  | { type: "md"; text: string }
  | { type: "fence"; lang: string; code: string; unclosed?: boolean }
  | {
      type: "box";
      kind: string;
      title: string;
      attrs: Record<string, string>;
      children: Node[];
      unclosed?: boolean;
      unknown?: boolean;
      raw: string;
    };

export type Sheet = { meta: Meta; nodes: Node[]; warnings: string[] };

export function parseFrontMatter(src: string): { meta: Meta; body: string; warnings: string[] } {
  const warnings: string[] = [];
  const meta: Meta = { extras: [] };
  const text = src.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) {
    warnings.push("Missing front matter (--- … --- block at the top).");
    return { meta, body: text, warnings };
  }
  for (const line of m[1].split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const kv = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!kv) {
      warnings.push(`Unreadable front-matter line: "${line}"`);
      continue;
    }
    const v = kv[2].trim().replace(/^["']|["']$/g, "");
    if (kv[1] === "extras") {
      meta.extras = v
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else meta[kv[1]] = v;
  }
  if (!meta.title) warnings.push("Front matter has no title.");
  return { meta, body: text.slice(m[0].length), warnings };
}

const OPEN_RE = /^:::(\w[\w-]*)\s*(.*)$/;

export function tokenize(body: string, warnings: string[] = []): Node[] {
  const lines = body.split("\n");
  const root: Node[] = [];
  type Frame = { node: Extract<Node, { type: "box" }>; start: number };
  const stack: Frame[] = [];
  let buf: string[] = [];

  const target = () => (stack.length ? stack[stack.length - 1].node.children : root);
  const flush = () => {
    if (buf.length && buf.join("").trim()) target().push({ type: "md", text: buf.join("\n") });
    buf = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^(\s*)(```+)\s*([\w-]*)\s*$/);
    if (fence) {
      flush();
      const ticks = fence[2];
      const lang = fence[3].toLowerCase();
      const code: string[] = [];
      let closed = false;
      for (i = i + 1; i < lines.length; i++) {
        if (
          lines[i].trim() === ticks ||
          (lines[i].trim().startsWith(ticks) && !lines[i].trim().slice(ticks.length).trim())
        ) {
          closed = true;
          break;
        }
        code.push(lines[i]);
      }
      if (!closed) warnings.push(`Unclosed \`\`\`${lang} block.`);
      target().push({ type: "fence", lang, code: code.join("\n"), unclosed: !closed });
      continue;
    }
    const t = line.trim();
    if (t === ":::") {
      flush();
      if (!stack.length) {
        warnings.push(`Stray ::: closer on line ${i + 1}.`);
        continue;
      }
      stack.pop();
      continue;
    }
    const open = t.match(OPEN_RE);
    if (open) {
      flush();
      const kind = open[1].toLowerCase();
      let rest = open[2] || "";
      const attrs: Record<string, string> = {};
      rest = rest.replace(/\[(\w+):([\w-]+)\]/g, (_, k, v) => ((attrs[k] = v), ""));
      rest = rest.replace(/(?:^|\s)tag:(\w+)/g, (_, v) => ((attrs.tag = v), ""));
      const node: Extract<Node, { type: "box" }> = {
        type: "box",
        kind,
        title: rest.trim(),
        attrs,
        children: [],
        raw: line,
        unknown: !(BOX_KINDS as readonly string[]).includes(kind),
      };
      if (node.unknown) warnings.push(`Unknown box kind ":::${kind}".`);
      if (stack.length >= 2)
        warnings.push(`:::${kind} nested deeper than 2 levels (line ${i + 1}).`);
      target().push(node);
      stack.push({ node, start: i });
      continue;
    }
    buf.push(line);
  }
  flush();
  for (const f of stack) {
    f.node.unclosed = true;
    warnings.push(`:::${f.node.kind} opened on line ${f.start + 1} is never closed.`);
  }
  return root;
}

export function parseSheet(src: string): Sheet {
  const { meta, body, warnings } = parseFrontMatter(src);
  const nodes = tokenize(body, warnings);
  walk(nodes, (n) => {
    if (
      n.type === "fence" &&
      (n.lang === "quiz" || n.lang === "flashcards") &&
      !meta.extras.includes(n.lang)
    ) {
      warnings.push(
        `Dialect contract: a ${n.lang} block is present but front-matter extras does not declare "${n.lang}".`,
      );
    }
    if (
      n.type === "fence" &&
      n.lang &&
      !(EMBED_LANGS as readonly string[]).includes(n.lang) &&
      !isCodeLang(n.lang)
    ) {
      // regular code fences are fine; nothing to warn
    }
  });
  return { meta, nodes, warnings };
}

// Code fences in common languages render as code, not as unknown embeds.
const CODE_LANGS = new Set([
  "c",
  "cpp",
  "java",
  "python",
  "py",
  "js",
  "ts",
  "javascript",
  "typescript",
  "bash",
  "sh",
  "shell",
  "sql",
  "json",
  "yaml",
  "text",
  "txt",
  "pascal",
  "asm",
  "html",
  "css",
  "go",
  "rust",
  "matlab",
  "r",
  "algo",
  "pseudo",
  "makefile",
  "",
]);
export function isCodeLang(l: string) {
  return CODE_LANGS.has(l);
}

export function walk(nodes: Node[], fn: (n: Node) => void) {
  for (const n of nodes) {
    fn(n);
    if (n.type === "box") walk(n.children, fn);
  }
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\$[^$]*\$/g, "")
      .replace(/[^\w\u0600-\u06ff]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

export function headings(nodes: Node[]): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  const seen = new Map<string, number>();
  for (const n of nodes) {
    if (n.type !== "md") continue;
    for (const line of n.text.split("\n")) {
      const h = line.match(/^##\s+(.+?)\s*#*$/);
      if (h) out.push({ id: uniqueId(h[1], seen), text: h[1] });
    }
  }
  return out;
}
export function uniqueId(text: string, seen: Map<string, number>) {
  const base = slugify(text);
  const c = seen.get(base) ?? 0;
  seen.set(base, c + 1);
  return c ? `${base}-${c}` : base;
}

/* ---------- quiz ---------- */
export type QuizQ = {
  n: number;
  question: string;
  options: { letter: string; text: string }[];
  answer: string; // raw text after !
  letters: string[] | null; // MCQ answer letters
  explanation: string;
};

export function parseQuiz(code: string): { questions: QuizQ[]; warnings: string[] } {
  const warnings: string[] = [];
  const qs: QuizQ[] = [];
  let cur: QuizQ | null = null;
  for (const raw of code.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const q = raw.match(/^(\d+)\.\s+(.*)$/);
    if (q) {
      cur = { n: +q[1], question: q[2], options: [], answer: "", letters: null, explanation: "" };
      qs.push(cur);
      continue;
    }
    if (!cur) {
      warnings.push(`Quiz line outside a question: "${line}"`);
      continue;
    }
    if (line.startsWith("!")) cur.answer = line.slice(1).trim();
    else if (line.startsWith(">"))
      cur.explanation += (cur.explanation ? " " : "") + line.slice(1).trim();
    else if (/^[a-z]\)\s/.test(line)) {
      const parts = line.split(/\s+(?=[a-z]\)\s)/);
      for (const p of parts) {
        const o = p.match(/^([a-z])\)\s+(.*)$/);
        if (o) cur.options.push({ letter: o[1], text: o[2].trim() });
      }
    } else cur.question += " " + line;
  }
  for (const q of qs) {
    if (!q.answer) warnings.push(`Quiz question ${q.n} has no "!" answer.`);
    if (q.options.length) {
      const letters = q.answer
        .split(/[|,\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const valid = letters.every((l) => q.options.some((o) => o.letter === l));
      if (valid && letters.length) q.letters = letters;
      else warnings.push(`Quiz question ${q.n}: answer "${q.answer}" doesn't match its options.`);
    }
  }
  return { questions: qs, warnings };
}

export function normalizeAnswer(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?;,:]+$/, "")
    .trim();
}
export function typedMatches(input: string, expected: string) {
  const a = normalizeAnswer(input);
  if (!a) return false;
  const full = normalizeAnswer(expected);
  if (a === full) return true;
  const idx = expected.indexOf(" (");
  return idx > 0 && a === normalizeAnswer(expected.slice(0, idx));
}

/* ---------- flashcards ---------- */
export type Card = { front: string; back: string };
export function parseFlashcards(code: string): { cards: Card[]; warnings: string[] } {
  const cards: Card[] = [];
  const warnings: string[] = [];
  for (const raw of code.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("//")) continue;
    const i = line.indexOf("::");
    if (i < 0) {
      warnings.push(`Flashcard line without "::": "${line}"`);
      continue;
    }
    cards.push({ front: line.slice(0, i).trim(), back: line.slice(i + 2).trim() });
  }
  return { cards, warnings };
}

export const SRS_INTERVALS = [60e3, 600e3, 864e5, 3 * 864e5, 7 * 864e5, 30 * 864e5];
export type CardState = { level: number; due: number };
export function review(state: CardState | undefined, gotIt: boolean, now = Date.now()): CardState {
  if (!gotIt) return { level: 0, due: now + SRS_INTERVALS[0] };
  const level = Math.min((state?.level ?? 0) + 1, SRS_INTERVALS.length);
  return { level, due: now + SRS_INTERVALS[level - 1] };
}

/* ---------- checklist ---------- */
export function parseChecklist(text: string) {
  const items: string[] = [];
  for (const l of text.split("\n")) {
    const m = l.match(/^\s*[-*]\s+\[[ xX]?\]\s+(.*)$/);
    if (m) items.push(m[1]);
  }
  return items;
}

export function sheetSlug(meta: Meta) {
  return slugify(`${meta.subject ?? ""} ${meta.title ?? "untitled"}`);
}

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Printer,
  RotateCcw,
  FolderOpen,
  List,
  X,
  Palette,
  Download,
  Upload,
  FileCode,
  Sparkles,
} from "lucide-react";
import {
  headings,
  parseChecklist,
  parseFlashcards,
  parseQuiz,
  parseSheet,
  sheetSlug,
  walk,
  type Node,
  type Sheet,
} from "@/dialect/parse";
import { renderMd, renderInline } from "@/dialect/markdown";
import { Embed } from "@/embeds/Embed";
import { Quiz } from "@/modules/Quiz";
import { Flashcards } from "@/modules/Flashcards";
import { ChecklistItems } from "@/modules/Checklist";
import { clearPrefix, readJSON, useStoreTick } from "@/lib/store";
import type { CardState } from "@/dialect/parse";
import { WarnChip } from "./WarnChip";
import { SkinPicker, useSkin } from "./skins";
import { SkillsHubModal } from "./SkillsHubModal";

const BOX_LABEL: Record<string, string> = {
  definition: "Definition",
  theorem: "Theorem",
  formula: "Formula",
  trap: "Trap",
  warning: "Warning",
  note: "Note",
  mnemonic: "Mnemonic",
  checklist: "Checklist",
  example: "Example",
  compare: "Compare",
  exercise: "Exercise",
  solution: "Solution",
};

const STARTER_RICE_TEMPLATE = `/* ============================================================
   StudySheet Custom Dotfile Theme
   Scope: [data-skin="custom"]
   Mobile tap target: >= 44px | Contrast: >= 4.5:1
   ============================================================ */

[data-skin="custom"] {
  --ss-bg: #0b0f19;
  --ss-fg: #f1f5f9;
  --ss-muted: #94a3b8;
  --ss-panel: #111827;
  --ss-panel-2: #1f2937;
  --ss-line: #374151;
  --ss-accent: #38bdf8;
  --ss-accent-soft: rgba(56, 189, 248, 0.12);
  --ss-ok: #34d399;
  --ss-bad: #f87171;
  --ss-warn: #fbbf24;
  --ss-font: system-ui, -apple-system, sans-serif;
  --ss-radius: 8px;
}

/* Callout Box Overrides */
[data-skin="custom"] .ss-box {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--ss-line);
}
[data-skin="custom"] .ss-box[data-kind="definition"] {
  border-left: 4px solid var(--ss-accent);
}
[data-skin="custom"] .ss-box[data-kind="trap"] {
  border-left: 4px solid var(--ss-bad);
}
`;

type Ctx = {
  seen: Map<string, number>;
  prefix: string;
  counters: { ck: number; quiz: number; fc: number };
  extras: string[];
};

function renderNodes(nodes: Node[], ctx: Ctx, depth = 0): React.ReactNode[] {
  return nodes.map((n, i) => {
    if (n.type === "md")
      return (
        <div
          key={i}
          className="ss-md"
          dangerouslySetInnerHTML={{ __html: renderMd(n.text, ctx.seen) }}
        />
      );
    if (n.type === "fence") {
      if (n.lang === "quiz") {
        const k = ctx.counters.quiz++;
        if (!ctx.extras.includes("quiz")) return <Contract key={i} lang="quiz" code={n.code} />;
        return <Quiz key={i} code={n.code} prefix={`${ctx.prefix}:quiz:${k}`} />;
      }
      if (n.lang === "flashcards") {
        const k = ctx.counters.fc++;
        if (!ctx.extras.includes("flashcards"))
          return <Contract key={i} lang="flashcards" code={n.code} />;
        return <Flashcards key={i} code={n.code} prefix={`${ctx.prefix}:fc:${k}`} />;
      }
      return <Embed key={i} lang={n.lang} code={n.code} unclosed={n.unclosed} />;
    }
    // box
    const label = BOX_LABEL[n.kind] ?? n.kind;
    const dir = n.attrs.dir === "rtl" ? "rtl" : undefined;
    const warn = (
      <>
        {n.unknown && <WarnChip>Unknown box kind “{n.kind}”</WarnChip>}
        {n.unclosed && <WarnChip>Box never closed with :::</WarnChip>}
        {depth >= 2 && <WarnChip>Nested deeper than 2 levels</WarnChip>}
      </>
    );
    if (n.kind === "solution") {
      return (
        <details key={i} className="ss-solution">
          <summary>Solution</summary>
          {warn}
          <div className="ss-box-body">{renderNodes(n.children, ctx, depth + 1)}</div>
        </details>
      );
    }
    let body: React.ReactNode;
    if (n.kind === "checklist") {
      const k = ctx.counters.ck++;
      const text = n.children
        .filter((c) => c.type === "md")
        .map((c) => (c as { text: string }).text)
        .join("\n");
      body = <ChecklistItems items={parseChecklist(text)} prefix={`${ctx.prefix}:ck:${k}`} />;
    } else body = renderNodes(n.children, ctx, depth + 1);
    return (
      <aside key={i} className="ss-box" data-kind={n.unknown ? "unknown" : n.kind} dir={dir}>
        <header className="ss-box-head" dir="ltr">
          <span className="ss-box-kind">{label}</span>
          {n.attrs.tag && (
            <span className="ss-tag" data-tag={n.attrs.tag}>
              {n.attrs.tag}
            </span>
          )}
          {n.title && (
            <span
              className="ss-box-title"
              dangerouslySetInnerHTML={{ __html: renderInline(n.title) }}
            />
          )}
        </header>
        {warn}
        <div className="ss-box-body">{body}</div>
      </aside>
    );
  });
}

function Contract({ lang, code }: { lang: string; code: string }) {
  return (
    <div className={`ss-embed ss-contract ss-contract-${lang}`} data-contract={lang}>
      <WarnChip>
        Dialect contract: this {lang} block isn't declared in front-matter extras, so it isn't
        rendered.
      </WarnChip>
      <pre className="ss-code">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function totals(sheet: Sheet) {
  let quiz = 0,
    cards = 0,
    ck = 0;
  const quizN: number[] = [],
    fcN: number[] = [],
    ckN: number[] = [];
  walk(sheet.nodes, (n) => {
    if (n.type === "fence" && n.lang === "quiz" && sheet.meta.extras.includes("quiz"))
      quizN.push(parseQuiz(n.code).questions.length);
    if (n.type === "fence" && n.lang === "flashcards" && sheet.meta.extras.includes("flashcards"))
      fcN.push(parseFlashcards(n.code).cards.length);
    if (n.type === "box" && n.kind === "checklist") {
      const text = n.children
        .filter((c) => c.type === "md")
        .map((c) => (c as { text: string }).text)
        .join("\n");
      ckN.push(parseChecklist(text).length);
    }
  });
  quiz = quizN.reduce((a, b) => a + b, 0);
  cards = fcN.reduce((a, b) => a + b, 0);
  ck = ckN.reduce((a, b) => a + b, 0);
  return { total: quiz + cards + ck, quizN, fcN, ckN };
}

function useProgress(prefix: string, t: ReturnType<typeof totals>) {
  const tick = useStoreTick();
  return useMemo(() => {
    if (!tick) return 0;
    let done = 0;
    t.quizN.forEach((n, b) => {
      for (let i = 0; i < n; i++) if (readJSON(`${prefix}:quiz:${b}:${i}`, null)) done++;
    });
    t.fcN.forEach((_, b) => {
      const s = readJSON<Record<number, CardState>>(`${prefix}:fc:${b}`, {});
      done += Object.values(s).filter((c) => c.level >= 1).length;
    });
    t.ckN.forEach((n, b) => {
      for (let i = 0; i < n; i++) if (readJSON(`${prefix}:ck:${b}:${i}`, false)) done++;
    });
    return done;
  }, [tick, prefix, t]);
}

function countdown(date?: string) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(+d)) return null;
  const days = Math.ceil((+d - Date.now()) / 864e5);
  return days > 0 ? `Exam in ${days} d` : days === 0 ? "Exam today" : "Exam passed";
}

export function SheetView({ source, onOpenSheet }: { source: string; onOpenSheet?: () => void }) {
  const sheet = useMemo(() => {
    try {
      return parseSheet(source);
    } catch (e) {
      return {
        meta: { extras: [] },
        nodes: [{ type: "md", text: "```\n" + source + "\n```" }],
        warnings: [`Parser crashed: ${(e as Error).message}`],
      } as Sheet;
    }
  }, [source]);
  const { meta } = sheet;
  const prefix = `ss:${sheetSlug(meta)}`;
  const toc = useMemo(() => headings(sheet.nodes), [sheet]);
  const body = useMemo(
    () =>
      renderNodes(sheet.nodes, {
        seen: new Map(),
        prefix,
        counters: { ck: 0, quiz: 0, fc: 0 },
        extras: meta.extras,
      }),
    [sheet, prefix, meta.extras],
  );
  const t = useMemo(() => totals(sheet), [sheet]);
  const done = useProgress(prefix, t);
  const [skin, setSkin] = useSkin();
  const [cd, setCd] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(() => toc[0]?.id ?? "");

  // Custom CSS Rice / Dotfile Studio State
  const [riceModalOpen, setRiceModalOpen] = useState(false);
  const [customCss, setCustomCss] = useState<string>("");
  const cssFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ss:custom-skin-css");
      if (saved) setCustomCss(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const handleCustomCssChange = (newCss: string) => {
    setCustomCss(newCss);
    try {
      localStorage.setItem("ss:custom-skin-css", newCss);
    } catch {
      /* quota */
    }
  };

  const handleCssFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === "string") {
        handleCustomCssChange(content);
        setSkin("custom");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const exportCss = () => {
    const blob = new Blob([customCss || STARTER_RICE_TEMPLATE], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "studysheet-theme.css";
    a.click();
    URL.revokeObjectURL(url);
  };

  // AI Skills & Prompts Hub State
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [skillsModalTab, setSkillsModalTab] = useState<"author" | "rice">("author");

  useEffect(() => setCd(countdown(meta["exam-date"])), [meta]);

  useEffect(() => {
    if (toc.length === 0) return;

    let ticking = false;
    const updateActive = () => {
      ticking = false;
      const isAtBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
      if (isAtBottom && toc.length > 0) {
        const last = toc[toc.length - 1];
        if (last) setActiveId(last.id);
        return;
      }

      const headingEls = toc
        .map((h) => document.getElementById(h.id))
        .filter(Boolean) as HTMLElement[];

      let currentId = toc[0]?.id ?? "";
      for (const el of headingEls) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) {
          currentId = el.id;
        } else {
          break;
        }
      }
      setActiveId(currentId);
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateActive);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateActive();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [toc, body]);

  const rtlDoc = meta.lang === "ar";
  const chips = [
    meta.subject,
    meta.difficulty,
    meta["est-time"] && `${meta["est-time"]}`,
    meta.mode && `mode: ${meta.mode}`,
    meta.lang && meta.lang.toUpperCase(),
  ].filter(Boolean) as string[];

  return (
    <div className="ss-app" data-skin={skin}>
      {skin === "custom" && customCss && (
        <style id="ss-custom-skin-style" dangerouslySetInnerHTML={{ __html: customCss }} />
      )}
      <div className="ss-topbar">
        {onOpenSheet ? (
          <button
            type="button"
            className="ss-icon-btn"
            onClick={onOpenSheet}
            aria-label="Open or switch sheet"
            title="Open or import study sheet"
          >
            <FolderOpen size={18} />
          </button>
        ) : (
          <Link to="/" className="ss-icon-btn" aria-label="Back to library">
            <ArrowLeft size={18} />
          </Link>
        )}
        <span className="ss-topbar-title">{meta.title ?? "Untitled sheet"}</span>
        {t.total > 0 && (
          <span
            className="ss-pill"
            data-testid="progress"
            title="Quiz answered + cards settled + checklist done"
          >
            <span
              className="ss-pill-bar"
              style={{ ["--p" as string]: `${(done / t.total) * 100}%` }}
            />
            {done}/{t.total}
          </span>
        )}
        <div className="ss-topbar-spacer" />
        {toc.length > 0 && (
          <button
            type="button"
            className="ss-icon-btn ss-toc-toggle"
            onClick={() => setTocOpen(!tocOpen)}
            aria-label="Toggle contents"
            title="Toggle contents"
          >
            {tocOpen ? <X size={18} /> : <List size={18} />}
          </button>
        )}
        <SkinPicker
          value={skin}
          onChange={(s) => {
            setSkin(s);
            if (s === "custom" && !customCss.trim()) {
              handleCustomCssChange(STARTER_RICE_TEMPLATE);
              setRiceModalOpen(true);
            }
          }}
        />
        <button
          type="button"
          className={`ss-icon-btn ${skin === "custom" ? "active" : ""}`}
          onClick={() => setRiceModalOpen(true)}
          title="Theme Studio / Rice UI (Custom CSS)"
          aria-label="Theme Studio"
        >
          <Palette size={18} />
        </button>
        <button
          type="button"
          className="ss-icon-btn"
          onClick={() => {
            setSkillsModalTab("author");
            setSkillsModalOpen(true);
          }}
          title="AI Skills & Prompts (Generate Sheets or Themes)"
          aria-label="AI Skills & Prompts"
        >
          <Sparkles size={18} />
        </button>
        <button
          type="button"
          className="ss-icon-btn"
          onClick={() => window.print()}
          aria-label="Print"
        >
          <Printer size={18} />
        </button>
        <button
          type="button"
          className="ss-icon-btn"
          onClick={() => confirm("Reset all progress for this sheet?") && clearPrefix(prefix + ":")}
          aria-label="Reset progress"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="ss-layout">
        {toc.length > 0 && (
          <nav className={`ss-toc ${tocOpen ? "is-open" : ""}`} aria-label="Contents">
            <p className="ss-toc-head">Contents</p>
            <ol>
              {toc.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    className={activeId === h.id ? "is-active" : undefined}
                    aria-current={activeId === h.id ? "true" : undefined}
                    onClick={() => {
                      setActiveId(h.id);
                      setTocOpen(false);
                    }}
                    dangerouslySetInnerHTML={{ __html: renderInline(h.text) }}
                  />
                </li>
              ))}
            </ol>
          </nav>
        )}
        <article
          className="ss-sheet"
          dir={rtlDoc ? "rtl" : undefined}
          lang={meta.lang && meta.lang !== "mixed" ? meta.lang : undefined}
        >
          <header className="ss-hero">
            {meta.course && <p className="ss-course">{meta.course}</p>}
            <h1>{meta.title ?? "Untitled sheet"}</h1>
            <div className="ss-chips">
              {chips.map((c) => (
                <span
                  key={c}
                  className="ss-chip"
                  data-chip={c === meta.difficulty ? "difficulty" : undefined}
                >
                  {c}
                </span>
              ))}
              {cd && <span className="ss-chip exam">{cd}</span>}
            </div>
          </header>
          {sheet.warnings.length > 0 && (
            <div className="ss-banner" role="alert">
              <strong>
                {sheet.warnings.length} dialect warning{sheet.warnings.length > 1 ? "s" : ""}
              </strong>
              <ul>
                {sheet.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {body.map((b, i) => (
            <Fragment key={i}>{b}</Fragment>
          ))}
        </article>
      </div>

      {riceModalOpen && (
        <div
          className="ss-modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setRiceModalOpen(false)}
        >
          <div className="ss-modal" style={{ maxWidth: 640 }} role="dialog" aria-modal="true">
            <div className="ss-modal-head">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Palette size={20} style={{ color: "var(--ss-accent)" }} />
                <h2>Theme Studio (Rice Dotfile)</h2>
              </div>
              <button
                type="button"
                className="ss-icon-btn"
                onClick={() => setRiceModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ss-modal-body">
              <p style={{ margin: 0, fontSize: 13, color: "var(--ss-muted)" }}>
                Drop in or paste custom CSS (dotfiles) to completely rice StudySheet. Scoped under{" "}
                <code>[data-skin="custom"]</code>.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <input
                  ref={cssFileInputRef}
                  type="file"
                  accept=".css,text/css"
                  style={{ display: "none" }}
                  onChange={handleCssFileUpload}
                />
                <button
                  type="button"
                  className="ss-btn"
                  onClick={() => cssFileInputRef.current?.click()}
                  title="Import a .css dotfile from your device"
                >
                  <Upload size={14} /> Import .css
                </button>
                <button
                  type="button"
                  className="ss-btn ghost"
                  onClick={exportCss}
                  title="Download your custom CSS file"
                >
                  <Download size={14} /> Export .css
                </button>
                <button
                  type="button"
                  className="ss-btn ghost"
                  onClick={() => {
                    handleCustomCssChange(STARTER_RICE_TEMPLATE);
                    setSkin("custom");
                  }}
                  title="Reset to starter dotfile template"
                >
                  <FileCode size={14} /> Load Template
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "var(--ss-radius)",
                  background: "var(--ss-panel-2)",
                  border: "1px dashed var(--ss-line)",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--ss-muted)" }}>
                  Need AI (Claude / ChatGPT) to design a theme for you?
                </span>
                <button
                  type="button"
                  className="ss-btn ghost"
                  style={{ fontSize: 11.5, padding: "3px 8px" }}
                  onClick={() => {
                    setRiceModalOpen(false);
                    setSkillsModalTab("rice");
                    setSkillsModalOpen(true);
                  }}
                >
                  <Sparkles size={13} /> Copy AI Ricing Prompt ⏵
                </button>
              </div>

              <textarea
                value={customCss}
                onChange={(e) => {
                  handleCustomCssChange(e.target.value);
                  if (skin !== "custom") setSkin("custom");
                }}
                placeholder="/* Paste or write your custom CSS dotfile here... */"
                rows={12}
                style={{
                  width: "100%",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  padding: "12px 14px",
                  borderRadius: "var(--ss-radius)",
                  border: "1px solid var(--ss-line)",
                  background: "var(--ss-panel-2)",
                  color: "var(--ss-fg)",
                  resize: "vertical",
                  outline: "none",
                }}
                spellCheck={false}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--ss-muted)" }}>
                  {skin === "custom"
                    ? "🟢 Live in view"
                    : "Switch skin dropdown to 'Custom Rice' to view"}
                </span>
                <button
                  type="button"
                  className="ss-btn primary"
                  onClick={() => {
                    setSkin("custom");
                    setRiceModalOpen(false);
                  }}
                >
                  Apply & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SkillsHubModal
        isOpen={skillsModalOpen}
        onClose={() => setSkillsModalOpen(false)}
        initialTab={skillsModalTab}
        onOpenThemeStudio={() => {
          setSkillsModalOpen(false);
          setRiceModalOpen(true);
        }}
      />
    </div>
  );
}

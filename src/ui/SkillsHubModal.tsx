import { useState } from "react";
import { X, Sparkles, Copy, Check, Download, BookOpen, Palette, ExternalLink } from "lucide-react";
import {
  DOMAINS,
  type DomainId,
  buildAuthoringPrompt,
  buildRicingPrompt,
  SKILL_MD,
  SKIN_MD,
} from "@/skills/all-skills";

export function SkillsHubModal({
  isOpen,
  onClose,
  initialTab = "author",
  onOpenThemeStudio,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "author" | "rice";
  onOpenThemeStudio?: () => void;
}) {
  const [tab, setTab] = useState<"author" | "rice">(initialTab);

  // Authoring tab state
  const [domainId, setDomainId] = useState<DomainId>("cs");
  const [courseTopic, setCourseTopic] = useState("");
  const [mode, setMode] = useState<"both" | "cheat" | "guide">("both");
  const [includeQuiz, setIncludeQuiz] = useState(true);
  const [includeCards, setIncludeCards] = useState(true);
  const [copiedAuthor, setCopiedAuthor] = useState(false);

  // Ricing tab state
  const [themeIdea, setThemeIdea] = useState("");
  const [copiedRice, setCopiedRice] = useState(false);

  if (!isOpen) return null;

  const currentAuthorPrompt = buildAuthoringPrompt({
    domainId,
    courseTopic: courseTopic.trim() || undefined,
    mode: mode === "both" ? "both" : mode === "cheat" ? "cheat" : "guide",
    includeQuiz,
    includeCards,
  });

  const currentRicePrompt = buildRicingPrompt(themeIdea.trim() || undefined);

  const copyToClipboard = async (text: string, type: "author" | "rice") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "author") {
        setCopiedAuthor(true);
        setTimeout(() => setCopiedAuthor(false), 2500);
      } else {
        setCopiedRice(true);
        setTimeout(() => setCopiedRice(false), 2500);
      }
    } catch {
      /* clipboard denied */
    }
  };

  const downloadPrompt = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="ss-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="ss-modal" style={{ maxWidth: 680 }}>
        {/* Modal Header */}
        <div className="ss-modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={20} style={{ color: "var(--ss-accent)" }} />
            <h2>AI Skills & Prompt Hub</h2>
          </div>
          <button type="button" className="ss-icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--ss-line)",
            background: "var(--ss-panel-2)",
            padding: "4px 8px 0",
            gap: 4,
          }}
        >
          <button
            type="button"
            className="ss-btn ghost"
            style={{
              borderRadius: "var(--ss-radius) var(--ss-radius) 0 0",
              borderBottom:
                tab === "author" ? "2px solid var(--ss-accent)" : "2px solid transparent",
              fontWeight: tab === "author" ? 700 : 500,
              color: tab === "author" ? "var(--ss-accent)" : "var(--ss-muted)",
              background: tab === "author" ? "var(--ss-panel)" : "transparent",
            }}
            onClick={() => setTab("author")}
          >
            <BookOpen size={15} /> 1. Author Study Sheet (.md)
          </button>
          <button
            type="button"
            className="ss-btn ghost"
            style={{
              borderRadius: "var(--ss-radius) var(--ss-radius) 0 0",
              borderBottom: tab === "rice" ? "2px solid var(--ss-accent)" : "2px solid transparent",
              fontWeight: tab === "rice" ? 700 : 500,
              color: tab === "rice" ? "var(--ss-accent)" : "var(--ss-muted)",
              background: tab === "rice" ? "var(--ss-panel)" : "transparent",
            }}
            onClick={() => setTab("rice")}
          >
            <Palette size={15} /> 2. Rice Custom Theme (.css)
          </button>
        </div>

        {/* Modal Body */}
        <div className="ss-modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
          {tab === "author" ? (
            /* TAB 1: AUTHOR STUDY SHEET */
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ margin: "0 0 12px 0", fontSize: 13.5, color: "var(--ss-muted)" }}>
                  Feed this prompt into <strong>Claude 3.5</strong>, <strong>ChatGPT</strong>, or{" "}
                  <strong>Gemini</strong>. The AI will output an authentic, exam-ready study sheet
                  in StudySheet dialect that you can paste or drop into this app.
                </p>
              </div>

              {/* Form Controls */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 12,
                  background: "var(--ss-panel-2)",
                  padding: 14,
                  borderRadius: "var(--ss-radius)",
                  border: "1px solid var(--ss-line)",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 4,
                      color: "var(--ss-fg)",
                    }}
                  >
                    Academic Discipline
                  </label>
                  <select
                    className="ss-skin"
                    style={{ width: "100%", height: 38 }}
                    value={domainId}
                    onChange={(e) => setDomainId(e.target.value as DomainId)}
                  >
                    {DOMAINS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 4,
                      color: "var(--ss-fg)",
                    }}
                  >
                    Topic / Course Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Operating Systems: Page Tables"
                    value={courseTopic}
                    onChange={(e) => setCourseTopic(e.target.value)}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "6px 10px",
                      borderRadius: "var(--ss-radius)",
                      border: "1px solid var(--ss-line)",
                      background: "var(--ss-panel)",
                      color: "var(--ss-fg)",
                      fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 4,
                      color: "var(--ss-fg)",
                    }}
                  >
                    Sheet Mode
                  </label>
                  <select
                    className="ss-skin"
                    style={{ width: "100%", height: 38 }}
                    value={mode}
                    onChange={(e) => setMode(e.target.value as "both" | "cheat" | "guide")}
                  >
                    <option value="both">Both (Guide + Cheat Layer)</option>
                    <option value="cheat">Cheat Sheet (Dense, fast review)</option>
                    <option value="guide">Study Guide (Full derivations)</option>
                  </select>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ss-fg)" }}>
                    Interactive Modules
                  </label>
                  <div style={{ display: "flex", gap: 14 }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12.5,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={includeQuiz}
                        onChange={(e) => setIncludeQuiz(e.target.checked)}
                      />
                      Quiz (MCQ)
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12.5,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={includeCards}
                        onChange={(e) => setIncludeCards(e.target.checked)}
                      />
                      Flashcards
                    </label>
                  </div>
                </div>
              </div>

              {/* Prompt Output Preview */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ss-muted)" }}>
                    Generated AI Prompt ({currentAuthorPrompt.length.toLocaleString()} characters)
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="ss-btn ghost"
                      style={{ fontSize: 12, padding: "4px 8px" }}
                      onClick={() => downloadPrompt(SKILL_MD, "StudySheet-SKILL.md")}
                      title="Download the raw SKILL.md specification file"
                    >
                      <Download size={13} /> Raw SKILL.md
                    </button>
                    <button
                      type="button"
                      className="ss-btn primary"
                      style={{ fontSize: 12, padding: "4px 10px" }}
                      onClick={() => copyToClipboard(currentAuthorPrompt, "author")}
                    >
                      {copiedAuthor ? (
                        <>
                          <Check size={14} /> Copied Prompt! ✓
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy Prompt for AI
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={currentAuthorPrompt}
                  rows={8}
                  style={{
                    width: "100%",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 11.5,
                    lineHeight: 1.45,
                    padding: "10px 12px",
                    borderRadius: "var(--ss-radius)",
                    border: "1px solid var(--ss-line)",
                    background: "var(--ss-panel-2)",
                    color: "var(--ss-fg)",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          ) : (
            /* TAB 2: RICE CUSTOM THEME */
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ margin: "0 0 12px 0", fontSize: 13.5, color: "var(--ss-muted)" }}>
                  Want a custom aesthetic? Give this prompt to <strong>Claude</strong> or{" "}
                  <strong>ChatGPT</strong>. It instructs the AI using the <strong>SKIN.md</strong>{" "}
                  design contract to generate a single-file CSS dotfile that you can import directly
                  into StudySheet.
                </p>
              </div>

              {/* Theme Idea Input */}
              <div
                style={{
                  background: "var(--ss-panel-2)",
                  padding: 14,
                  borderRadius: "var(--ss-radius)",
                  border: "1px solid var(--ss-line)",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 6,
                    color: "var(--ss-fg)",
                  }}
                >
                  Desired Theme Aesthetic / Personality
                </label>
                <input
                  type="text"
                  placeholder="e.g. 19th Century Botanical Leather Notebook, Cyberpunk Neon 2077, Nordic Ice Minimalist"
                  value={themeIdea}
                  onChange={(e) => setThemeIdea(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "6px 10px",
                    borderRadius: "var(--ss-radius)",
                    border: "1px solid var(--ss-line)",
                    background: "var(--ss-panel)",
                    color: "var(--ss-fg)",
                    fontSize: 13,
                  }}
                />
              </div>

              {/* Prompt Output Preview */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ss-muted)" }}>
                    Generated Ricing Prompt ({currentRicePrompt.length.toLocaleString()} characters)
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="ss-btn ghost"
                      style={{ fontSize: 12, padding: "4px 8px" }}
                      onClick={() => downloadPrompt(SKIN_MD, "StudySheet-SKIN.md")}
                      title="Download the raw SKIN.md specification file"
                    >
                      <Download size={13} /> Raw SKIN.md
                    </button>
                    <button
                      type="button"
                      className="ss-btn primary"
                      style={{ fontSize: 12, padding: "4px 10px" }}
                      onClick={() => copyToClipboard(currentRicePrompt, "rice")}
                    >
                      {copiedRice ? (
                        <>
                          <Check size={14} /> Copied Prompt! ✓
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy Theme Prompt
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={currentRicePrompt}
                  rows={8}
                  style={{
                    width: "100%",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 11.5,
                    lineHeight: 1.45,
                    padding: "10px 12px",
                    borderRadius: "var(--ss-radius)",
                    border: "1px solid var(--ss-line)",
                    background: "var(--ss-panel-2)",
                    color: "var(--ss-fg)",
                    resize: "vertical",
                  }}
                />
              </div>

              {onOpenThemeStudio && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: "var(--ss-radius)",
                    background: "var(--ss-accent-soft)",
                    border: "1px solid var(--ss-accent)",
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ss-fg)" }}>
                    Ready to paste or test your generated theme CSS?
                  </span>
                  <button
                    type="button"
                    className="ss-btn"
                    onClick={() => {
                      onClose();
                      onOpenThemeStudio();
                    }}
                  >
                    <ExternalLink size={14} /> Open Theme Studio
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

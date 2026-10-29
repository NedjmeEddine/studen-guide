import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { SheetView } from "@/ui/SheetView";
import { DIODES_SHEET_SOURCE, SAMPLE_SHEETS } from "@/examples/all-examples";
import { FileUp, BookOpen, FileText, X, Check, Sparkles } from "lucide-react";
import { SkillsHubModal } from "@/ui/SkillsHubModal";
import { useSkin } from "@/ui/skins";

export const Route = createFileRoute("/")({
  component: Index,
});

const STORAGE_KEY = "ss:active-sheet";

function Index() {
  const [source, setSource] = useState<string>(DIODES_SHEET_SOURCE);

  // Hydrate stored or URL-specified sheet after mount to guarantee clean SSR hydration
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sheetParam = params.get("sheet") || params.get("example");
      if (sheetParam) {
        const found = SAMPLE_SHEETS.find(
          (s) =>
            s.id === sheetParam ||
            s.id.includes(sheetParam) ||
            s.subject.toLowerCase() === sheetParam.toLowerCase(),
        );
        if (found) {
          setSource(found.source);
          return;
        }
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved.trim()) {
        setSource(saved);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  const [skin] = useSkin();
  const [modalOpen, setModalOpen] = useState(false);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync to storage
  const loadSheet = (newSource: string, title?: string) => {
    if (!newSource || !newSource.trim()) return;
    setSource(newSource);
    try {
      localStorage.setItem(STORAGE_KEY, newSource);
    } catch {
      /* quota */
    }
    setModalOpen(false);
    setPasteText("");
    if (title) {
      setNotice(`Loaded: ${title}`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  // Drag-and-drop handling
  useEffect(() => {
    let counter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      counter++;
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      counter--;
      if (counter <= 0) {
        setIsDragging(false);
        counter = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      counter = 0;
      setIsDragging(false);
      const file = e.dataTransfer?.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            loadSheet(reader.result, file.name);
          }
        };
        reader.readAsText(file);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          loadSheet(reader.result, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="ss-app" data-skin={skin}>
      <SheetView source={source} onOpenSheet={() => setModalOpen(true)} />

      {/* Global Drag-and-Drop Overlay */}
      {isDragging && (
        <div className="ss-drop on">
          <div className="ss-drop-msg">
            <FileUp size={44} style={{ margin: "0 auto 12px", display: "block" }} />
            Drop .md study sheet here
          </div>
        </div>
      )}

      {/* Notice notification */}
      {notice && (
        <div className="ss-toast">
          <Check size={16} /> {notice}
        </div>
      )}

      {/* Sheet Intake Modal */}
      {modalOpen && (
        <div className="ss-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="ss-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="ss-modal-head">
              <h2>Open or Switch StudySheet</h2>
              <button
                type="button"
                className="ss-icon-btn"
                onClick={() => setModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ss-modal-body">
              <section className="ss-modal-section">
                <h3>Sample Subject Sheets</h3>
                <div className="ss-modal-grid">
                  {SAMPLE_SHEETS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="ss-modal-card"
                      onClick={() => loadSheet(s.source, s.title)}
                    >
                      <BookOpen size={20} className="ss-modal-icon" />
                      <div>
                        <strong>{s.title}</strong>
                        <p>{s.course}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 12,
                    padding: "10px 14px",
                    borderRadius: "var(--ss-radius)",
                    background: "var(--ss-panel-2)",
                    border: "1px dashed var(--ss-line)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 13, color: "var(--ss-muted)" }}>
                    Don't see your course? <strong>Generate a custom StudySheet with AI</strong>
                  </span>
                  <button
                    type="button"
                    className="ss-btn"
                    style={{ fontSize: 12, padding: "5px 12px" }}
                    onClick={() => {
                      setModalOpen(false);
                      setSkillsModalOpen(true);
                    }}
                  >
                    <Sparkles size={14} /> Open AI Prompt Hub ⏵
                  </button>
                </div>
              </section>

              <section className="ss-modal-section">
                <h3>Upload Markdown File</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.markdown,text/markdown,text/plain"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="ss-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp size={20} />
                  <span>Choose a .md file or drop it anywhere on the page</span>
                </button>
              </section>

              <section className="ss-modal-section">
                <h3>Paste Markdown</h3>
                <textarea
                  className="ss-paste-area"
                  rows={6}
                  placeholder="Paste your AI-authored StudySheet Markdown here (starts with --- front-matter)..."
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
                <button
                  type="button"
                  className="ss-btn-primary"
                  disabled={!pasteText.trim()}
                  onClick={() => loadSheet(pasteText, "Pasted sheet")}
                >
                  <FileText size={16} /> Render Sheet
                </button>
              </section>
            </div>
          </div>
        </div>
      )}

      <SkillsHubModal
        isOpen={skillsModalOpen}
        onClose={() => setSkillsModalOpen(false)}
        initialTab="author"
      />
    </div>
  );
}

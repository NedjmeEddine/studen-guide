import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { parseFlashcards, review, type CardState } from "@/dialect/parse";
import { renderInline } from "@/dialect/markdown";
import { clearPrefix, useStored } from "@/lib/store";
import { WarnChip } from "@/ui/WarnChip";

export function Flashcards({ code, prefix }: { code: string; prefix: string }) {
  const { cards, warnings } = useMemo(() => parseFlashcards(code), [code]);
  const [states, setStates] = useStored<Record<number, CardState>>(prefix, {});
  const [flipped, setFlipped] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const due = cards.map((_, i) => i).filter((i) => !states[i] || states[i].due <= now);
  const [pos, setPos] = useState(0);
  const idx = due.length ? due[pos % due.length] : -1;
  const card = idx >= 0 ? cards[idx] : null;

  const grade = (got: boolean) => {
    if (idx < 0) return;
    setStates({ ...states, [idx]: review(states[idx], got) });
    setNow(Date.now());
    setFlipped(false);
    if (!got) setPos((p) => p + 1);
  };
  const html = (s: string) => ({ __html: renderInline(s) });

  return (
    <section className="ss-fc" data-embed="flashcards" aria-label="Flashcards">
      <header className="ss-mod-head">
        <span className="ss-mod-kicker">Flashcards</span>
        <span className="ss-fc-due" data-testid="fc-due">
          {due.length} due · {cards.length} cards
        </span>
        <button
          type="button"
          className="ss-btn ghost"
          onClick={() => {
            clearPrefix(prefix);
            setNow(Date.now());
          }}
        >
          <RotateCcw size={14} /> Reset
        </button>
      </header>
      {warnings.map((w) => (
        <WarnChip key={w}>{w}</WarnChip>
      ))}
      {card ? (
        <>
          <button
            type="button"
            className="ss-card"
            data-flipped={flipped}
            onClick={() => setFlipped((f) => !f)}
            aria-label="Flip card"
          >
            <span className="ss-card-inner">
              <span className="ss-card-face front" dangerouslySetInnerHTML={html(card.front)} />
              <span className="ss-card-face back" dangerouslySetInnerHTML={html(card.back)} />
            </span>
          </button>
          <div className="ss-fc-actions">
            <button type="button" className="ss-btn again" onClick={() => grade(false)}>
              Again
            </button>
            <button type="button" className="ss-btn got" onClick={() => grade(true)}>
              Got it
            </button>
          </div>
          <p className="ss-fc-hint">Tap the card to flip.</p>
        </>
      ) : (
        <p className="ss-fc-done">All caught up. Next card due {nextDue(states, cards.length)}.</p>
      )}
    </section>
  );
}

function nextDue(states: Record<number, CardState>, n: number) {
  const ds = Array.from({ length: n }, (_, i) => states[i]?.due ?? 0).filter(Boolean);
  if (!ds.length) return "soon";
  const ms = Math.min(...ds) - Date.now();
  if (ms < 60e3) return "in under a minute";
  if (ms < 36e5) return `in ${Math.round(ms / 6e4)} min`;
  if (ms < 864e5) return `in ${Math.round(ms / 36e5)} h`;
  return `in ${Math.round(ms / 864e5)} d`;
}

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { parseQuiz, typedMatches, type QuizQ } from "@/dialect/parse";
import { renderInline } from "@/dialect/markdown";
import { useStored } from "@/lib/store";
import { WarnChip } from "@/ui/WarnChip";

type Ans = { pick: string[]; text?: string; correct: boolean } | null;

function Question({ q, storeKey }: { q: QuizQ; storeKey: string }) {
  const [ans, setAns] = useStored<Ans>(storeKey, null);
  const [typed, setTyped] = useState("");
  const html = (s: string) => ({ __html: renderInline(s) });
  const mcq = q.options.length > 0;

  const pick = (letter: string) => {
    if (ans || !q.letters) return;
    setAns({ pick: [letter], correct: q.letters.includes(letter) });
  };

  return (
    <li className="ss-q" data-state={ans ? (ans.correct ? "right" : "wrong") : "open"}>
      <p className="ss-q-text" dangerouslySetInnerHTML={html(q.question)} />
      {mcq ? (
        <div className="ss-q-opts">
          {q.options.map((o) => {
            const isAnswer = q.letters?.includes(o.letter);
            const picked = ans?.pick.includes(o.letter);
            const state = !ans ? "" : isAnswer ? "correct" : picked ? "wrong" : "dim";
            return (
              <button
                key={o.letter}
                type="button"
                className="ss-opt"
                data-state={state}
                disabled={!!ans}
                onClick={() => pick(o.letter)}
              >
                <span className="ss-opt-letter">{o.letter}</span>
                <span dangerouslySetInnerHTML={html(o.text)} />
                {state === "correct" && <Check size={16} aria-label="correct" />}
                {state === "wrong" && <X size={16} aria-label="wrong" />}
              </button>
            );
          })}
        </div>
      ) : (
        <form
          className="ss-q-typed"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ans && typed.trim())
              setAns({ pick: [], text: typed, correct: typedMatches(typed, q.answer) });
          }}
        >
          <input
            value={ans?.text ?? typed}
            disabled={!!ans}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type your answer…"
            aria-label={`Answer to question ${q.n}`}
            data-state={ans ? (ans.correct ? "correct" : "wrong") : ""}
          />
          {!ans && (
            <button type="submit" className="ss-btn">
              Check
            </button>
          )}
        </form>
      )}
      {ans && (
        <div className="ss-q-expl">
          <strong>{ans.correct ? "Correct." : "Not quite."}</strong>{" "}
          {!mcq && !ans.correct && (
            <>
              Expected: <span dangerouslySetInnerHTML={html(q.answer)} />.{" "}
            </>
          )}
          {q.explanation && <span dangerouslySetInnerHTML={html(q.explanation)} />}
        </div>
      )}
    </li>
  );
}

export function Quiz({ code, prefix }: { code: string; prefix: string }) {
  const { questions, warnings } = useMemo(() => parseQuiz(code), [code]);
  return (
    <section className="ss-quiz" data-embed="quiz" aria-label="Quiz">
      <header className="ss-mod-head">
        <span className="ss-mod-kicker">Quiz</span>
        <span>{questions.length} questions</span>
      </header>
      {warnings.map((w) => (
        <WarnChip key={w}>{w}</WarnChip>
      ))}
      <ol>
        {questions.map((q, i) => (
          <Question key={i} q={q} storeKey={`${prefix}:${i}`} />
        ))}
      </ol>
    </section>
  );
}

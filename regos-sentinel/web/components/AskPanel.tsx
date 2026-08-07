"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { regosApi } from "../lib/api";
import { plainError, plainPhrase } from "../lib/presentation";
import type { AssistantAnswer } from "../lib/types";
import { Callout } from "./ui";

/**
 * Ask a question, get SEBI's words back — or get told there is no answer here.
 *
 * Styled as a conversation so the exchange reads naturally, but nothing here is
 * generative: every reply is QUOTED (verbatim passage + locator), COMPUTED (from
 * workspace state), or REFUSED. The refusal is an ordinary outcome, not an error —
 * a compliance assistant that cannot say "the source does not cover that" is a
 * liability, and one that says it clearly is doing its job.
 */

/** Topic pills — each maps to a real question the answers engine can take. */
const SUGGESTIONS: Array<{ label: string; question: string }> = [
  { label: "Vulnerability test (VAPT) deadlines", question: "How long do I have to close VAPT findings?" },
  { label: "SEBI patching rules", question: "What does SEBI say about patching?" },
  { label: "What needs my decision", question: "What needs my decision?" },
  { label: "Next deadline", question: "When is my next deadline?" },
];

/**
 * Placeholder examples, cycled so the empty field keeps showing what this box is
 * for. Every one is a question the answers engine actually takes — a placeholder
 * that suggests a question nobody can ask would be a worse lie than a static one.
 */
const PLACEHOLDER_EXAMPLES: string[] = [
  "how long do I have to close VAPT findings?",
  "what does SEBI say about patching?",
  "what needs my decision right now?",
  "when is my next deadline?",
  "is the SEBI source still the copy we reviewed?",
];
const PLACEHOLDER_HOLD_MS = 4200;
const PLACEHOLDER_FADE_MS = 240;

interface ChatTurn {
  id: number;
  question: string;
  answer: AssistantAnswer | null;
  error: string | null;
}

/**
 * What kind of answer this is, said before the answer itself. The kind is the first
 * thing a compliance officer needs: a quotation carries SEBI's authority, a computed
 * line carries only this workspace's own records, and a refusal carries neither.
 * Written out rather than composed from `Tag`, whose label pass would lower-case SEBI.
 */
function AnswerKind({ answer }: { answer: AssistantAnswer }) {
  const meta =
    answer.kind === "QUOTED"
      ? { tone: "accent", glyph: "❝", label: "Quoted from SEBI" }
      : answer.kind === "COMPUTED"
        ? { tone: "accent", glyph: "=", label: "Computed from your workspace" }
        : { tone: "neutral", glyph: "○", label: "No answer in the source" };
  return (
    <p>
      <span className={meta.tone === "neutral" ? "tag" : `tag tag--${meta.tone}`}>
        <span aria-hidden="true">{meta.glyph}</span>
        {meta.label}
      </span>
    </p>
  );
}

function AnswerBody({ answer }: { answer: AssistantAnswer }) {
  if (answer.kind === "REFUSED") {
    return (
      <>
        <AnswerKind answer={answer} />
        <Callout tone="neutral" title="No answer in the source">
          <p>{answer.answer}</p>
          {answer.note && <p className="meta">{plainPhrase(answer.note)}</p>}
        </Callout>
      </>
    );
  }
  if (answer.kind === "COMPUTED") {
    return (
      <>
        <AnswerKind answer={answer} />
        <Callout tone="accent" title="From your own records">
          <p>{answer.answer}</p>
          {answer.note && <p className="meta">{plainPhrase(answer.note)}</p>}
        </Callout>
      </>
    );
  }
  return (
    <>
      <AnswerKind answer={answer} />
      {answer.plain && (
        <Callout tone="accent" title="In plain words">
          <p>{answer.plain}</p>
          <p className="meta">
            An AI restatement of the quotation below. The quotation is the
            authority; this is only easier to read.
          </p>
        </Callout>
      )}
      <figure className="quote">
        <figcaption className="quote-locator quote-locator--split">
          <span>Quoted evidence</span>
          <span>{answer.citations[0]?.locator}</span>
        </figcaption>
        <blockquote className="quote-text">{answer.answer}</blockquote>
        {answer.citations[0] && (
          <p className="quote-source">
            <a
              className="proof-link"
              href={answer.citations[0].source_url}
              target="_blank"
              rel="noreferrer"
            >
              Open the official SEBI document ↗
            </a>
          </p>
        )}
      </figure>
      <p className="meta">{plainPhrase(answer.note)}</p>
    </>
  );
}

export function AskPanel() {
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [asking, setAsking] = useState(false);
  const [example, setExample] = useState(0);
  const [exampleFading, setExampleFading] = useState(false);
  const [composerActive, setComposerActive] = useState(false);
  const nextIdRef = useRef(1);
  const threadRef = useRef<HTMLDivElement | null>(null);

  /**
   * Cycle the placeholder while the field is genuinely idle. It stops the moment
   * the box is focused or holds a draft: text moving under a cursor that is being
   * typed into is the one place this would be an irritation rather than a hint.
   * Under `prefers-reduced-motion` it never starts and the first example stands.
   */
  useEffect(() => {
    if (composerActive || draft) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let fade = 0;
    const cycle = window.setInterval(() => {
      setExampleFading(true);
      fade = window.setTimeout(() => {
        setExample((index) => (index + 1) % PLACEHOLDER_EXAMPLES.length);
        setExampleFading(false);
      }, PLACEHOLDER_FADE_MS);
    }, PLACEHOLDER_HOLD_MS);
    return () => {
      window.clearInterval(cycle);
      window.clearTimeout(fade);
      setExampleFading(false);
    };
  }, [composerActive, draft]);

  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) return;
    thread.scrollTo({
      top: thread.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [turns]);

  const submit = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setAsking(true);
    setDraft("");
    setTurns((prior) => [...prior, { id, question: trimmed, answer: null, error: null }]);
    try {
      const answer = await regosApi.ask(trimmed);
      setTurns((prior) =>
        prior.map((turn) => (turn.id === id ? { ...turn, answer } : turn)),
      );
    } catch (caught) {
      const message = plainError(caught, "That question could not be sent.");
      setTurns((prior) =>
        prior.map((turn) => (turn.id === id ? { ...turn, error: message } : turn)),
      );
    } finally {
      setAsking(false);
    }
  }, []);

  return (
    <div className="chat">
      <div className="chat-intro">
        <h2 className="chat-hero">Ask RegOS</h2>
        <p className="chat-hero-sub">
          Your compliance assistant for SEBI regulations. Type a question below or pick a
          topic — every answer is either quoted from SEBI or worked out from your own
          records, never guessed.
        </p>
      </div>

      <div className="ask-chips">
        {SUGGESTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            className="ask-chip"
            disabled={asking}
            onClick={() => void submit(item.question)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="chat-thread" ref={threadRef} aria-live="polite">
        {turns.length === 0 && (
          <p className="chat-empty meta">
            Pick a topic above or type a question — every reply carries its source or says
            why none exists.
          </p>
        )}

        {turns.map((turn) => (
          <div className="chat-turn" key={turn.id}>
            <p className="chat-bubble chat-bubble--user">{turn.question}</p>
            <div className="chat-row">
              <span className="chat-avatar" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="10" cy="10" r="7.4" />
                  <path d="M2.6 10h14.8M10 2.6c2.2 2 3.2 4.6 3.2 7.4S12.2 15.4 10 17.4c-2.2-2-3.2-4.6-3.2-7.4S7.8 4.6 10 2.6Z" />
                </svg>
              </span>
              <div className="chat-reply">
                {turn.error ? (
                  <Callout tone="fail" title="Could not ask that">{turn.error}</Callout>
                ) : turn.answer ? (
                  <AnswerBody answer={turn.answer} />
                ) : (
                  <p className="chat-pending">
                    <span className="chat-dots" aria-hidden="true"><i /><i /><i /></span>
                    Looking in the reviewed source…
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form
        className="chat-composer-glow"
        onSubmit={(event) => { event.preventDefault(); void submit(draft); }}
      >
        <input
          className={`ask-input${exampleFading ? " ask-input--swapping" : ""}`}
          type="text"
          value={draft}
          placeholder={`e.g., ${PLACEHOLDER_EXAMPLES[example]}`}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={() => setComposerActive(true)}
          onBlur={() => setComposerActive(false)}
          aria-label="Your question"
        />
        <button type="submit" className="chat-ask-btn" disabled={asking || !draft.trim()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {asking ? "Looking…" : "Ask"}
        </button>
      </form>
    </div>
  );
}

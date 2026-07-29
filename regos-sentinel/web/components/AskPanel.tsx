"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { regosApi } from "../lib/api";
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
  { label: "VAPT deadlines", question: "How long do I have to close VAPT findings?" },
  { label: "SEBI patching rules", question: "What does SEBI say about patching?" },
  { label: "What needs me", question: "What needs my decision?" },
  { label: "Next deadline", question: "When is my next deadline?" },
];

interface ChatTurn {
  id: number;
  question: string;
  answer: AssistantAnswer | null;
  error: string | null;
}

function AnswerBody({ answer }: { answer: AssistantAnswer }) {
  if (answer.kind === "REFUSED") {
    return (
      <Callout tone="neutral" title="No answer in the source">
        <p>{answer.answer}</p>
        {answer.note && <p className="meta">{answer.note}</p>}
      </Callout>
    );
  }
  if (answer.kind === "COMPUTED") {
    return (
      <Callout tone="accent" title="From your workspace">
        <p>{answer.answer}</p>
        {answer.note && <p className="meta">{answer.note}</p>}
      </Callout>
    );
  }
  return (
    <>
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
        <figcaption className="quote-locator">
          {answer.citations[0]?.locator}
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
      <p className="meta">{answer.note}</p>
    </>
  );
}

export function AskPanel() {
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [asking, setAsking] = useState(false);
  const nextIdRef = useRef(1);
  const threadRef = useRef<HTMLDivElement | null>(null);

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
      const message =
        caught instanceof Error ? caught.message : "That question could not be sent.";
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
        <h2 className="chat-hero">RegOS Intelligence — AI Compliance Assistant</h2>
        <p className="chat-hero-sub">
          Compliance command centre for a SEBI-regulated stockbroker. Answers are quoted
          or computed — never guessed.
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
          className="ask-input"
          type="text"
          value={draft}
          placeholder="e.g., how long do I have to close VAPT findings?"
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Your question"
        />
        <button type="submit" className="chat-ask-btn" disabled={asking || !draft.trim()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {asking ? "Looking…" : "Search/Ask"}
        </button>
      </form>
    </div>
  );
}

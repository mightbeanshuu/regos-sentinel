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

const SUGGESTIONS = [
  "How long do I have to close VAPT findings?",
  "What needs my decision?",
  "What does SEBI say about patching?",
  "When is my next deadline?",
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
        <p className="sub-title">Ask about your obligations</p>
        <p className="meta">Answers are quoted or computed — never guessed.</p>
      </div>

      <div className="chat-thread" ref={threadRef} aria-live="polite">
        {turns.length === 0 && (
          <div className="chat-empty">
            <p className="meta">
              Try one of these — every reply carries its source or says why none exists.
            </p>
            <div className="ask-chips">
              {SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="ask-chip"
                  disabled={asking}
                  onClick={() => void submit(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn) => (
          <div className="chat-turn" key={turn.id}>
            <p className="chat-bubble chat-bubble--user">{turn.question}</p>
            <div className="chat-reply">
              {turn.error ? (
                <Callout tone="fail" title="Could not ask that">{turn.error}</Callout>
              ) : turn.answer ? (
                <AnswerBody answer={turn.answer} />
              ) : (
                <p className="chat-pending">
                  <span className="spinner" aria-hidden="true" /> Looking in the reviewed
                  source…
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        className="ask-form chat-composer"
        onSubmit={(event) => { event.preventDefault(); void submit(draft); }}
      >
        <input
          className="ask-input"
          type="text"
          value={draft}
          placeholder="e.g. how long do I have to close VAPT findings?"
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Your question"
        />
        <button type="submit" className="btn btn--primary" disabled={asking || !draft.trim()}>
          {asking ? "Looking…" : "Ask"}
        </button>
      </form>
      {turns.length > 0 && (
        <div className="ask-chips">
          {SUGGESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              className="ask-chip"
              disabled={asking}
              onClick={() => void submit(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";

import { regosApi } from "../lib/api";
import type { AssistantAnswer } from "../lib/types";
import { Callout, Panel } from "./ui";

/**
 * Ask a question, get SEBI's words back — or get told there is no answer here.
 *
 * The interesting state is the refusal, so it is styled as an ordinary outcome rather
 * than an error. A compliance assistant that cannot say "the source does not cover
 * that" is a liability, and one that says it clearly is doing its job.
 */

const SUGGESTIONS = [
  "How long do I have to close VAPT findings?",
  "What needs my decision?",
  "What does SEBI say about patching?",
  "When is my next deadline?",
];

export function AskPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAsking(true);
    setError(null);
    setQuestion(trimmed);
    try {
      setAnswer(await regosApi.ask(trimmed));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That question could not be sent.");
    } finally {
      setAsking(false);
    }
  }, []);

  return (
    <Panel
      title="Ask about your obligations"
      description="Answers are quotations from the SEBI documents in this workspace. If there is no wording that answers you, it says so rather than guessing."
    >
      <form
        className="ask-form"
        onSubmit={(event) => { event.preventDefault(); void submit(question); }}
      >
        <input
          className="ask-input"
          type="text"
          value={question}
          placeholder="e.g. how long do I have to close VAPT findings?"
          onChange={(event) => setQuestion(event.target.value)}
          aria-label="Your question"
        />
        <button type="submit" className="btn btn--primary" disabled={asking || !question.trim()}>
          {asking ? "Looking…" : "Ask"}
        </button>
      </form>

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

      {error && <Callout tone="fail" title="Could not ask that">{error}</Callout>}

      {answer && (
        <div className="ask-answer">
          {answer.kind === "REFUSED" ? (
            <Callout tone="neutral" title="No answer in the source">
              <p>{answer.answer}</p>
              {answer.note && <p className="meta">{answer.note}</p>}
            </Callout>
          ) : answer.kind === "COMPUTED" ? (
            <Callout tone="accent" title="From your workspace">
              <p>{answer.answer}</p>
              {answer.note && <p className="meta">{answer.note}</p>}
            </Callout>
          ) : (
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
                    <a href={answer.citations[0].source_url} target="_blank" rel="noreferrer">
                      Open the official SEBI document ↗
                    </a>
                  </p>
                )}
              </figure>
              <p className="meta">{answer.note}</p>
            </>
          )}
        </div>
      )}
    </Panel>
  );
}

"use client";

import { eventLabelOf, formatTimestamp } from "../lib/presentation";
import type { DocumentScore, UploadedDocument, WorkspaceState } from "../lib/types";

/**
 * The intelligence rail.
 *
 * Romer's right column carries a recommended action, a signal summary, a decision
 * log and a pinned blocking bar. The same four slots hold here, with one rule that
 * is not negotiable: **every line is read from live workspace state.** If a value
 * is absent the rail says so in words. A rail that plausibly invents "3 critical
 * blockers" would undo, in one glance, the claim the whole product is built on.
 *
 * It also gives the blocking decision a permanent home. On the old single-column
 * dashboard the one thing waiting on a person scrolled out of sight the moment
 * anyone read past it.
 */

function Bolt() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 2 4.5 13.2h5.8L11 22l8.5-11.2h-5.8L13 2Z" />
    </svg>
  );
}

export function Rail({
  state,
  awaitingUpload = false,
  focusDocument = null,
  focusScore = null,
}: {
  state: WorkspaceState;
  /** True from "Restart demo" until a document is added. See `page.tsx`. */
  awaitingUpload?: boolean;
  /** The uploaded document the reader currently has open, if any. */
  focusDocument?: UploadedDocument | null;
  /** That document's committed-model read, when it has arrived. */
  focusScore?: DocumentScore | null;
}) {
  /* The rail follows the reader. Without this it always described the seeded
     workspace, so someone reading their own 205-page framework — 142 statements
     carrying timing language — saw "1 of 2 deadline statements" in the column
     beside it, under a heading that says WHAT THE SOURCE SAYS, quoting a "1 week"
     duration that appears nowhere in their file. The restart case was already
     fixed for exactly this reason; this is the same fault on the upload path. */
  if (focusDocument) {
    return (
      <DocumentRail document={focusDocument} score={focusScore} events={[...state.audit_events]} />
    );
  }
  return <WorkspaceRail state={state} awaitingUpload={awaitingUpload} />;
}

/** The rail while an uploaded document is open — every line read from that file. */
function DocumentRail({
  document,
  score,
  events: allEvents,
}: {
  document: UploadedDocument;
  score: DocumentScore | null;
  events: WorkspaceState["audit_events"];
}) {
  const waiting = document.scope.passages_needing_review;
  const approved = document.requirements.length;
  const events = allEvents.slice(-3).reverse();

  return (
    <aside className="romer-rail" aria-label="RegOS intelligence">
      <p className="romer-rail-head">
        <Bolt />
        RegOS intelligence
        <span className="romer-status-dot" aria-hidden="true" />
      </p>

      <section className="romer-rail-block">
        <p className="romer-micro">Needs your decision</p>
        <div className="romer-rail-card">
          {waiting > 0 ? (
            <>
              <span className="em-review">
                {waiting} passage{waiting === 1 ? "" : "s"}
              </span>{" "}
              in this document carr{waiting === 1 ? "ies" : "y"} more than one requirement
              strength, so <span className="em-review">a person decides</span> which parts
              create work.
            </>
          ) : approved > 0 ? (
            <>
              Every passage has been settled and{" "}
              <span className="em-info">
                {approved} requirement{approved === 1 ? "" : "s"}
              </span>{" "}
              {approved === 1 ? "was" : "were"} approved by a named person.
            </>
          ) : (
            <>
              Nothing in this document is waiting on a person. No requirement has been
              approved from it yet, so it creates no work.
            </>
          )}
        </div>
      </section>

      <section className="romer-rail-block">
        <p className="romer-micro">What this document says</p>
        <div className="romer-rail-card">
          {score === null ? (
            <>Reading this document&rsquo;s deadline wording&hellip;</>
          ) : score.with_timing_language === 0 ? (
            <>
              None of the {score.passages_normative.toLocaleString()} requirement-shaped
              passages here carries timing language, so no deadline arises from the wording.
            </>
          ) : (
            <>
              <span className="em-info">{score.deadlines_with_trigger}</span> of{" "}
              <span className="em-info">{score.with_timing_language}</span> requirement
              {score.with_timing_language === 1 ? "" : "s"} that state a time also say what
              starts the clock.
              {score.blocked_durations > 0 && (
                <>
                  {" "}
                  <span className="em-review">{score.blocked_durations}</span> give a period
                  only — a period alone cannot produce a date.
                </>
              )}
            </>
          )}
        </div>
      </section>

      <section className="romer-rail-block">
        <p className="romer-micro">Decision log</p>
        {events.length === 0 ? (
          <div className="romer-rail-card">Nothing has been recorded in this session yet.</div>
        ) : (
          <ol className="romer-log">
            {events.map((event) => (
              <li className="romer-log-row" key={event.id}>
                <span className="romer-log-dot" aria-hidden="true" />
                <div>
                  <p className="romer-log-title">{eventLabelOf(event.event_type)}</p>
                  <p className="romer-log-meta">
                    {formatTimestamp(event.created_at)} · {event.actor}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {waiting > 0 ? (
        <p className="romer-blocking">
          <span className="romer-blocking-glyph" aria-hidden="true">!</span>
          <span className="romer-blocking-title">Waiting on you</span>
          <span className="romer-blocking-note">
            {waiting} passage{waiting === 1 ? "" : "s"}
          </span>
        </p>
      ) : null}
    </aside>
  );
}

function WorkspaceRail({
  state,
  awaitingUpload,
}: {
  state: WorkspaceState;
  awaitingUpload: boolean;
}) {
  /* The deadline that cannot be computed — the case this product exists for. */
  const blocked = state.deadline_computations.find((item) => !item.computable);
  const blockedRule = state.obligations
    .map((obligation) => obligation.deadline)
    .find((rule) => rule && !rule.computable);

  /* Statements that give a period, and those that also give a trigger. Only the
     second kind can produce a date, which is the whole argument of the rail. */
  const rules = state.obligations.map((obligation) => obligation.deadline).filter(Boolean);
  const withTrigger = rules.filter((rule) => rule.trigger).length;
  const withoutTrigger = rules.length - withTrigger;

  const events = [...state.audit_events].slice(-3).reverse();

  /* After a restart the rail resets with the rest of the page. It used to keep
     reading the seeded workspace, so the centre column said nothing had been
     reviewed while the rail beside it still named a blocking decision and a
     duration — two panels describing different sessions, side by side. */
  if (awaitingUpload) {
    return (
      <aside className="romer-rail" aria-label="RegOS intelligence">
        <p className="romer-rail-head">
          <Bolt />
          RegOS intelligence
          <span className="romer-status-dot romer-status-dot--idle" aria-hidden="true" />
        </p>
        <section className="romer-rail-block">
          <p className="romer-micro">Waiting for a document</p>
          <div className="romer-rail-card">
            Nothing has been reviewed in this session. Add the SEBI document you want
            checked and the decisions, the deadlines and the log all appear here.
          </div>
        </section>
      </aside>
    );
  }

  return (
    <aside className="romer-rail" aria-label="RegOS intelligence">
      <p className="romer-rail-head">
        <Bolt />
        RegOS intelligence
        <span className="romer-status-dot" aria-hidden="true" />
      </p>

      <section className="romer-rail-block">
        <p className="romer-micro">Needs your decision</p>
        <div className="romer-rail-card">
          {blockedRule ? (
            <>
              The source states{" "}
              <span className="em-review">
                {blockedRule.duration} {blockedRule.unit.toLowerCase()}
              </span>{" "}
              but never says what starts it, so{" "}
              <span className="em-review">no due date can be worked out</span>.
            </>
          ) : blocked ? (
            <>A deadline in this workspace cannot be worked out from the source alone.</>
          ) : (
            <>Nothing is waiting on a person in this workspace.</>
          )}
        </div>
      </section>

      <section className="romer-rail-block">
        <p className="romer-micro">What the source says</p>
        <div className="romer-rail-card">
          {rules.length === 0 ? (
            <>No deadline statement has been read from the source yet.</>
          ) : (
            <>
              <span className="em-info">{withTrigger}</span> of{" "}
              <span className="em-info">{rules.length}</span> deadline statement
              {rules.length === 1 ? "" : "s"} give both a period and a trigger.
              {withoutTrigger > 0 && (
                <>
                  {" "}
                  The other {withoutTrigger}{" "}
                  {withoutTrigger === 1 ? "gives" : "give"} a period only — a period
                  alone cannot produce a date.
                </>
              )}
            </>
          )}
        </div>
      </section>

      <section className="romer-rail-block">
        <p className="romer-micro">Decision log</p>
        {events.length === 0 ? (
          <div className="romer-rail-card">Nothing has been recorded in this session yet.</div>
        ) : (
          <ol className="romer-log">
            {events.map((event) => (
              <li className="romer-log-row" key={event.id}>
                <span className="romer-log-dot" aria-hidden="true" />
                <div>
                  <p className="romer-log-title">{eventLabelOf(event.event_type)}</p>
                  <p className="romer-log-meta">
                    {formatTimestamp(event.created_at)} · {event.actor}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Pinned last so the one thing waiting on a person cannot scroll away. */}
      {blockedRule || blocked ? (
        <p className="romer-blocking">
          <span className="romer-blocking-glyph" aria-hidden="true">!</span>
          <span className="romer-blocking-title">Blocking decision</span>
          <span className="romer-blocking-note">No due date</span>
        </p>
      ) : null}
    </aside>
  );
}

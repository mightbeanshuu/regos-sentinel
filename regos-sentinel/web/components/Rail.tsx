"use client";

import { eventLabelOf, formatTimestamp } from "../lib/presentation";
import type { WorkspaceState } from "../lib/types";

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

export function Rail({ state }: { state: WorkspaceState }) {
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

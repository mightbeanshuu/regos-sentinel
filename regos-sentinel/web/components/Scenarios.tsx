"use client";

import { useMemo } from "react";

import {
  changeKindOf,
  formatTimestamp,
  labelOf,
  legalStateOf,
  plainPhrase,
} from "../lib/presentation";
import type {
  ApplicabilityDecision,
  ScenarioCatalogue,
  ScenarioDefinition,
  ScenarioId,
  ScenarioOutcome,
  SourceChange,
} from "../lib/types";
import {
  Callout,
  CompareCols,
  DataRow,
  Disclosure,
  Hash,
  Panel,
  Quote,
  SegBar,
  Stat,
  StateLabel,
  Tag,
} from "./ui";

/* ---------------------------------------------------------------------------
 * The selector. Small on purpose — Case A is the presentation path, and the
 * other three are there to prove the same workflow holds elsewhere.
 * ------------------------------------------------------------------------- */

const CASE_TONE: Record<string, string> = { A: "royal", B: "ok", C: "royal", D: "review" };

export function ScenarioSelector({
  catalogue,
  active,
  onSelect,
}: {
  catalogue: ScenarioCatalogue;
  active: ScenarioId;
  onSelect: (id: ScenarioId) => void;
}) {
  const selected = catalogue.scenarios.find((item) => item.id === active) ?? catalogue.scenarios[0];
  const outcomeFor = (id: ScenarioId) =>
    catalogue.outcomes?.find((item) => item.scenario_id === id) ?? null;
  const outcome = outcomeFor(active);
  const matched = outcome?.status === "SCENARIO_DEMONSTRATED";

  return (
    <section className="cp" aria-label="Demonstration cases">
      <p className="micro">Four questions a regulator would ask — each one runs live, here and now.</p>
      <div className="cp-grid" role="tablist" aria-label="Choose a case">
        {catalogue.scenarios.map((scenario) => {
          const on = scenario.id === active;
          const run = outcomeFor(scenario.id);
          const tone = CASE_TONE[scenario.label] ?? "royal";
          return (
            <button
              key={scenario.id}
              type="button"
              role="tab"
              aria-selected={on}
              className={`cp-card cp-card--${tone}${on ? " cp-card--on" : ""}`}
              onClick={() => onSelect(scenario.id)}
            >
              <span className={`cp-badge cp-badge--${tone}`} aria-hidden="true">{scenario.label}</span>
              <span className="cp-title">{scenario.title}</span>
              <span className="cp-q">{scenario.question}</span>
              {/* A corner ribbon rotated this label into nine unreadable lines.
                  It is an ordinary chip in the card's meta area instead. */}
              {scenario.label === "D" && (
                <span className="cp-chip" style={{ marginTop: 0 }}>
                  Real SEBI advisory · May 2026
                </span>
              )}
              <span className={`cp-chip${run ? (run.status === "SCENARIO_DEMONSTRATED" ? " cp-chip--ok" : " cp-chip--diff") : ""}`}>
                {run
                  ? run.status === "SCENARIO_DEMONSTRATED"
                    ? "Ran · matched what we predicted"
                    : "Ran · differed from what we predicted"
                  : "Not run yet"}
              </span>
              {on && <span className="cp-underline" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {/* Written-before beside what-happened, on matched rows: the citation the
          case names, then the outcome it predicted. The verdict is the run's
          own, never computed here. */}
      <div className="cp-band">
        <div className="cp-band-col">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col" />
                  <th scope="col">Written before the run</th>
                  <th scope="col">What actually happened</th>
                  <th scope="col">Same?</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Source cited</th>
                  <td>
                    <span style={{ fontFamily: "var(--serif)" }}>
                      &ldquo;{selected.citation_quote}&rdquo;
                    </span>
                    <span className="meta"> · {selected.citation_locator}</span>
                  </td>
                  <td className="meta">
                    {outcome
                      ? outcome.citations.length > 0
                        ? [...new Set(outcome.citations.map((item) => item.locator))].join(" · ")
                        : "The run cited no passage."
                      : "Not run yet."}
                  </td>
                  <td rowSpan={2}>
                    <span className={`cp-eq${outcome ? (matched ? " cp-eq--ok" : " cp-eq--diff") : ""}`}>
                      <span className="cp-eq-sign" aria-hidden="true">
                        {outcome ? (matched ? "=" : "≠") : "→"}
                      </span>
                      <span className="cp-eq-word">
                        {outcome
                          ? matched
                            ? "The run matched the prediction written beforehand"
                            : "The run differed — shown, not hidden"
                          : "Run it and compare"}
                      </span>
                    </span>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Outcome</th>
                  <td className="meta">{selected.expected_outcome}</td>
                  <td className="meta">
                    {/* The run's own headline, not the first two check answers:
                        an answer without its question ("9") says nothing. Every
                        question and answer is in the checks table below. */}
                    {outcome ? (
                      <span className="cp-band-line">
                        <span
                          className={matched ? "cp-mark cp-mark--ok" : "cp-mark cp-mark--diff"}
                          aria-hidden="true"
                        >
                          {matched ? "✓" : "!"}
                        </span>
                        <span>{outcome.headline}</span>
                      </span>
                    ) : (
                      <>Not run yet. Press &ldquo;Open this case&rdquo; to run it and compare.</>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="cp-receipt">
            <span className="mono">{selected.automated_test}</span> · re-run automatically
            every time RegOS is rebuilt
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary cp-open"
          onClick={() => {
            onSelect(active);
            document.querySelector("#scenario-case, .jr-sidenav")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          Open this case
        </button>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * The five parts every case carries. Shown before the case runs, so the
 * expected outcome is on screen before the observed one exists.
 * ------------------------------------------------------------------------- */

export function ScenarioBrief({ scenario }: { scenario: ScenarioDefinition }) {
  return (
    <Panel
      title={`Case ${scenario.label} · ${scenario.title}`}
      description={scenario.question}
      aside={
        <span className="cp-chip cp-chip--ok" style={{ marginTop: 0 }}>
          ✓ Re-checked automatically
        </span>
      }
    >
      <dl className="datalist">
        <DataRow label="Source">
          <span className="meta mono">{scenario.citation_locator}</span>
          <p style={{ fontFamily: "var(--serif)", marginTop: "4px" }}>
            &ldquo;{scenario.citation_quote}&rdquo;
          </p>
        </DataRow>
        <DataRow label="Expected outcome">{scenario.expected_outcome}</DataRow>
        <DataRow label="Facts used in this case">
          <span className="meta">{plainPhrase(scenario.seeded_data)}</span>
        </DataRow>
        <DataRow label="The test that re-runs this case">
          <span className="meta mono">{scenario.automated_test}</span>
          <p className="meta">
            It runs every time RegOS is rebuilt, so the result on this page cannot quietly
            drift.
          </p>
        </DataRow>
        <DataRow label="Reset">
          <span className="meta">{plainPhrase(scenario.reset_note)}</span>
        </DataRow>
      </dl>
    </Panel>
  );
}

/* ---------------------------------------------------------------------------
 * Expected beside observed. A case that cannot be wrong is not evidence, so
 * both columns are always rendered, never just the happy one.
 * ------------------------------------------------------------------------- */

function ChecksTable({ outcome }: { outcome: ScenarioOutcome }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Question asked of the system</th>
            <th scope="col">Expected</th>
            <th scope="col">Observed</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {outcome.checks.map((check) => (
            <tr key={check.id}>
              <td>{check.question}</td>
              <td className="meta">{check.expected}</td>
              <td className={check.passed ? "meta" : "strong-ink"}>{check.observed}</td>
              <td><StateLabel value={check.passed ? "PASS" : "FAIL"} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScenarioFacts({ outcome }: { outcome: ScenarioOutcome }) {
  if (outcome.facts.length === 0) return null;
  return (
    <Disclosure summary={`The exact data this case read (${outcome.facts.length} lines)`}>
      <ul className="stack-s">
        {outcome.facts.map((fact) => (
          <li key={fact} className="meta mono">{fact}</li>
        ))}
      </ul>
    </Disclosure>
  );
}

/* ---------------------------------------------------------------------------
 * Case C — applicability. An exclusion gets the same detail as an inclusion.
 * ------------------------------------------------------------------------- */

function ApplicabilityTable({ decisions }: { decisions: ApplicabilityDecision[] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Requirement</th>
            <th scope="col">Decision</th>
            <th scope="col">The firm&rsquo;s detail this depended on</th>
            <th scope="col">Why</th>
            <th scope="col">Clause</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((decision) => (
            <tr key={decision.id}>
              <td><span className="strong-ink">{decision.subject}</span></td>
              <td>
                <StateLabel value={decision.applies ? "APPLIES" : "OUT_OF_PROFILE_SCOPE"} />
              </td>
              <td className="mono meta">{decision.entity_fact}</td>
              <td className="meta">
                {decision.reason}
                <br />
                <span className="mono">{decision.rule}</span>
              </td>
              <td>
                <p style={{ fontFamily: "var(--serif)" }}>
                  &ldquo;{decision.citation.quote}&rdquo;
                </p>
                <p className="meta mono">{decision.citation.locator}</p>
                <Tag value={decision.provenance} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Case D — a source version changed. Both sides of every comparison, with the
 * revision's own disclaimer rendered beneath the heading.
 * ------------------------------------------------------------------------- */

function ChangeRow({ change }: { change: SourceChange }) {
  const kind = changeKindOf(change.kind);
  return (
    <div className={`change change--${change.kind.toLowerCase()}`}>
      <div className="change-head">
        <span className="sub-title">{change.subject}</span>
        {/* Rendered from the change-kind vocabulary rather than StateLabel: `ADDED`
            means one thing for a source passage and another for an uploaded file. */}
        <span className={`state state--${kind.tone}`}>
          <span className="state-glyph" aria-hidden="true">{kind.glyph}</span>
          <span>{kind.label}</span>
        </span>
      </div>

      {change.kind === "UNCHANGED" ? (
        <p className="meta">{plainPhrase(change.impact_summary)}</p>
      ) : (
        /* Both quotations, side by side. What the change would mean, which
           controls it touches and whether anything was applied are in the one
           impact table above, so those four lines are not repeated per change. */
        <CompareCols
          before={{
            label: `In force today${change.before_strength ? ` · ${labelOf(change.before_strength)}` : ""}`,
            body: change.before_quote ? (
              <>
                <p style={{ fontFamily: "var(--serif)" }}>
                  &ldquo;{change.before_quote}&rdquo;
                </p>
                <p className="meta mono">{change.before_locator}</p>
              </>
            ) : (
              <p className="meta">Nothing on this topic.</p>
            ),
          }}
          after={{
            label: `In the revision${change.after_strength ? ` · ${labelOf(change.after_strength)}` : ""}`,
            body: change.after_quote ? (
              <>
                <p style={{ fontFamily: "var(--serif)" }}>
                  &ldquo;{change.after_quote}&rdquo;
                </p>
                <p className="meta mono">{change.after_locator}</p>
              </>
            ) : (
              <p className="meta">Nothing on this topic.</p>
            ),
          }}
        />
      )}
    </div>
  );
}

/** Every change in one table, so the reader compares rows instead of scrolling
 *  through the same four labels nine times. */
function ChangeImpactTable({ changes }: { changes: SourceChange[] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Topic</th>
            <th scope="col">What it would mean</th>
            <th scope="col">Controls affected</th>
            <th scope="col">Evidence to re-check</th>
            <th scope="col">Applied automatically</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((change) => (
            <tr key={change.id}>
              <td><span className="strong-ink">{change.subject}</span></td>
              <td className="meta">{plainPhrase(change.impact_summary)}</td>
              <td className="meta">
                {change.impacted_control_ids.length > 0
                  ? <span className="mono">{change.impacted_control_ids.join(", ")}</span>
                  : "None mapped yet"}
              </td>
              <td className="meta">
                {change.evidence_ids_for_review.length > 0
                  ? <span className="mono">{change.evidence_ids_for_review.join(", ")}</span>
                  : "None"}
              </td>
              <td className="meta">
                <span className="strong-ink">
                  {change.applied_automatically ? "Yes" : "No"}
                </span>
                <br />
                {plainPhrase(change.note)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourceChangeReport({ outcome }: { outcome: ScenarioOutcome }) {
  const revision = outcome.source_revision;
  const material = outcome.source_changes.filter((item) => item.kind !== "UNCHANGED");
  const unchanged = outcome.source_changes.filter((item) => item.kind === "UNCHANGED");
  if (!revision) return null;

  return (
    <div className="stack">
      <Callout tone="accent" title="Both versions here are real SEBI documents">
        <p>{plainPhrase(revision.disclaimer)}</p>
        <dl className="datalist" style={{ marginTop: "8px" }}>
          <DataRow label="Compared">
            <span className="mono">{revision.from_version}</span> →{" "}
            <span className="mono">{revision.to_version}</span>
          </DataRow>
          <DataRow label="Written by">{revision.authority}</DataRow>
          <DataRow label="Legal status">
            <span className="strong-ink">{legalStateOf(revision.legal_state)}</span>
          </DataRow>
          <DataRow label="Scope compared">
            <span className="meta">{plainPhrase(revision.scope_note)}</span>
          </DataRow>
          <DataRow label="Fingerprints">
            <Hash value={revision.base_content_sha256} /> →{" "}
            <Hash value={revision.revision_content_sha256} />
          </DataRow>
        </dl>
      </Callout>

      {material.length > 0 && <ChangeImpactTable changes={material} />}

      <div className="stack">
        {material.map((change) => <ChangeRow key={change.id} change={change} />)}
      </div>

      {unchanged.length > 0 && (
        <Disclosure summary={`${unchanged.length} topics checked and found unchanged`}>
          <div className="stack-s">
            {unchanged.map((change) => (
              <p key={change.id} className="meta">
                <span className="strong-ink">{change.subject}</span> — {change.impact_summary}
              </p>
            ))}
          </div>
        </Disclosure>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * The runnable case panel, used for B, C and D.
 * ------------------------------------------------------------------------- */

export function ScenarioCase({
  scenario,
  outcome,
  busy,
  onRun,
  onReset,
}: {
  scenario: ScenarioDefinition;
  outcome: ScenarioOutcome | null;
  busy: boolean;
  onRun: () => Promise<void>;
  onReset: () => Promise<void>;
}) {
  const passed = useMemo(
    () => (outcome ? outcome.checks.filter((item) => item.passed).length : 0),
    [outcome],
  );

  return (
    <div className="stack-l" id="scenario-case">
      <ScenarioBrief scenario={scenario} />

      <Panel
        title={outcome ? "What happened" : "Run this case"}
        aside={
          outcome ? (
            <div className="stack-s" style={{ minWidth: "230px" }}>
              <StateLabel value={outcome.status} />
              <Stat
                size="s"
                value={`${passed}/${outcome.checks.length}`}
                label="checks matched"
                tone={passed === outcome.checks.length ? "ok" : "fail"}
              />
              <SegBar
                segments={[
                  { label: "Matched", count: passed, tone: "ok" },
                  { label: "Did not match", count: outcome.checks.length - passed, tone: "fail" },
                ]}
                ariaLabel={`${passed} of ${outcome.checks.length} checks matched the expected outcome`}
              />
            </div>
          ) : (
            <StateLabel value="SCENARIO_NOT_RUN" />
          )
        }
      >
        <div className="stack">
          {outcome ? (
            <>
              <Callout
                tone={outcome.status === "SCENARIO_DEMONSTRATED" ? "ok" : "fail"}
                title={outcome.headline}
              >
                <p className="meta">Run {formatTimestamp(outcome.ran_at)}</p>
              </Callout>

              <ChecksTable outcome={outcome} />

              {outcome.applicability_decisions.length > 0 && (
                <ApplicabilityTable decisions={outcome.applicability_decisions} />
              )}

              {outcome.source_changes.length > 0 && (
                <SourceChangeReport outcome={outcome} />
              )}

              {outcome.citations.length > 0 && (
                <Disclosure summary={`Source passages this case cites (${outcome.citations.length})`}>
                  <div className="stack">
                    {outcome.citations.map((citation, index) => (
                      <Quote
                        key={`${citation.span_id}-${index}`}
                        locator={citation.locator}
                        text={citation.quote}
                        sourceUrl={citation.source_url}
                        sourceLabel="Open the official source"
                      />
                    ))}
                  </div>
                </Disclosure>
              )}

              <ScenarioFacts outcome={outcome} />

              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={busy}
                  onClick={() => void onRun()}
                >
                  {busy && <span className="spinner" aria-hidden="true" />}
                  Run this case again
                </button>
                <button
                  type="button"
                  className="btn btn--quiet"
                  disabled={busy}
                  onClick={() => void onReset()}
                >
                  Reset to the original demo facts
                </button>
              </div>
            </>
          ) : (
            <div className="btn-row">
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy}
                onClick={() => void onRun()}
              >
                {busy && <span className="spinner" aria-hidden="true" />}
                Run case {scenario.label}
              </button>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

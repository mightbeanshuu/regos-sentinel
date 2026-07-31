"use client";

import { useMemo } from "react";

import { changeKindOf, formatTimestamp, labelOf } from "../lib/presentation";
import type {
  ApplicabilityDecision,
  ScenarioCatalogue,
  ScenarioDefinition,
  ScenarioId,
  ScenarioOutcome,
  SourceChange,
} from "../lib/types";
import { Callout, DataRow, Disclosure, Hash, Panel, Quote, StateLabel, Tag } from "./ui";

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
      <p className="micro">Four questions a regulator would ask — each runs live against the engine.</p>
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
              {scenario.label === "D" && (
                <span className="cp-ribbon">Real SEBI advisory · May 2026</span>
              )}
              <span className={`cp-badge cp-badge--${tone}`} aria-hidden="true">{scenario.label}</span>
              <span className="cp-title">{scenario.title}</span>
              <span className="cp-q">{scenario.question}</span>
              <span className={`cp-chip${run ? (run.status === "SCENARIO_DEMONSTRATED" ? " cp-chip--ok" : " cp-chip--diff") : ""}`}>
                {run
                  ? run.status === "SCENARIO_DEMONSTRATED"
                    ? "Ran · matched the promise"
                    : "Ran · differences found"
                  : "Not run yet"}
              </span>
              {on && <span className="cp-underline" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div className="cp-band">
        <div className="cp-band-col">
          <p className="cp-band-h">Expected — written before the run</p>
          <p className="cp-band-line">
            <span className="cp-pen" aria-hidden="true">✎</span>
            <span className="clamp2" title={selected.citation_quote}>
              &ldquo;{selected.citation_quote}&rdquo; <span className="meta">· {selected.citation_locator}</span>
            </span>
          </p>
          <p className="cp-band-line">
            <span className="cp-pen" aria-hidden="true">✎</span>
            <span className="clamp2" title={selected.expected_outcome}>{selected.expected_outcome}</span>
          </p>
        </div>
        <div className={`cp-eq${outcome ? (matched ? " cp-eq--ok" : " cp-eq--diff") : ""}`}>
          <span className="cp-eq-sign" aria-hidden="true">{outcome ? (matched ? "=" : "≠") : "→"}</span>
          <span className="cp-eq-word">
            {outcome
              ? matched
                ? "The run matched the promise"
                : "The run differed — shown, not hidden"
              : "Run it and compare"}
          </span>
        </div>
        <div className="cp-band-col">
          <p className="cp-band-h">What actually happened</p>
          {outcome ? (
            <>
              {outcome.checks.slice(0, 2).map((check) => (
                <p className="cp-band-line" key={check.id ?? check.question}>
                  <span className={check.passed ? "cp-mark cp-mark--ok" : "cp-mark cp-mark--diff"} aria-hidden="true">
                    {check.passed ? "✓" : "!"}
                  </span>
                  <span className="clamp2" title={check.observed}>{check.observed}</span>
                </p>
              ))}
              <p className="cp-receipt mono">{selected.automated_test} · replayed on every build</p>
            </>
          ) : (
            <p className="meta">Not run yet — the expected outcome is already written down.</p>
          )}
        </div>
        <button
          type="button"
          className="btn btn--primary cp-open"
          onClick={() => {
            onSelect(active);
            document.querySelector("#scenario-case, .jr-rail")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    >
      <dl className="datalist">
        <DataRow label="Source">
          <span className="meta mono">{scenario.citation_locator}</span>
          <p style={{ fontFamily: "var(--serif)", marginTop: "4px" }}>
            &ldquo;{scenario.citation_quote}&rdquo;
          </p>
        </DataRow>
        <DataRow label="Expected outcome">
          <span className="clamp2" title={scenario.expected_outcome}>
            {scenario.expected_outcome}
          </span>
        </DataRow>
        <DataRow label="Seeded data">
          <span className="meta clamp2" title={scenario.seeded_data}>{scenario.seeded_data}</span>
        </DataRow>
        <DataRow label="Standing proof">
          <span className="meta">A committed test replays this case on every build.</span>
          <p className="meta mono" style={{ marginTop: "4px" }}>{scenario.automated_test}</p>
        </DataRow>
        <DataRow label="Reset">
          <span className="meta">{scenario.reset_note}</span>
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
    <Disclosure summary={`Facts this case read (${outcome.facts.length})`}>
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
            <th scope="col">Entity fact it turned on</th>
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
 * Case D — a source version changed. Both sides of every comparison, and a
 * standing reminder that the second side is prototype text.
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
        <p className="meta">{change.impact_summary}</p>
      ) : (
        <>
          <div className="compare">
            <div className="compare-col">
              <p className="micro">
                In force today
                {change.before_strength ? ` · ${labelOf(change.before_strength)}` : ""}
              </p>
              {change.before_quote ? (
                <>
                  <p style={{ fontFamily: "var(--serif)" }}>
                    &ldquo;{change.before_quote}&rdquo;
                  </p>
                  <p className="meta mono">{change.before_locator}</p>
                </>
              ) : (
                <p className="meta">Nothing on this topic.</p>
              )}
            </div>
            <span className="compare-rel" aria-hidden="true">→</span>
            <div className="compare-col compare-col--source">
              <p className="micro">
                In the revision
                {change.after_strength ? ` · ${labelOf(change.after_strength)}` : ""}
              </p>
              {change.after_quote ? (
                <>
                  <p style={{ fontFamily: "var(--serif)" }}>
                    &ldquo;{change.after_quote}&rdquo;
                  </p>
                  <p className="meta mono">{change.after_locator}</p>
                </>
              ) : (
                <p className="meta">Nothing on this topic.</p>
              )}
            </div>
          </div>

          <dl className="datalist">
            <DataRow label="What it would mean">{change.impact_summary}</DataRow>
            <DataRow label="Controls it reaches">
              {change.impacted_control_ids.length > 0
                ? <span className="mono">{change.impacted_control_ids.join(", ")}</span>
                : <span className="meta">None mapped yet</span>}
            </DataRow>
            <DataRow label="Evidence put back in the queue">
              {change.evidence_ids_for_review.length > 0
                ? <span className="mono">{change.evidence_ids_for_review.join(", ")}</span>
                : <span className="meta">None</span>}
            </DataRow>
            <DataRow label="Applied automatically">
              <span className="strong-ink">No</span>
              <p className="meta">{change.note}</p>
            </DataRow>
          </dl>
        </>
      )}
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
      <Callout tone="review" title="The second version here is prototype text, not SEBI text">
        <p>{revision.disclaimer}</p>
        <dl className="datalist" style={{ marginTop: "8px" }}>
          <DataRow label="Compared">
            <span className="mono">{revision.from_version}</span> →{" "}
            <span className="mono">{revision.to_version}</span>
          </DataRow>
          <DataRow label="Written by">{revision.authority}</DataRow>
          <DataRow label="Legal status">
            <span className="strong-ink">{revision.legal_state}</span>
          </DataRow>
          <DataRow label="Scope compared">
            <span className="meta">{revision.scope_note}</span>
          </DataRow>
          <DataRow label="Fingerprints">
            <Hash value={revision.base_content_sha256} /> →{" "}
            <Hash value={revision.revision_content_sha256} />
          </DataRow>
        </dl>
      </Callout>

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
  const summary = useMemo(() => {
    if (!outcome) return null;
    const passed = outcome.checks.filter((item) => item.passed).length;
    return `${passed} of ${outcome.checks.length} checks matched the expected outcome`;
  }, [outcome]);

  return (
    <div className="stack-l" id="scenario-case">
      <ScenarioBrief scenario={scenario} />

      <Panel
        title={outcome ? "What happened" : "Run this case"}
        description={
          outcome
            ? "Every row below is read from this run, not from the description above."
            : "The expected outcome is already written down. Run the case and compare."
        }
        aside={<StateLabel value={outcome?.status ?? "SCENARIO_NOT_RUN"} />}
      >
        <div className="stack">
          {outcome ? (
            <>
              <Callout
                tone={outcome.status === "SCENARIO_DEMONSTRATED" ? "ok" : "fail"}
                title={outcome.headline}
              >
                <p className="meta">
                  {summary} · run {formatTimestamp(outcome.ran_at)}
                </p>
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
                  Reset to seeded data
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

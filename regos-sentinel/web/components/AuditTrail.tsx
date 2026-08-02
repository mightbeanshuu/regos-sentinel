"use client";

import { useEffect, useState, type ReactNode } from "react";

import { regosApi } from "../lib/api";
import {
  actorOf,
  checkpointOf,
  effectOf,
  eventLabelOf,
  formatTimestamp,
  labelOf,
  legalStateOf,
  plainPhrase,
  stageOf,
  stateOf,
  type Tone,
} from "../lib/presentation";

/** Enum-shaped values go through the vocabulary map; sentences pass through. */
function plainValue(value: string): string {
  return /^[A-Z][A-Z0-9_]+$/.test(value) ? labelOf(value) : value;
}
import type {
  AiAssuranceReport,
  CorpusPackReport,
  MetricsReport,
  WorkspaceState,
} from "../lib/types";
import {
  Callout,
  DataRow,
  Disclosure,
  Empty,
  Hash,
  Meter,
  Panel,
  SegBar,
  Skeleton,
  Stat,
  StatRow,
  StateLabel,
  Tag,
  Timeline,
} from "./ui";

const PIPELINE: Array<{ stage: string; name: string; plain: string }> = [
  { stage: "INGEST", name: "Load", plain: "Load the source and record its fingerprint" },
  { stage: "COVERAGE", name: "Cover", plain: "Give every reviewed passage a disposition" },
  { stage: "COMPILE", name: "Draft", plain: "Draft structured requirements from the passages" },
  { stage: "VERIFY", name: "Check", plain: "Run the fixed automated checks" },
  { stage: "APPLY", name: "Apply", plain: "Decide what applies to this entity" },
  { stage: "OPERATE", name: "Operate", plain: "Create work and update evidence" },
  { stage: "DIFF", name: "Compare", plain: "Record what changed against the previous version" },
  { stage: "PROVE", name: "Seal", plain: "Seal the record so the result can be reproduced" },
];

/* ---------------------------------------------------------------------------
 * Summary helpers.
 *
 * This page holds every row of the record, which is exactly why it needs a layer
 * a person can read in one screen. Each section opens with a distribution or a
 * ratio computed from the rows themselves — nothing is estimated, nothing is
 * dropped, and the full table is one click away underneath.
 * ------------------------------------------------------------------------- */

type Segment = { label: string; count: number; tone: Tone };

/**
 * Count enum values into segments. A known set of possible values keeps its zero
 * counts visible, because "0 failed" is information a compliance officer needs.
 */
function distribution(values: string[], universe?: readonly string[]): Segment[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const keys = universe ? [...universe] : [...counts.keys()];
  return keys.map((key) => ({
    label: labelOf(key),
    count: counts.get(key) ?? 0,
    tone: stateOf(key).tone,
  }));
}

function spoken(segments: Segment[], noun: string): string {
  const parts = segments.filter((segment) => segment.count > 0);
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  if (parts.length === 0) return `No ${noun} recorded`;
  return `${parts.map((s) => `${s.count} ${s.label}`).join(", ")} of ${total} ${noun}`;
}

const GATE_STATES = ["GATE_PASSED", "GATE_NOT_RUN", "GATE_NOT_APPLICABLE"] as const;
const PACK_STATES = [
  "HERO_SCOPE_ACTIVE",
  "SOURCE_REGISTERED_NOT_COMPILED",
  "UPLOAD_SANDBOX_AVAILABLE",
] as const;
const COVERAGE_STATES = [
  "COMPILED_OBLIGATION",
  "AMBIGUOUS_REVIEW_REQUIRED",
  "INFORMATIONAL",
  "DUPLICATE_OR_SUPERSEDED",
  "OUT_OF_PROFILE_SCOPE",
] as const;
const DEONTIC_STATES = [
  "MANDATORY",
  "PROHIBITED",
  "RECOMMENDED",
  "PERMITTED",
  "DEFINITIONAL",
] as const;
const TEST_STATES = ["PASS", "BLOCK", "FAIL"] as const;

/** A 60px track beside a printed figure. The figure is the datum; the bar is redundancy. */
function InlineBar({
  value,
  max,
  tone,
  label,
  figure,
}: {
  value: number;
  max: number;
  tone: Tone;
  label: string;
  figure: ReactNode;
}) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <span className="meter meter--inline">
      <span
        className="meter-track"
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <span
          className={`meter-fill meter-fill--${tone}`}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </span>
      <span className="strong-ink">{figure}</span>
    </span>
  );
}

/** One folded table. Everything on this page stays reachable — closed is not gone. */
function FoldedTable({
  summary,
  children,
  open = false,
}: {
  summary: ReactNode;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <Disclosure summary={summary} open={open}>
      <div className="table-scroll">{children}</div>
    </Disclosure>
  );
}

export function AuditTrail({ state }: { state: WorkspaceState }) {
  const build = state.builds.at(-1);
  const manifest = state.latest_manifest;
  const benchmark = state.latest_benchmark;
  const receiptData = state.model_run_receipt;

  const [packs, setPacks] = useState<CorpusPackReport[] | null>(null);
  const [assurance, setAssurance] = useState<AiAssuranceReport | null>(null);
  const [metrics, setMetrics] = useState<MetricsReport | null>(null);
  /** Loading and absence are different things: skeleton first, empty state only after. */
  const [settled, setSettled] = useState(false);
  const [reloads, setReloads] = useState(0);

  // These three views are derived from the same workspace, so they are refetched
  // whenever the build moves. A stale gate table is worse than no gate table.
  useEffect(() => {
    let live = true;
    void Promise.all([
      regosApi.corpusPacks().catch(() => null),
      regosApi.assurance().catch(() => null),
      regosApi.metrics().catch(() => null),
    ]).then(([packReports, assuranceReport, metricsReport]) => {
      if (!live) return;
      setPacks(packReports);
      setAssurance(assuranceReport);
      setMetrics(metricsReport);
      setSettled(true);
    });
    return () => { live = false; };
  }, [state.builds.length, state.reviews.length, state.scenario_outcomes.length, reloads]);

  const retry = (
    <button
      type="button"
      className="btn btn--secondary btn--small"
      onClick={() => setReloads((count) => count + 1)}
    >
      Try again
    </button>
  );

  const jumpTo = (selector: string) =>
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ---- Summary figures, all counted from rows already on this page ---------
  const packSegments = distribution(
    state.corpus_packs.map((pack) => pack.status),
    PACK_STATES,
  );
  const coverageSegments = distribution(
    state.coverage.map((entry) => entry.status),
    COVERAGE_STATES,
  );
  const strengthSegments = distribution(
    state.regulatory_statements.map((statement) => statement.deontic_force),
    DEONTIC_STATES,
  );
  const evidenceSegments = distribution(state.evidence.map((item) => item.status));
  const allTests = state.builds.flatMap((historical) => historical.tests);
  const testSegments = distribution(allTests.map((test) => test.status), TEST_STATES);
  const gateSegments = packs
    ? distribution(packs.flatMap((report) => report.gates.map((gate) => gate.status)), GATE_STATES)
    : [];
  const checkpointsCleared = packs
    ? packs.reduce((sum, report) => sum + report.gates_passed, 0)
    : 0;
  const checkpointsTotal = packs
    ? packs.reduce((sum, report) => sum + report.gates_total, 0)
    : 0;
  const decisionCount = state.reviewer_readings.length + state.reviews.length;

  return (
    <div className="jr-shell">
      <aside className="jr-sidenav" aria-label="Sections of the audit trail">
        {([
          ["#fr-sources", "Sources"],
          ["#fr-checkpoints", "Checkpoints"],
          ["#fr-coverage", "Coverage"],
          ["#fr-strength", "Strength"],
          ["#fr-decisions", "Decisions"],
          ["#fr-checks", "Checks"],
          ["#fr-evidence", "Evidence"],
          ["#fr-replay", "Reproduce this result"],
        ] as const).map(([target, label]) => (
          <button key={target} type="button" className="side-item" onClick={() => jumpTo(target)}>
            <span className="side-item-label">{label}</span>
          </button>
        ))}
      </aside>
      <div className="stack-l jr-body">
      <section className="audit-hero">
        <div className="stack-s">
          <h1 className="page-title">Audit trail</h1>
          <p className="lede">
            What was read, how it was decided, which checks ran, and how to reproduce the result.
          </p>
        </div>
        {state.agent_runs.length > 0 && state.agent_runs.every((run) => run.chain_verified) ? (
          <span className="audit-chain-badge">
            ✓ Record verified — each step is locked to the one before it, so nothing can be
            edited or removed
          </span>
        ) : (
          <span className="audit-chain-badge audit-chain-badge--idle">
            ⛓ Tamper-evident record — each assistant run is checked when it completes
          </span>
        )}
      </section>

      {/* ---- The whole record in four figures, before any table -------- */}
      <div className="stack-s">
        <StatRow>
          <Stat size="s" value={state.corpus_packs.length} label="Documents in this review" />
          <Stat
            size="s"
            value={state.coverage.length}
            label="Passages with a recorded decision"
          />
          <Stat
            size="s"
            value={settled && packs ? checkpointsCleared : "—"}
            label="Checkpoints cleared"
            context={settled && packs ? `of ${checkpointsTotal}` : "not loaded yet"}
          />
          <Stat size="s" value={state.audit_events.length} label="Recorded events" />
        </StatRow>
        <p className="micro">
          Every table below is folded shut so this page can be read in one screen. Nothing is
          removed — open a section to see every row.
        </p>
      </div>

      {/* ---- Sources and the gates they have cleared -------------------- */}
      <Panel
        id="fr-sources"
        title="Documents in this review"
        description="See which documents were reviewed, added for reference, or still need processing."
        tight
      >
        <div className="stack">
          <SegBar segments={packSegments} ariaLabel={spoken(packSegments, "documents")} />
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Source and status</th>
                  <th scope="col" className="table-num">Reviewed passages</th>
                  <th scope="col" className="table-num">Draft requirements</th>
                  <th scope="col">Document fingerprint</th>
                </tr>
              </thead>
              <tbody>
                {state.corpus_packs.map((pack) => (
                  <tr key={pack.id}>
                    <td>
                      <span className="strong-ink">{pack.title}</span>
                      <p><StateLabel value={pack.status} /></p>
                      <p className="meta">{plainPhrase(pack.scope_note)}</p>
                      <p className="meta">{pack.published_at} · {pack.version}</p>
                      <p className="meta">{pack.authority} · {legalStateOf(pack.legal_state)}</p>
                      <p className="meta">
                        <a
                          className="proof-link"
                          href={pack.source_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open official source ↗
                        </a>
                      </p>
                    </td>
                    <td className="table-num">{pack.indexed_span_count}</td>
                    <td className="table-num">{pack.compiled_candidate_count}</td>
                    <td><Hash value={pack.content_identity_sha256} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      {/* ---- The eight checkpoints, applied to every source alike ------- */}
      <Panel
        id="fr-checkpoints"
        title="Which checkpoints each source has cleared"
        description="Every source goes through the same eight checkpoints. Checkpoints that were never attempted are shown as not attempted."
      >
        {!settled && <Skeleton kind="lines" lines={4} />}
        {settled && packs === null && (
          <Empty
            title="The checkpoint report could not be loaded"
            hint="No figures are shown for checkpoints that have not been read back from the record."
            action={retry}
          />
        )}
        {settled && packs !== null && (
          <div className="stack">
            <SegBar
              segments={gateSegments}
              ariaLabel={spoken(gateSegments, "checkpoints")}
            />
            <div>
              {packs.map((report) => (
                <Meter
                  key={report.pack.id}
                  label={report.pack.title}
                  value={report.gates_passed}
                  max={report.gates_total}
                  tone={report.gates_passed === report.gates_total ? "ok" : "review"}
                  valueLabel={`${report.gates_passed}/${report.gates_total}`}
                />
              ))}
            </div>
            {packs.map((report) => (
              <Disclosure
                key={report.pack.id}
                summary={`All eight checkpoints for ${report.pack.title} — ${report.gates_passed} of ${report.gates_total} cleared`}
              >
                <p className="meta">
                  How much of this document was read:{" "}
                  {plainPhrase(report.pack.extraction_scope)}
                </p>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Checkpoint</th>
                        <th scope="col">What it checks</th>
                        <th scope="col">State</th>
                        <th scope="col">What was observed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.gates.map((gate) => {
                        const said = checkpointOf(gate.id, gate.name, gate.plain);
                        return (
                          <tr key={gate.id}>
                            <td>
                              <span className="strong-ink">{said.name}</span>
                              <p className="meta mono">{gate.id}</p>
                            </td>
                            <td className="meta">{said.description}</td>
                            <td><StateLabel value={gate.status} /></td>
                            <td className="meta">
                              {gate.observed}
                              {gate.test_id && (
                                <p className="meta mono">{gate.test_id}</p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Disclosure>
            ))}
          </div>
        )}
      </Panel>

      {/* ---- Source coverage ------------------------------------------ */}
      <Panel
        id="fr-coverage"
        title="Source coverage"
        description="These counts cover only the passages declared in scope for this document."
        tight
      >
        <div className="stack">
          <SegBar segments={coverageSegments} ariaLabel={spoken(coverageSegments, "passages")} />
          <FoldedTable
            summary={`Every passage and what was decided about it (${state.coverage.length})`}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Passage</th>
                  <th scope="col">What was decided</th>
                  <th scope="col">Why</th>
                  <th scope="col">Reviewed by</th>
                </tr>
              </thead>
              <tbody>
                {state.coverage.map((entry) => {
                  const span = state.source_spans.find((item) => item.id === entry.span_id);
                  return (
                    <tr key={entry.id}>
                      <td>
                        <span className="strong-ink">{span?.question ?? entry.span_id}</span>
                        <p className="meta mono">{span?.locator}</p>
                      </td>
                      <td><StateLabel value={entry.status} /></td>
                      <td className="meta">{plainPhrase(entry.rationale)}</td>
                      <td className="meta">
                        {entry.reviewed_by
                          ? `${entry.reviewed_by} · ${formatTimestamp(entry.reviewed_at)}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </FoldedTable>
        </div>
      </Panel>

      {/* ---- Requirement strength ------------------------------------- */}
      <Panel
        id="fr-strength"
        title="Requirement strength by statement"
        description="Only required language creates mandatory work."
        tight
      >
        <div className="stack">
          <SegBar segments={strengthSegments} ariaLabel={spoken(strengthSegments, "statements")} />
          <FoldedTable
            summary={`Every statement and its exact wording (${state.regulatory_statements.length})`}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Exact wording</th>
                  <th scope="col">Strength</th>
                  <th scope="col">Operational effect</th>
                  <th scope="col">Classified by</th>
                </tr>
              </thead>
              <tbody>
                {state.regulatory_statements.map((statement) => (
                  <tr key={statement.id}>
                    <td style={{ fontFamily: "var(--serif)" }}>“{statement.exact_phrase}”</td>
                    <td><StateLabel value={statement.deontic_force} /></td>
                    <td className="meta">
                      {effectOf(statement.operational_effect)}
                    </td>
                    <td><Tag value={statement.classification_provenance} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FoldedTable>
        </div>
      </Panel>

      {/* ---- Decisions ------------------------------------------------- */}
      <Panel id="fr-decisions" title="Decisions and reviewers" tight>
        {decisionCount === 0 ? (
          <Empty
            title="No decision has been recorded yet"
            hint="A named person's own reading, and the approval that follows it, appear here as soon as a review is completed."
          />
        ) : (
          <div className="stack">
            <StatRow>
              <Stat
                size="s"
                value={state.reviewer_readings.length}
                label="Readings recorded before the draft was shown"
              />
              <Stat size="s" value={state.reviews.length} label="Approvals recorded" />
            </StatRow>
            <Disclosure summary={`Every decision in full (${decisionCount})`}>
              <div className="stack">
                {state.reviewer_readings.map((reading) => (
                  <dl className="datalist" key={reading.id}>
                    <DataRow label="Independent reading">{reading.independent_interpretation}</DataRow>
                    <DataRow label="Recorded by">
                      {reading.reviewer_name} · {reading.reviewer_role}
                    </DataRow>
                    <DataRow label="Committed at">{formatTimestamp(reading.committed_at)}</DataRow>
                    <DataRow label="Draft revealed at">
                      {formatTimestamp(reading.system_suggestion_revealed_at)}
                    </DataRow>
                    <DataRow label="Draft shown">{reading.revealed_system_suggestion}</DataRow>
                  </dl>
                ))}
                {state.reviews.map((review) => (
                  <dl className="datalist" key={review.id}>
                    <DataRow label="Decision">{review.selected_interpretation}</DataRow>
                    <DataRow label="Approved by">
                      {review.reviewer_name} · {review.reviewer_role}
                    </DataRow>
                    <DataRow label="Approved at">{formatTimestamp(review.decided_at)}</DataRow>
                    <DataRow label="Written reason">{review.reason}</DataRow>
                    <DataRow label="Agreed with the draft">
                      {review.reviewer_agreement === null
                        ? "—"
                        : review.reviewer_agreement
                          ? "Yes"
                          : "No — reason recorded above"}
                    </DataRow>
                    <DataRow label="Trigger policy">
                      {review.policy_inputs.trigger_policy} <Tag value="HUMAN_POLICY" />
                    </DataRow>
                  </dl>
                ))}
              </div>
            </Disclosure>
          </div>
        )}
      </Panel>

      {/* ---- Pipeline & tests ------------------------------------------ */}
      <Panel
        id="fr-checks"
        title="Checks executed"
        description="Every check, for every run recorded so far."
      >
        <div className="stack">
          {allTests.length > 0 ? (
            <>
              <SegBar segments={testSegments} ariaLabel={spoken(testSegments, "checks")} />
              <FoldedTable summary={`Every check that ran (${allTests.length})`}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Run</th>
                      <th scope="col">Check</th>
                      <th scope="col">Result</th>
                      <th scope="col">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.builds.flatMap((historical) =>
                      historical.tests.map((test) => (
                        <tr key={`${historical.id}-${test.id}`}>
                          <td className="mono">{historical.id}</td>
                          <td>{test.name}</td>
                          <td><StateLabel value={test.status} /></td>
                          <td className="meta">{test.message}</td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </FoldedTable>
            </>
          ) : (
            <Empty
              title="No checks have run yet"
              hint="The fixed checks run when a review is completed or a demonstration case is played. Nothing is claimed about them until they have."
            />
          )}
          {build && (
            <p className="meta">
              Most recent run: <span className="mono">{build.id}</span>
            </p>
          )}

          <FoldedTable summary={`The stages every document passes through (${PIPELINE.length})`}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Stage</th>
                  <th scope="col">What it does</th>
                </tr>
              </thead>
              <tbody>
                {PIPELINE.map((item) => (
                  <tr key={item.stage}>
                    <td><span className="strong-ink">{item.name}</span></td>
                    <td className="meta">{item.plain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FoldedTable>
        </div>
      </Panel>

      {/* ---- Evidence -------------------------------------------------- */}
      <Panel id="fr-evidence" title="Evidence history" tight>
        <div className="stack">
          <SegBar segments={evidenceSegments} ariaLabel={spoken(evidenceSegments, "evidence items")} />
          <p className="meta">Every item below is synthetic demonstration data.</p>
          <FoldedTable summary={`Every evidence item and when it was collected (${state.evidence.length})`}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Kind</th>
                  <th scope="col">State</th>
                  <th scope="col">Collected</th>
                  <th scope="col">Reason</th>
                </tr>
              </thead>
              <tbody>
                {state.evidence.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name} <span className="meta">· synthetic</span></td>
                    <td className="meta">{plainPhrase(item.kind)}</td>
                    <td><StateLabel value={item.status} /></td>
                    <td className="meta">{formatTimestamp(item.collected_at)}</td>
                    <td className="meta">{item.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FoldedTable>
        </div>
      </Panel>

      {/* ---- Reproducibility ------------------------------------------- */}
      <Panel
        id="fr-replay"
        title="How to reproduce this result"
        description="The exact versions, model details and inputs someone else would need to get the same result."
      >
        <div className="stack">
          {!manifest && (
            <Callout tone="review" title="No sealed record yet">
              <p>
                A record is sealed only after a review is approved. Complete the guided review
                to produce one.
              </p>
            </Callout>
          )}

          <div className="btn-row">
            <a
              className="btn btn--secondary"
              href="/api/v1/manifests/latest?download=true"
            >
              Download the audit-ready record
            </a>
            <a
              className="btn btn--quiet"
              href="/api/v1/exports/oscal/assessment-results?download=true"
            >
              Download assessment results (OSCAL 1.2.2 format)
            </a>
            <a
              className="btn btn--quiet"
              href="/api/v1/exports/oscal/validation"
              target="_blank"
              rel="noreferrer"
            >
              Open the receipt showing this export matches the NIST format ↗
            </a>
          </div>
          <p className="meta">
            OSCAL is the NIST open format many regulators and auditors can import.
          </p>

          <Disclosure summary="The exact versions, model details and fingerprints">
            <dl className="datalist">
              <DataRow label="Data format version">{state.schema_version}</DataRow>
              <DataRow label="Rule set version">{state.ruleset_version}</DataRow>
              <DataRow label="Source version">{state.source_version}</DataRow>
              <DataRow label="Model provider">{receiptData.provider}</DataRow>
              <DataRow label="Model">{receiptData.model_id}</DataRow>
              <DataRow label="Prompt version">{receiptData.prompt_version}</DataRow>
              <DataRow label="Answered from a saved record">
                {receiptData.cache_hit ? "Yes — no live model call in this run" : "No"}
              </DataRow>
              <DataRow label="Fingerprint of what was sent to the model">
                <Hash value={receiptData.input_sha256} />
              </DataRow>
              <DataRow label="Fingerprint of what the model returned">
                <Hash value={receiptData.output_sha256} />
              </DataRow>
              <DataRow label="How much of the document was read">
                {plainPhrase(receiptData.extraction_scope)}
              </DataRow>
              {manifest && (
                <>
                  <DataRow label="Fingerprint of the sealed record">
                    <Hash value={manifest.manifest_sha256} />
                  </DataRow>
                  <DataRow label="Fingerprint of the inputs used to reproduce this">
                    <Hash value={manifest.reproducibility.replay_input_sha256} />
                  </DataRow>
                </>
              )}
            </dl>
          </Disclosure>
        </div>
      </Panel>

      {/* ---- What the AI did, and what it was not allowed to do --------- */}
      {!settled && (
        <Panel title="Where the AI is, and where it is not">
          <Skeleton kind="lines" lines={4} />
        </Panel>
      )}
      {settled && assurance === null && (
        <Panel title="Where the AI is, and where it is not">
          <Empty
            title="This report could not be loaded"
            hint="Nothing is asserted about what the model did until the record has been read back."
            action={retry}
          />
        </Panel>
      )}
      {settled && assurance !== null && (
        <Panel
          title="Where the AI is, and where it is not"
          description={plainPhrase(assurance.statement)}
        >
          <div className="stack">
            <StatRow>
              <Stat
                size="s"
                value={assurance.candidate_count}
                label="Draft requirements the model returned"
              />
              <Stat
                size="s"
                value={assurance.accepted_field_count}
                label="Values accepted after the safety rules ran"
                context={`of ${assurance.accepted_field_count + assurance.rejected_field_count}`}
              />
              <Stat
                size="s"
                value={assurance.rejected_field_count}
                label="Values the safety rules refused or replaced"
                tone={assurance.rejected_field_count > 0 ? "review" : undefined}
              />
            </StatRow>

            <SegBar
              segments={[
                { label: "Accepted", count: assurance.accepted_field_count, tone: "ok" },
                { label: "Refused or replaced", count: assurance.rejected_field_count, tone: "review" },
              ]}
              ariaLabel={`${assurance.accepted_field_count} values accepted, ${assurance.rejected_field_count} refused or replaced`}
            />

            <div className="compare">
              <div className="compare-col">
                <p className="micro">The model proposes</p>
                <ul className="stack-s">
                  {assurance.split.ai_does.map((item) => (
                    <li key={item} className="meta">{plainPhrase(item)}</li>
                  ))}
                </ul>
              </div>
              <div className="compare-col">
                <p className="micro">Fixed rules enforce</p>
                <ul className="stack-s">
                  {assurance.split.deterministic_does.map((item) => (
                    <li key={item} className="meta">{plainPhrase(item)}</li>
                  ))}
                </ul>
              </div>
              <div className="compare-col compare-col--source">
                <p className="micro">A person decides</p>
                <ul className="stack-s">
                  {assurance.split.human_does.map((item) => (
                    <li key={item} className="meta">{plainPhrase(item)}</li>
                  ))}
                </ul>
              </div>
            </div>

            {assurance.abstentions.map((record) => (
              <Callout
                key={`${record.candidate_id}-${record.field}`}
                tone={record.gate_upheld_abstention ? "ok" : "fail"}
                title={
                  record.gate_upheld_abstention
                    ? `The model declined to state a ${record.field}, and the rules held that line`
                    : `The model declined to state a ${record.field}, but a value got through`
                }
              >
                <p className="meta mono">{record.candidate_id}</p>
                <p>{plainPhrase(record.note)}</p>
              </Callout>
            ))}

            <FoldedTable
              summary={`Each stage, and who does it (${assurance.pipeline.length})`}
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">Stage</th>
                    <th scope="col">Who does it</th>
                    <th scope="col">What happens</th>
                  </tr>
                </thead>
                <tbody>
                  {assurance.pipeline.map((stage) => {
                    const actor = actorOf(stage.actor);
                    const said = stageOf(stage.id, stage.name, stage.plain);
                    return (
                      <tr key={stage.id}>
                        <td><span className="strong-ink">{said.name}</span></td>
                        <td>
                          <span className={`state state--${actor.tone}`}>
                            <span className="state-glyph" aria-hidden="true">{actor.glyph}</span>
                            <span>{actor.label}</span>
                          </span>
                        </td>
                        <td className="meta">{said.plain}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </FoldedTable>

            <FoldedTable
              summary={`Every value the model proposed, and what the rules did with it (${assurance.field_outcomes.length})`}
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">Draft requirement</th>
                    <th scope="col">Field</th>
                    <th scope="col">What the model proposed</th>
                    <th scope="col">What the rules did with it</th>
                    <th scope="col">Recorded as</th>
                  </tr>
                </thead>
                <tbody>
                  {assurance.field_outcomes.map((outcome, index) => (
                    <tr key={`${outcome.candidate_id}-${outcome.field}-${index}`}>
                      <td className="mono meta">{outcome.candidate_id}</td>
                      <td>{outcome.field}</td>
                      <td className="meta">{outcome.proposed}</td>
                      <td className="meta">{plainPhrase(outcome.resolution)}</td>
                      <td>
                        {outcome.provenance_after_gates
                          ? <Tag value={outcome.provenance_after_gates} />
                          : <span className="meta">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </FoldedTable>

            <p className="meta">
              Model run: {assurance.receipt.provider} · {assurance.receipt.model_id} ·{" "}
              {assurance.receipt.cache_hit
                ? "answered from a saved record — no live model call"
                : "a live call to the model"}
            </p>

            <Callout tone="review" title="What this does not say">
              <p>{plainPhrase(assurance.limitation)}</p>
            </Callout>
          </div>
        </Panel>
      )}

      {/* ---- Measured, with the scope and the limit attached ------------ */}
      {!settled && (
        <Panel title="Measured on this prototype">
          <Skeleton kind="lines" lines={3} />
        </Panel>
      )}
      {settled && metrics === null && (
        <Panel title="Measured on this prototype">
          <Empty
            title="The measured figures could not be loaded"
            hint="No figure is shown here unless a committed test produced it."
            action={retry}
          />
        </Panel>
      )}
      {settled && metrics !== null && (
        <Panel
          title="Measured on this prototype"
          description="Every figure is measured by a committed test. Nothing is an estimate."
        >
          <div className="stack">
            <StatRow>
              <Stat size="s" value={metrics.metrics.length} label="Measured figures" />
              <Stat size="s" value={metrics.case_count} label="Cases measured against" />
            </StatRow>
            <p className="meta">Measured at {formatTimestamp(metrics.measured_at)}.</p>

            <Callout tone="review" title="Read every number with this limit in mind">
              <p>{plainPhrase(metrics.limitation)}</p>
            </Callout>

            <FoldedTable summary={`Every measured figure, its data and its limit (${metrics.metrics.length})`}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">What was measured</th>
                    <th scope="col" className="table-num">Result</th>
                    <th scope="col">On what data</th>
                    <th scope="col">What it does not prove</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.metrics.map((metric) => (
                    <tr key={metric.id}>
                      <td>
                        <span className="strong-ink">{metric.name}</span>
                        <p className="meta mono">{metric.id}</p>
                      </td>
                      <td className="table-num">
                        <span className="strong-ink">{metric.value}</span>{" "}
                        <span className="meta">{metric.unit}</span>
                      </td>
                      <td className="meta">{plainPhrase(metric.dataset_scope)}</td>
                      <td className="meta">{plainPhrase(metric.limitation)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </FoldedTable>

            <Disclosure summary="How to reproduce these figures">
              <dl className="datalist">
                <DataRow label="Dataset">
                  <span className="mono">{metrics.dataset_id}</span>
                  <p className="meta">{metrics.label}</p>
                </DataRow>
                <DataRow label="Dataset fingerprint">
                  <Hash value={metrics.dataset_sha256} />
                </DataRow>
              </dl>
              <p className="meta">These commands are for your technical auditor.</p>
              <dl className="datalist">
                <DataRow label="Re-run command">
                  <span className="mono">
                    cd services/api &amp;&amp; REGOS_OFFLINE=1 uv run python
                    scripts/measure_prototype.py
                  </span>
                </DataRow>
                <DataRow label="Verification command">
                  <span className="mono">{metrics.metrics[0]?.test_command}</span>
                </DataRow>
              </dl>
            </Disclosure>
          </div>
        </Panel>
      )}

      {/* ---- Benchmark -------------------------------------------------- */}
      {benchmark && (
        <Panel
          title="Measured benchmark"
          description={plainPhrase(benchmark.label)}
        >
          <div className="stack">
            <StatRow>
              <Stat
                size="s"
                value={benchmark.passed}
                label="Cases correct"
                context={`of ${benchmark.cases.length}`}
                tone={benchmark.failed === 0 ? "ok" : "review"}
              />
              <Stat
                size="s"
                value={benchmark.failed}
                label="Cases not correct"
                tone={benchmark.failed > 0 ? "review" : undefined}
              />
              <Stat
                size="s"
                value={benchmark.operating_points.length}
                label="Settings compared"
              />
            </StatRow>
            <SegBar
              segments={[
                { label: "Correct", count: benchmark.passed, tone: "ok" },
                { label: "Not correct", count: benchmark.failed, tone: "review" },
              ]}
              ariaLabel={`${benchmark.passed} correct, ${benchmark.failed} not correct of ${benchmark.cases.length} cases`}
            />

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Setting</th>
                    <th scope="col" className="table-num">Answered</th>
                    <th scope="col" className="table-num">Wrong when answered</th>
                    <th scope="col" className="table-num">Handed to a human</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmark.operating_points.map((point) => (
                    <tr key={point.setting}>
                      <td>
                        <span className="strong-ink">{labelOf(point.setting)}</span>
                        <p className="meta">{plainPhrase(point.policy)}</p>
                      </td>
                      <td className="table-num">
                        <InlineBar
                          value={point.answered_pct}
                          max={100}
                          tone="accent"
                          label={`Answered, ${labelOf(point.setting)}`}
                          figure={`${point.answered_pct}%`}
                        />
                        <p className="meta">{point.answered} of {point.total}</p>
                      </td>
                      <td className="table-num">
                        <span className="strong-ink">{point.error_rate_on_answered}%</span>
                        <p className="meta">{point.incorrect_answers} wrong</p>
                      </td>
                      <td className="table-num">
                        <InlineBar
                          value={point.deferred_pct}
                          max={100}
                          tone="review"
                          label={`Handed to a human, ${labelOf(point.setting)}`}
                          figure={`${point.deferred_pct}%`}
                        />
                        <p className="meta">{point.deferred} of {point.total}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <FoldedTable summary={`Every benchmark case and its outcome (${benchmark.cases.length})`}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Case</th>
                    <th scope="col">Expected</th>
                    <th scope="col">Actual</th>
                    <th scope="col">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmark.cases.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="strong-ink">{item.name}</span>
                        <p className="meta mono">{item.source_span_id}</p>
                      </td>
                      <td className="meta">{plainValue(item.expected)}</td>
                      <td className="meta">{plainValue(item.actual)}</td>
                      <td><StateLabel value={item.outcome} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </FoldedTable>
          </div>
        </Panel>
      )}

      {/* ---- Audit events ---------------------------------------------- */}
      <RecordedEvents events={state.audit_events} />

      {/* ---- Reproduce this result -------------------------------------- */}
      {manifest && (
        <div className="audit-replay">
          <div className="audit-replay-body">
            <p className="micro">Reproduce this result</p>
            <code className="audit-replay-cmd">
              python scripts/replay_build.py · input fingerprint{" "}
              <Hash
                value={manifest.reproducibility.replay_input_sha256}
                label="reproduction input"
              />
            </code>
            <p className="meta">
              Anyone can run this script against the same input and must get an identical
              result, character for character.
            </p>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Recorded events — the hash-chained timeline, filterable by what acted.
 * ------------------------------------------------------------------------- */

const EVENT_FILTERS = [
  { id: "ALL", label: "All", test: () => true },
  { id: "DECISIONS", label: "Decisions", test: (t: string) => /READING|POLICY|APPROV|REVIEW|RECLASS/i.test(t) },
  { id: "CHECKS", label: "Checks", test: (t: string) => /TEST|BUILD|GATE|VERIF|CHECK/i.test(t) },
  { id: "AGENTS", label: "Assistants", test: (t: string) => /AGENT/i.test(t) },
  { id: "EXPORTS", label: "Downloads", test: (t: string) => /EXPORT|REPORT|DOWNLOAD|PACKET/i.test(t) },
] as const;

function eventTone(eventType: string): "ok" | "review" | "neutral" {
  if (/READING|POLICY|APPROV|REVIEW|RECLASS/i.test(eventType)) return "review";
  if (/VERIF/i.test(eventType)) return "ok";
  return "neutral";
}

/** How many of the most recent events stay open; the rest fold, none are dropped. */
const RECENT_EVENTS = 12;

function RecordedEvents({
  events,
}: {
  events: WorkspaceState["audit_events"];
}) {
  const [filter, setFilter] = useState<(typeof EVENT_FILTERS)[number]["id"]>("ALL");
  const active = EVENT_FILTERS.find((item) => item.id === filter) ?? EVENT_FILTERS[0];
  const visible = events.filter((event) => active.test(event.event_type));

  const toItem = (event: WorkspaceState["audit_events"][number]) => ({
    id: event.id,
    title: (
      <>
        {eventLabelOf(event.event_type)}
        <span className="mono timeline-id">{event.id}</span>
      </>
    ),
    meta: `${event.actor} · ${formatTimestamp(event.created_at)}`,
    tone: eventTone(event.event_type),
  });

  const split = Math.max(0, visible.length - RECENT_EVENTS);
  const earlier = visible.slice(0, split);
  const recent = visible.slice(split);

  return (
    <Panel
      title={
        <>
          Recorded events <span className="chip-count">{visible.length}</span>
        </>
      }
      aside={
        <div className="audit-filters" role="group" aria-label="Filter recorded events">
          {EVENT_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`audit-filter${filter === item.id ? " audit-filter--on" : ""}`}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      }
      tight
    >
      {visible.length === 0 ? (
        <Empty
          title="Nothing of this kind has been recorded yet"
          hint="Choose “All” to see every event."
          action={
            <button
              type="button"
              className="btn btn--secondary btn--small"
              onClick={() => setFilter("ALL")}
            >
              Show every event
            </button>
          }
        />
      ) : (
        <div className="stack-s">
          {earlier.length > 0 && (
            <Disclosure summary={`Everything recorded before these (${earlier.length})`}>
              <Timeline items={earlier.map(toItem)} />
            </Disclosure>
          )}
          <Timeline items={recent.map(toItem)} />
          {earlier.length > 0 && (
            <p className="micro">
              Showing the {recent.length} most recent of {visible.length} recorded events.
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}

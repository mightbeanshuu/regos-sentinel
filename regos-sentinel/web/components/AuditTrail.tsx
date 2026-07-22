"use client";

import { useEffect, useState } from "react";

import { regosApi } from "../lib/api";
import { actorOf, formatTimestamp } from "../lib/presentation";
import type {
  AiAssuranceReport,
  CorpusPackReport,
  MetricsReport,
  WorkspaceState,
} from "../lib/types";
import { Callout, DataRow, Disclosure, Hash, Panel, StateLabel, Tag } from "./ui";

const PIPELINE: Array<{ stage: string; plain: string }> = [
  { stage: "INGEST", plain: "Load the source and record its fingerprint" },
  { stage: "COVERAGE", plain: "Give every reviewed passage a disposition" },
  { stage: "COMPILE", plain: "Draft structured requirements from the passages" },
  { stage: "VERIFY", plain: "Run the deterministic checks" },
  { stage: "APPLY", plain: "Decide what applies to this entity" },
  { stage: "OPERATE", plain: "Create work and update evidence" },
  { stage: "DIFF", plain: "Record what changed against the previous version" },
  { stage: "PROVE", plain: "Seal the replayable build record" },
];

export function AuditTrail({ state }: { state: WorkspaceState }) {
  const build = state.builds.at(-1);
  const manifest = state.latest_manifest;
  const benchmark = state.latest_benchmark;
  const receiptData = state.model_run_receipt;

  const [packs, setPacks] = useState<CorpusPackReport[] | null>(null);
  const [assurance, setAssurance] = useState<AiAssuranceReport | null>(null);
  const [metrics, setMetrics] = useState<MetricsReport | null>(null);

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
    });
    return () => { live = false; };
  }, [state.builds.length, state.reviews.length, state.scenario_outcomes.length]);

  return (
    <div className="stack-l">
      <section className="stack-s">
        <h1 className="page-title">Audit trail</h1>
        <p className="lede">
          The technical record behind the review: what was read, how it was decided, which checks
          ran, and how to reproduce the result. This is the detail a reviewer or auditor needs and
          the guided workflow deliberately keeps out of the way.
        </p>
      </section>

      {/* ---- Sources and the gates they have cleared -------------------- */}
      <Panel
        title="Sources in this workspace"
        description="See which documents were reviewed, added for reference, or still need processing."
        tight
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">Status</th>
                <th scope="col">Reviewed passages</th>
                <th scope="col">Draft requirements</th>
                <th scope="col">Document fingerprint</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {state.corpus_packs.map((pack) => (
                <tr key={pack.id}>
                  <td>
                    <span className="strong-ink">{pack.title}</span>
                    <p className="meta">{pack.scope_note}</p>
                    <p className="meta">{pack.published_at} · {pack.version}</p>
                    <p className="meta">{pack.authority} · {pack.legal_state}</p>
                  </td>
                  <td><StateLabel value={pack.status} /></td>
                  <td>{pack.indexed_span_count}</td>
                  <td>{pack.compiled_candidate_count}</td>
                  <td><Hash value={pack.content_identity_sha256} /></td>
                  <td>
                    <a href={pack.source_url} target="_blank" rel="noreferrer">
                      Open official source ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ---- The eight gates, applied to every pack alike --------------- */}
      {packs && (
        <Panel
          title="What each source has been put through"
          description="The same eight gates apply to every source. A source that has only been registered shows seven untouched gates — that is the honest answer, and it is what makes the next source predictable rather than a rewrite."
        >
          <div className="stack">
            {packs.map((report) => (
              <div className="stack-s" key={report.pack.id}>
                <div className="passage-head">
                  <span className="sub-title">{report.pack.title}</span>
                  <span className="meta">
                    {report.gates_passed} of {report.gates_total} gates cleared
                  </span>
                </div>
                <p className="meta">Extraction scope: {report.pack.extraction_scope}</p>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Gate</th>
                        <th scope="col">What it checks</th>
                        <th scope="col">State</th>
                        <th scope="col">What was observed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.gates.map((gate) => (
                        <tr key={gate.id}>
                          <td>
                            <span className="strong-ink">{gate.name}</span>
                            <p className="meta mono">{gate.id}</p>
                          </td>
                          <td className="meta">{gate.plain}</td>
                          <td><StateLabel value={gate.status} /></td>
                          <td className="meta">
                            {gate.observed}
                            {gate.test_id && (
                              <p className="meta mono">{gate.test_id}</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ---- Source coverage ------------------------------------------ */}
      <Panel
        title="Source coverage"
        description="Every reviewed passage carries one recorded disposition. Counts describe this declared pack, not the whole FAQ or the wider SEBI corpus."
        tight
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Passage</th>
                <th scope="col">Disposition</th>
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
                    <td className="meta">{entry.rationale}</td>
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
        </div>
      </Panel>

      {/* ---- Requirement strength ------------------------------------- */}
      <Panel
        title="Requirement strength by statement"
        description="Each statement keeps the strength its own wording carries. Only required language can create mandatory work."
        tight
      >
        <div className="table-scroll">
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
                    {statement.operational_effect.replaceAll("_", " ").toLowerCase()}
                  </td>
                  <td><Tag value={statement.classification_provenance} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ---- Decisions ------------------------------------------------- */}
      {(state.reviewer_readings.length > 0 || state.reviews.length > 0) && (
        <Panel title="Decisions and reviewers">
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
        </Panel>
      )}

      {/* ---- Pipeline & tests ------------------------------------------ */}
      <Panel
        title="Checks executed"
        description="The eight-stage pipeline every build runs, and the result of each check in the latest run."
      >
        <div className="stack">
          <div className="table-scroll">
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
                    <td className="mono">{item.stage}</td>
                    <td className="meta">{item.plain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {build && (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Build</th>
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
            </div>
          )}
        </div>
      </Panel>

      {/* ---- Evidence -------------------------------------------------- */}
      <Panel title="Evidence history" tight>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Artifact</th>
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
                  <td className="meta">{item.kind}</td>
                  <td><StateLabel value={item.status} /></td>
                  <td className="meta">{formatTimestamp(item.collected_at)}</td>
                  <td className="meta">{item.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ---- Reproducibility ------------------------------------------- */}
      <Panel
        title="Reproducibility"
        description="Version identity, model receipt, and replay inputs. The same approved build state re-renders byte for byte."
      >
        <div className="stack">
          <dl className="datalist">
            <DataRow label="Schema version">{state.schema_version}</DataRow>
            <DataRow label="Ruleset version">{state.ruleset_version}</DataRow>
            <DataRow label="Source version">{state.source_version}</DataRow>
            <DataRow label="Model provider">{receiptData.provider}</DataRow>
            <DataRow label="Model">{receiptData.model_id}</DataRow>
            <DataRow label="Prompt version">{receiptData.prompt_version}</DataRow>
            <DataRow label="Served from cache">
              {receiptData.cache_hit ? "Yes — no live model call in this run" : "No"}
            </DataRow>
            <DataRow label="Model input hash"><Hash value={receiptData.input_sha256} /></DataRow>
            <DataRow label="Model output hash"><Hash value={receiptData.output_sha256} /></DataRow>
            <DataRow label="Extraction scope">{receiptData.extraction_scope}</DataRow>
            {manifest && (
              <>
                <DataRow label="Build record fingerprint">
                  <Hash value={manifest.manifest_sha256} />
                </DataRow>
                <DataRow label="Replay input hash">
                  <Hash value={manifest.reproducibility.replay_input_sha256} />
                </DataRow>
              </>
            )}
          </dl>

          {!manifest && (
            <Callout tone="review" title="No sealed build record yet">
              <p>
                A build record is sealed only after a build is approved. Complete the guided review
                to produce one.
              </p>
            </Callout>
          )}

          <div className="btn-row">
            <a
              className="btn btn--secondary"
              href="/api/v1/manifests/latest?download=true"
            >
              Export the audit-ready build record
            </a>
            <a
              className="btn btn--quiet"
              href="/api/v1/exports/oscal/assessment-results?download=true"
            >
              Export OSCAL 1.2.2 assessment results
            </a>
            <a
              className="btn btn--quiet"
              href="/api/v1/exports/oscal/validation"
              target="_blank"
              rel="noreferrer"
            >
              Open the NIST schema validation receipt ↗
            </a>
          </div>
        </div>
      </Panel>

      {/* ---- What the AI did, and what it was not allowed to do --------- */}
      {assurance && (
        <Panel
          title="Where the AI is, and where it is not"
          description={assurance.statement}
        >
          <div className="stack">
            <div className="table-scroll">
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
                    return (
                      <tr key={stage.id}>
                        <td><span className="strong-ink">{stage.name}</span></td>
                        <td>
                          <span className={`state state--${actor.tone}`}>
                            <span className="state-glyph" aria-hidden="true">{actor.glyph}</span>
                            <span>{actor.label}</span>
                          </span>
                        </td>
                        <td className="meta">{stage.plain}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="compare">
              <div className="compare-col">
                <p className="micro">The model proposes</p>
                <ul className="stack-s">
                  {assurance.split.ai_does.map((item) => (
                    <li key={item} className="meta">{item}</li>
                  ))}
                </ul>
              </div>
              <div className="compare-col">
                <p className="micro">Fixed rules enforce</p>
                <ul className="stack-s">
                  {assurance.split.deterministic_does.map((item) => (
                    <li key={item} className="meta">{item}</li>
                  ))}
                </ul>
              </div>
              <div className="compare-col compare-col--source">
                <p className="micro">A person decides</p>
                <ul className="stack-s">
                  {assurance.split.human_does.map((item) => (
                    <li key={item} className="meta">{item}</li>
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
                <p>{record.note}</p>
              </Callout>
            ))}

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Candidate</th>
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
                      <td className="meta">{outcome.resolution}</td>
                      <td>
                        {outcome.provenance_after_gates
                          ? <Tag value={outcome.provenance_after_gates} />
                          : <span className="meta">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="datalist">
              <DataRow label="Candidates the model returned">
                {assurance.candidate_count}
              </DataRow>
              <DataRow label="Fields accepted after the gates">
                {assurance.accepted_field_count} of{" "}
                {assurance.accepted_field_count + assurance.rejected_field_count}
              </DataRow>
              <DataRow label="Fields the gates refused or overrode">
                {assurance.rejected_field_count}
              </DataRow>
              <DataRow label="Model run">
                {assurance.receipt.provider} · {assurance.receipt.model_id} ·{" "}
                {assurance.receipt.cache_hit ? "served from the committed cache" : "live call"}
              </DataRow>
            </dl>

            <Callout tone="review" title="What this does not say">
              <p>{assurance.limitation}</p>
            </Callout>
          </div>
        </Panel>
      )}

      {/* ---- Measured, with the scope and the limit attached ------------ */}
      {metrics && (
        <Panel
          title="Measured on this prototype"
          description="Every figure is produced by a committed test or harness, with the dataset it came from and the thing it does not prove. Nothing here is an estimate."
          aside={<span className="meta">n={metrics.case_count}</span>}
        >
          <div className="stack">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">What was measured</th>
                    <th scope="col">Result</th>
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
                      <td>
                        <span className="strong-ink">{metric.value}</span>{" "}
                        <span className="meta">{metric.unit}</span>
                      </td>
                      <td className="meta">{metric.dataset_scope}</td>
                      <td className="meta">{metric.limitation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Disclosure summary="How to reproduce these figures">
              <dl className="datalist">
                <DataRow label="Dataset">
                  <span className="mono">{metrics.dataset_id}</span>
                  <p className="meta">{metrics.label}</p>
                </DataRow>
                <DataRow label="Dataset fingerprint">
                  <Hash value={metrics.dataset_sha256} />
                </DataRow>
                <DataRow label="Rerun">
                  <span className="mono">
                    cd services/api &amp;&amp; REGOS_OFFLINE=1 uv run python
                    scripts/measure_prototype.py
                  </span>
                </DataRow>
                <DataRow label="Verify">
                  <span className="mono">{metrics.metrics[0]?.test_command}</span>
                </DataRow>
              </dl>
            </Disclosure>

            <Callout tone="review" title="Read every number with this attached">
              <p>{metrics.limitation}</p>
            </Callout>
          </div>
        </Panel>
      )}

      {/* ---- Benchmark -------------------------------------------------- */}
      {benchmark && (
        <Panel
          title="Measured benchmark"
          description={benchmark.label}
          aside={<span className="meta">{benchmark.passed} of {benchmark.cases.length} cases correct</span>}
        >
          <div className="stack">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Setting</th>
                    <th scope="col">Answered</th>
                    <th scope="col">Wrong when answered</th>
                    <th scope="col">Handed to a human</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmark.operating_points.map((point) => (
                    <tr key={point.setting}>
                      <td>
                        <span className="strong-ink">{point.setting.toLowerCase()}</span>
                        <p className="meta">{point.policy}</p>
                      </td>
                      <td>{point.answered_pct}% <span className="meta">({point.answered}/{point.total})</span></td>
                      <td>{point.error_rate_on_answered}% <span className="meta">({point.incorrect_answers})</span></td>
                      <td>{point.deferred_pct}% <span className="meta">({point.deferred})</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-scroll">
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
                      <td className="meta">{item.expected}</td>
                      <td className="meta">{item.actual}</td>
                      <td><StateLabel value={item.outcome} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      )}

      {/* ---- Audit events ---------------------------------------------- */}
      <Panel title="Recorded events" tight>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Actor</th>
                <th scope="col">At</th>
              </tr>
            </thead>
            <tbody>
              {state.audit_events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <span className="mono">{event.id}</span>{" "}
                    {event.event_type.replaceAll("_", " ").toLowerCase()}
                  </td>
                  <td className="meta">{event.actor}</td>
                  <td className="meta">{formatTimestamp(event.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

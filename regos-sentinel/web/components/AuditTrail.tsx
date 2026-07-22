"use client";

import { formatTimestamp } from "../lib/presentation";
import type { WorkspaceState } from "../lib/types";
import { Callout, DataRow, Hash, Panel, StateLabel, Tag } from "./ui";

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

      {/* ---- Sources -------------------------------------------------- */}
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

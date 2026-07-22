"use client";

import { checkLabel, formatDate } from "../lib/presentation";
import type { LiveSourceVerificationReceipt, WorkspaceState } from "../lib/types";
import { Callout, Counts, Panel, StateLabel } from "./ui";

/**
 * The front page for the person who is accountable, not the person who built it.
 *
 * Everything here answers one of four questions a compliance officer actually asks:
 * where do I stand, what needs me, what is due, and can I prove it. The hash chains,
 * provenance vocabulary, gate names and agent traces are all still in the product —
 * one tab away, under plain labels — because an auditor needs them and a head of
 * compliance does not need them on a Tuesday morning.
 */
export function Dashboard({
  state,
  receipt,
  busy,
  onRunCheck,
  onOpenDecision,
  onDownloadReport,
  onVerifySource,
}: {
  state: WorkspaceState;
  receipt: LiveSourceVerificationReceipt | null;
  busy: boolean;
  onRunCheck: () => void;
  onOpenDecision: () => void;
  onDownloadReport: () => void;
  onVerifySource: () => void;
}) {
  const build = state.builds.at(-1);
  const waiting = build?.tests.filter((item) => item.status === "BLOCK") ?? [];
  const failed = build?.tests.filter((item) => item.status === "FAIL") ?? [];
  const passed = build?.tests.filter((item) => item.status === "PASS") ?? [];

  const active = state.obligations.filter((item) => item.status.startsWith("ACTIVE"));
  const datesBlocked = state.deadline_computations.filter((item) => !item.computable);
  const evidenceCurrent = state.evidence.filter((item) => item.status === "CURRENT");

  const notStarted = !build;

  return (
    <div className="stack-l">
      <section className="stack-s">
        <h1 className="page-title">Where your firm stands</h1>
        <p className="lede">
          {state.entity_profile.legal_name} · {state.entity_profile.entity_type}
          {state.entity_profile.is_qsb ? " · Qualified stockbroker" : ""}
        </p>
      </section>

      {/* ---- The one thing worth saying first ---------------------------- */}
      {notStarted ? (
        <Callout tone="accent" title="No check has been run yet.">
          <p>
            Run the check to see which SEBI requirements apply to this firm, what they
            oblige you to do, and where a date cannot be worked out from the wording.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" disabled={busy} onClick={onRunCheck}>
              Run the check
            </button>
          </div>
        </Callout>
      ) : failed.length > 0 ? (
        <Callout tone="fail" title={`${failed.length} check did not pass.`}>
          <p>Something is wrong with the underlying data rather than with your compliance.</p>
        </Callout>
      ) : waiting.length > 0 ? (
        <Callout tone="review" title="Some decisions are yours to make.">
          <p>
            The system has gone as far as the SEBI wording allows. What is left needs a
            person, because the text does not answer it — and inventing an answer is the
            one thing this product will not do.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" disabled={busy} onClick={onOpenDecision}>
              Make the decision
            </button>
            <button type="button" className="btn btn--quiet" disabled={busy} onClick={onRunCheck}>
              Run the check again
            </button>
          </div>
        </Callout>
      ) : (
        <Callout tone="ok" title="Everything that can be settled is settled.">
          <p>All checks passed and the record is ready to hand to an auditor.</p>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn--primary"
              disabled={busy}
              onClick={onDownloadReport}
            >
              Download the report
            </button>
          </div>
        </Callout>
      )}

      {/* ---- Five numbers, no more -------------------------------------- */}
      <Counts
        glass
        items={[
          { value: active.length, label: "Requirements that apply" },
          { value: waiting.length, label: "Waiting on you" },
          {
            value: `${state.deadline_computations.length - datesBlocked.length}/${
              state.deadline_computations.length
            }`,
            label: "Dates that can be worked out",
          },
          {
            value: `${evidenceCurrent.length}/${state.evidence.length}`,
            label: "Evidence up to date",
          },
          {
            value: receipt ? <StateLabel value={receipt.status} /> : "Not checked",
            label: "SEBI source",
          },
        ]}
      />

      {/* ---- What needs a person ---------------------------------------- */}
      {waiting.length > 0 && (
        <Panel
          title="What needs you"
          description="Each of these is a question the SEBI text does not answer. A person has to decide, and the decision is recorded with their name and reason."
        >
          <ul className="stack-s">
            {waiting.map((item) => (
              <li key={item.id} className="outcome">
                <p className="outcome-title">
                  <StateLabel value={item.status} />
                  <span className="strong-ink"> {checkLabel(item.id, item.name)}</span>
                </p>
                <div className="outcome-body">
                  <p>{item.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* ---- Deadlines --------------------------------------------------- */}
      {state.deadline_computations.length > 0 && (
        <Panel
          title="Your deadlines"
          description="Dates worked out from the SEBI wording. Where the wording does not say when a clock starts, no date is shown — a guess in this column would be worse than a gap."
          tight
        >
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">What you have to do</th>
                  <th scope="col">How long you have</th>
                  <th scope="col">Due</th>
                </tr>
              </thead>
              <tbody>
                {state.deadline_computations.map((item) => {
                  const obligation = state.obligations.find(
                    (candidate) => candidate.id === item.obligation_id,
                  );
                  return (
                    <tr key={item.id}>
                      <td>
                        {obligation
                          ? `${obligation.action} ${obligation.object}`
                          : item.obligation_id}
                      </td>
                      <td>{item.duration_label}</td>
                      <td>
                        {item.computable ? (
                          <strong className="strong-ink">{formatDate(item.due_date)}</strong>
                        ) : (
                          <>
                            <StateLabel value="BLOCK" />
                            <p className="meta">
                              SEBI states the period but not what starts it, so no date can
                              be produced until you set your firm&apos;s policy.
                            </p>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* ---- Evidence ---------------------------------------------------- */}
      <Panel
        title="Evidence you would be asked for"
        description="The documents that back up the controls above."
        tight
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Document</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.evidence.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td><StateLabel value={item.status} showHint /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ---- The source, and proof it has not moved ---------------------- */}
      <Panel
        title="The SEBI document this is built from"
        description="Everything above traces back to published SEBI text. You can check right now that the published document still says what we read."
        aside={
          <button
            type="button"
            className="btn btn--secondary btn--small"
            disabled={busy}
            onClick={onVerifySource}
          >
            Check it against sebi.gov.in
          </button>
        }
      >
        <ul className="stack-s">
          {state.documents.map((document) => (
            <li key={document.id}>
              <p><strong className="strong-ink">{document.title}</strong></p>
              <p className="meta">
                {document.authority} · published {formatDate(document.published_at)} ·{" "}
                <a href={document.source_url} target="_blank" rel="noreferrer">
                  open the original ↗
                </a>
              </p>
            </li>
          ))}
        </ul>
        {receipt && (
          <Callout tone={receipt.hash_matches_expected ? "ok" : "review"}>
            <p>{receipt.note}</p>
          </Callout>
        )}
      </Panel>

      {/* ---- Everything else, one click away ----------------------------- */}
      {build && (
        <p className="meta">
          {passed.length} of {build.tests.length} checks passed.{" "}
          The full technical record — every check, every source quotation, and the
          reasoning behind each figure — is under <strong>Full record</strong>.
        </p>
      )}
    </div>
  );
}

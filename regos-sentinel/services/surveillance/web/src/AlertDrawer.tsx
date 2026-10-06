import { useEffect, useState } from "react";
import { Alert, ApiProblem, Disposition, RULE_LABEL, api } from "./api";

const DISPOSITIONS: { value: Disposition; label: string }[] = [
  { value: "NoAdverseFinding", label: "No adverse finding" },
  { value: "ReportedToExchange", label: "Reported to exchange" },
  { value: "ClientRestricted", label: "Client restricted" },
];

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

export function AlertDrawer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [alert, setAlert] = useState<Alert | null>(null);
  const [reviewer, setReviewer] = useState(() => localStorage.getItem("reviewer") ?? "");
  const [disposition, setDisposition] = useState<Disposition>("NoAdverseFinding");
  const [reason, setReason] = useState("");
  const [delayReason, setDelayReason] = useState("");
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.alert(id).then(setAlert).catch((e) => setProblem(e));
  useEffect(() => {
    setProblem(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function act(fn: () => Promise<Alert>) {
    setBusy(true);
    setProblem(null);
    try {
      localStorage.setItem("reviewer", reviewer);
      setAlert(await fn());
      onChanged();
    } catch (e) {
      setProblem(e as ApiProblem);
      if ((e as ApiProblem).status === 409) await load(); // someone else moved it: show the current state
    } finally {
      setBusy(false);
    }
  }

  if (!alert) return <aside className="drawer">{problem ? <p className="problem">{problem.message}</p> : <p>Loading…</p>}</aside>;
  const open = alert.status !== "Closed";

  return (
    <aside className="drawer" aria-label="Alert detail">
      <header className="drawer-head">
        <div>
          <span className={`sev sev-${alert.severity.toLowerCase()}`}>{alert.severity}</span>
          <h2>{RULE_LABEL[alert.ruleId] ?? alert.ruleId} · {alert.symbol}</h2>
        </div>
        <button className="ghost" onClick={onClose} aria-label="Close panel">✕</button>
      </header>

      <p className="summary">{alert.summary}</p>

      <dl className="facts">
        <dt>Clients</dt><dd>{alert.clientIds.join(", ")}</dd>
        <dt>Occurrences</dt><dd>{alert.occurrences}</dd>
        <dt>First seen</dt><dd>{fmt(alert.firstObservedAt)}</dd>
        <dt>Generated</dt><dd>{fmt(alert.generatedAt)}</dd>
        <dt>Due</dt>
        <dd className={alert.breached ? "breach" : ""}>
          {alert.dueAt ? `${fmt(alert.dueAt)}${open ? (alert.breached ? " — overdue" : ` — ${alert.daysToDue} days left`) : ""}` : "No deadline in policy"}
        </dd>
        <dt>Evidence</dt><dd className="mono">{alert.evidenceEventIds.join(" · ")}</dd>
      </dl>

      <details className="cite">
        <summary>Why this rule exists</summary>
        <p>{alert.citation}</p>
      </details>

      {open && (
        <section className="actions">
          <label>
            Reviewer
            <input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="your.name" />
          </label>
          {alert.status === "Open" && (
            <button disabled={busy || !reviewer.trim()} onClick={() => act(() => api.review(alert.id, reviewer, alert.version))}>
              Take into review
            </button>
          )}
          <label>
            Disposition
            <select value={disposition} onChange={(e) => setDisposition(e.target.value as Disposition)}>
              {DISPOSITIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </label>
          <label>
            Reason (required)
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What you checked and what you found" />
          </label>
          {alert.breached && (
            <label>
              Reason for the delay (required past the deadline)
              <textarea rows={2} value={delayReason} onChange={(e) => setDelayReason(e.target.value)} />
            </label>
          )}
          <button
            className="primary"
            disabled={busy || !reviewer.trim() || !reason.trim()}
            onClick={() => act(() => api.close(alert.id, { reviewer, disposition, reason, delayReason: delayReason || undefined, version: alert.version }))}
          >
            Close alert
          </button>
        </section>
      )}

      {!open && (
        <section className="closed-box">
          <strong>{alert.disposition}</strong> by {alert.closedBy} on {fmt(alert.closedAt)}
          <p>{alert.closingReason}</p>
          {alert.delayReason && <p className="breach">Delay: {alert.delayReason}</p>}
        </section>
      )}

      {problem && (
        <div className="problem" role="alert">
          <strong>{problem.title}</strong>
          {problem.detail && <p>{problem.detail}</p>}
          {problem.citation && <p className="mono small">{problem.citation}</p>}
        </div>
      )}

      <h3>Audit trail</h3>
      <ol className="trail">
        {(alert.transitions ?? []).map((t, i) => (
          <li key={i}>
            <span className="mono small">{fmt(t.at)}</span> <strong>{t.to}</strong> · {t.actor}
            <div className="small">{t.note}</div>
          </li>
        ))}
      </ol>
    </aside>
  );
}

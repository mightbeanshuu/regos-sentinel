import { useCallback, useEffect, useState } from "react";
import { AgingReport, Alert, AlertStatus, Health, RULE_LABEL, api } from "./api";
import { AlertDrawer } from "./AlertDrawer";

type Tab = { key: string; label: string; status?: AlertStatus; breached?: boolean };
const TABS: Tab[] = [
  { key: "open", label: "Open", status: "Open" },
  { key: "review", label: "Under review", status: "UnderReview" },
  { key: "breached", label: "Overdue", breached: true },
  { key: "closed", label: "Closed", status: "Closed" },
  { key: "all", label: "All" },
];

function due(a: Alert) {
  if (a.status === "Closed") return <span className="muted">closed</span>;
  if (a.daysToDue === null) return <span className="muted">no deadline</span>;
  if (a.breached) return <span className="breach">overdue {-a.daysToDue}d</span>;
  return <span className={a.daysToDue <= 7 ? "warn" : ""}>{a.daysToDue}d left</span>;
}

export default function App() {
  const [tab, setTab] = useState<Tab>(TABS[0]);
  const [rule, setRule] = useState("");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [aging, setAging] = useState<AgingReport | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [selected, setSelectedState] = useState<string | null>(() => new URLSearchParams(location.search).get("alert"));
  const setSelected = (id: string | null) => {
    setSelectedState(id);
    const url = new URL(location.href);
    if (id) url.searchParams.set("alert", id); else url.searchParams.delete("alert");
    history.replaceState(null, "", url); // a reviewer can paste the link to a colleague
  };
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [page, report, h] = await Promise.all([
        api.alerts({ status: tab.status, breached: tab.breached, rule: rule || undefined }),
        api.aging(),
        api.health(),
      ]);
      setAlerts(page.items);
      setTotal(page.total);
      setAging(report);
      setHealth(h);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tab, rule]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <div className="shell">
      <header className="top">
        <div>
          <h1>Surveillance Desk</h1>
          <p className="muted">RegOS · trade alerts under NSE/SURV/48818 and the NSE/INVG/65921 guidance note</p>
        </div>
        {health && (
          <div className="stats">
            <span>{health.engine.eventsProcessed.toLocaleString()} events</span>
            <span>{health.engine.knownClients.toLocaleString()} KYC profiles</span>
            <span>{health.kafka ? `Kafka · ${health.kafka.topic}` : "REST ingest"}</span>
            <span>{health.database}</span>
          </div>
        )}
      </header>

      {health && <div className="policy-banner">Thresholds: {health.policyApprovedBy}</div>}

      {aging && (
        <section className="aging" aria-label="Alert ageing">
          {aging.rows.length === 0 && <p className="muted">No open alerts.</p>}
          {aging.rows.map((r) => (
            <div key={r.ruleId} className="aging-card">
              <h3>{RULE_LABEL[r.ruleId] ?? r.ruleId}</h3>
              <div className="buckets">
                <span className={r.breached ? "breach" : ""}><b>{r.breached}</b> overdue</span>
                <span className={r.dueWithin7Days ? "warn" : ""}><b>{r.dueWithin7Days}</b> ≤ 7d</span>
                <span><b>{r.dueIn8To30Days}</b> 8–30d</span>
                <span><b>{r.dueLater}</b> later</span>
              </div>
            </div>
          ))}
          <p className="muted small">computed by {aging.computedBy}</p>
        </section>
      )}

      <nav className="toolbar">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={t.key === tab.key} className={t.key === tab.key ? "tab on" : "tab"} onClick={() => setTab(t)}>
              {t.label}
            </button>
          ))}
        </div>
        <select value={rule} onChange={(e) => setRule(e.target.value)} aria-label="Filter by rule">
          <option value="">All rules</option>
          {Object.entries(RULE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </nav>

      {error && <div className="problem">API unreachable: {error}</div>}

      <main className={selected ? "with-drawer" : ""}>
        <table className="grid">
          <thead>
            <tr><th>Sev</th><th>Rule</th><th>Symbol</th><th>Clients</th><th>×</th><th>Due</th><th>What happened</th></tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} className={a.id === selected ? "sel" : ""} onClick={() => setSelected(a.id)}>
                <td><span className={`dot sev-${a.severity.toLowerCase()}`} title={a.severity} /></td>
                <td>{RULE_LABEL[a.ruleId] ?? a.ruleId}</td>
                <td className="mono">{a.symbol}</td>
                <td className="mono small">{a.clientIds.join(", ")}</td>
                <td>{a.occurrences}</td>
                <td>{due(a)}</td>
                <td className="clip">{a.summary}</td>
              </tr>
            ))}
            {alerts.length === 0 && <tr><td colSpan={7} className="muted empty">Nothing here.</td></tr>}
          </tbody>
        </table>
        <p className="muted small">{total.toLocaleString()} alert(s)</p>
        {selected && <AlertDrawer id={selected} onClose={() => setSelected(null)} onChanged={refresh} />}
      </main>
    </div>
  );
}

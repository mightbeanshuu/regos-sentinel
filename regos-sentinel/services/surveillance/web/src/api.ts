export type Severity = "Low" | "Medium" | "High";
export type AlertStatus = "Open" | "UnderReview" | "Closed";
export type Disposition = "NoAdverseFinding" | "ReportedToExchange" | "ClientRestricted";

export interface Transition {
  from: AlertStatus | null;
  to: AlertStatus;
  actor: string;
  note: string;
  at: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  symbol: string;
  severity: Severity;
  status: AlertStatus;
  summary: string;
  citation: string;
  clientIds: string[];
  evidenceEventIds: string[];
  occurrences: number;
  firstObservedAt: string;
  lastObservedAt: string;
  generatedAt: string;
  dueAt: string | null;
  daysToDue: number | null;
  breached: boolean;
  closedAt: string | null;
  disposition: Disposition | null;
  closedBy: string | null;
  closingReason: string | null;
  delayReason: string | null;
  version: number;
  transitions: Transition[] | null;
}

export interface Paged<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

export interface AgingRow {
  ruleId: string;
  openAlerts: number;
  noDeadline: number;
  breached: number;
  dueWithin7Days: number;
  dueIn8To30Days: number;
  dueLater: number;
  nextDueAt: string | null;
}

export interface AgingReport {
  asOf: string;
  computedBy: string;
  rows: AgingRow[];
}

export interface Health {
  status: string;
  database: string;
  policyApprovedBy: string;
  kafka: { topic: string; consumed: number | null; deadLettered: number | null } | null;
  engine: { eventsProcessed: number; residentTrades: number; knownClients: number };
}

/** An RFC 7807 problem from the API; `citation` names the paragraph behind a refused action. */
export class ApiProblem extends Error {
  constructor(public status: number, public title: string, public detail?: string, public citation?: string) {
    super(detail ?? title);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...init });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiProblem(res.status, body?.title ?? res.statusText, body?.detail, body?.citation);
  return body as T;
}

export const api = {
  alerts: (q: { status?: AlertStatus; rule?: string; breached?: boolean }) => {
    const p = new URLSearchParams({ pageSize: "200" });
    if (q.status) p.set("status", q.status);
    if (q.rule) p.set("rule", q.rule);
    if (q.breached) p.set("breached", "true");
    return call<Paged<Alert>>(`/api/alerts?${p}`);
  },
  alert: (id: string) => call<Alert>(`/api/alerts/${id}`),
  review: (id: string, reviewer: string, version: number) =>
    call<Alert>(`/api/alerts/${id}/review`, { method: "POST", body: JSON.stringify({ reviewer, version }) }),
  close: (id: string, body: { reviewer: string; disposition: Disposition; reason: string; delayReason?: string; version: number }) =>
    call<Alert>(`/api/alerts/${id}/close`, { method: "POST", body: JSON.stringify(body) }),
  aging: () => call<AgingReport>("/api/reports/aging"),
  health: () => call<Health>("/health"),
};

export const RULE_LABEL: Record<string, string> = {
  WASH_TRADE: "Wash / linked trade",
  ORDER_SPOOFING: "Order spoofing",
  FRONT_RUNNING: "Front running",
};

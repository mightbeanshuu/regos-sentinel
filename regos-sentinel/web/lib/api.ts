import type {
  AgentCatalogueEntry,
  AgentChallenges,
  AgentId,
  AiAssuranceReport,
  CorpusPackReport,
  DocumentLimits,
  LiveSourceVerificationReceipt,
  MetricsReport,
  PassageClass,
  PlannerKind,
  PlannerStatus,
  ScenarioCatalogue,
  ScenarioId,
  UploadedDocument,
  WorkspaceState,
} from "./types";

interface ApiErrorPayload {
  detail?: string | { message?: string };
}

/** Exported because the live console opens its own EventSource against this origin. */
export const apiOrigin = (process.env.NEXT_PUBLIC_REGOS_API_ORIGIN ?? "").replace(/\/$/, "");
const sessionStorageKey = "regos.session.v1";

function sessionToken(): string | null {
  return typeof window === "undefined" ? null : window.localStorage.getItem(sessionStorageKey);
}

function persistSession(response: Response): void {
  const token = response.headers.get("X-RegOS-Session");
  if (token && typeof window !== "undefined") window.localStorage.setItem(sessionStorageKey, token);
}

function errorMessage(payload: ApiErrorPayload, status: number): string {
  if (typeof payload.detail === "string") return payload.detail;
  if (payload.detail?.message) return payload.detail.message;
  return `Request failed with status ${status}`;
}

function requestHeaders(init?: RequestInit): HeadersInit {
  const token = sessionToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "X-RegOS-Session": token } : {}),
    ...init?.headers,
  };
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiOrigin}/api/v1${path}`, {
    ...init,
    headers: requestHeaders(init),
  });
  persistSession(response);
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throw new Error(errorMessage(payload, response.status));
  }
  return (await response.json()) as T;
}

const request = (path: string, init?: RequestInit) => requestJson<WorkspaceState>(path, init);

async function downloadPdf(path: string, filename: string): Promise<void> {
  const response = await fetch(`${apiOrigin}/api/v1${path}`, {
    headers: requestHeaders(),
  });
  persistSession(response);
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throw new Error(errorMessage(payload, response.status));
  }
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const regosApi = {
  workspace: () => request("/workspace", { cache: "no-store" }),
  verifyLiveSource: () => requestJson<LiveSourceVerificationReceipt>(
    "/sources/verify-live",
    { method: "POST" },
  ),
  runBuild: () => request("/builds/run", { method: "POST" }),
  reset: () => request("/demo/reset", { method: "POST" }),
  approveQ17: (body: {
    reviewer_name: string;
    reviewer_role: string;
    reason: string;
    trigger_policy: string;
    trigger_date: string;
    agrees_with_system_suggestion: boolean;
  }) =>
    request("/reviews/q17/approve", { method: "POST", body: JSON.stringify(body) }),
  commitQ17Reading: (body: {
    reviewer_name: string;
    reviewer_role: string;
    independent_interpretation: string;
    trigger_policy: string;
  }) =>
    request("/reviews/q17/reading", { method: "POST", body: JSON.stringify(body) }),
  resolveScopedReferences: () => request("/references/scoped/resolve", { method: "POST" }),
  setQsb: (isQsb: boolean, reviewerName: string) =>
    request("/entity/profile", {
      method: "PATCH",
      body: JSON.stringify({ is_qsb: isQsb, reviewer_name: reviewerName }),
    }),
  setApplicabilityScenario: (
    hasSecondRegistration: boolean,
    hasDormantLicense: boolean,
    reviewerName: string,
  ) =>
    request("/applicability/scenario", {
      method: "PATCH",
      body: JSON.stringify({
        has_second_registration: hasSecondRegistration,
        has_dormant_license: hasDormantLicense,
        reviewer_name: reviewerName,
      }),
    }),
  runBenchmark: () => request("/benchmarks/run", { method: "POST" }),

  // ---- Demonstration scenarios A–D -----------------------------------
  scenarios: () => requestJson<ScenarioCatalogue>("/scenarios", { cache: "no-store" }),
  runScenario: (id: ScenarioId) => request(`/scenarios/${id}/run`, { method: "POST" }),

  // ---- Agents ---------------------------------------------------------
  // The planner is a request, not a guarantee. The response carries the plan
  // source that actually ran, which is what the interface must display.
  agentCatalogue: () => requestJson<AgentCatalogueEntry[]>("/agents", { cache: "no-store" }),
  plannerStatus: () => requestJson<PlannerStatus>("/agents/planner", { cache: "no-store" }),
  agentChallenges: () => requestJson<AgentChallenges>("/agents/challenges", { cache: "no-store" }),
  runAgent: (id: AgentId, planner: PlannerKind) =>
    request(`/agents/${id}/run?planner=${planner}`, { method: "POST" }),
  runAllAgents: (planner: PlannerKind) =>
    request(`/agents/run-all?planner=${planner}`, { method: "POST" }),

  // ---- Technical detail for the audit trail ---------------------------
  corpusPacks: () => requestJson<CorpusPackReport[]>("/corpus/packs", { cache: "no-store" }),
  assurance: () => requestJson<AiAssuranceReport>("/assurance", { cache: "no-store" }),
  metrics: () => requestJson<MetricsReport>("/metrics", { cache: "no-store" }),

  // ---- Review your document ------------------------------------------
  documentLimits: () => requestJson<DocumentLimits>("/documents/limits", { cache: "no-store" }),
  listDocuments: () => requestJson<UploadedDocument[]>("/documents", { cache: "no-store" }),
  uploadDocument: async (file: File, authority: string): Promise<UploadedDocument> => {
    const query = new URLSearchParams({ filename: file.name, authority });
    const token = sessionToken();
    const response = await fetch(`${apiOrigin}/api/v1/documents?${query.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/pdf",
        ...(token ? { "X-RegOS-Session": token } : {}),
      },
      body: file,
    });
    persistSession(response);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
      throw new Error(errorMessage(payload, response.status));
    }
    return (await response.json()) as UploadedDocument;
  },
  deleteDocument: async (documentId: string): Promise<void> => {
    const response = await fetch(`${apiOrigin}/api/v1/documents/${documentId}`, {
      method: "DELETE",
      headers: requestHeaders(),
    });
    persistSession(response);
    if (!response.ok && response.status !== 204) {
      const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
      throw new Error(errorMessage(payload, response.status));
    }
  },
  reviewPassage: (
    documentId: string,
    passageId: string,
    body: {
      classification: PassageClass;
      reviewer_name: string;
      reviewer_role: string;
      rationale: string;
    },
  ) =>
    requestJson<UploadedDocument>(`/documents/${documentId}/passages/${passageId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  approveDocumentRequirement: (
    documentId: string,
    body: {
      passage_id: string;
      actor: string;
      action: string;
      obligation_object: string;
      duration_value?: number | null;
      duration_unit?: string | null;
      trigger?: string | null;
      reviewer_name: string;
      reviewer_role: string;
      reason: string;
    },
  ) =>
    requestJson<UploadedDocument>(`/documents/${documentId}/requirements`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  downloadReviewPacket: (documentId: string) => downloadPdf(
    `/documents/${documentId}/review-packet.pdf`,
    `${documentId.toLowerCase()}-draft-review-packet.pdf`,
  ),
  downloadDocumentReport: (documentId: string) => downloadPdf(
    `/documents/${documentId}/report.pdf`,
    `${documentId.toLowerCase()}-compliance-build-report.pdf`,
  ),
  downloadBuildReport: (buildId: string) => downloadPdf(
    `/builds/${buildId}/report.pdf`,
    `${buildId.toLowerCase()}-compliance-build-report.pdf`,
  ),
  downloadBeforeAfter: (buildId: string) => downloadPdf(
    `/builds/${buildId}/before-after.pdf`,
    `${buildId.toLowerCase()}-before-after.pdf`,
  ),
};

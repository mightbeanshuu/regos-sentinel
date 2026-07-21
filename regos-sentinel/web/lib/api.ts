import type { LiveSourceVerificationReceipt, WorkspaceState } from "./types";

interface ApiErrorPayload {
  detail?: string | { message?: string };
}

const apiOrigin = (process.env.NEXT_PUBLIC_REGOS_API_ORIGIN ?? "").replace(/\/$/, "");
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
    credentials: "include",
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
    credentials: "include",
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
  downloadBuildReport: (buildId: string) => downloadPdf(
    `/builds/${buildId}/report.pdf`,
    `${buildId.toLowerCase()}-compliance-build-report.pdf`,
  ),
  downloadBeforeAfter: (buildId: string) => downloadPdf(
    `/builds/${buildId}/before-after.pdf`,
    `${buildId.toLowerCase()}-before-after.pdf`,
  ),
};

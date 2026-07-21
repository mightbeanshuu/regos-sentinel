import type { WorkspaceState } from "./types";

interface ApiErrorPayload {
  detail?: string;
}

async function request(path: string, init?: RequestInit): Promise<WorkspaceState> {
  const response = await fetch(`/api/regos${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throw new Error(payload.detail ?? `Request failed with status ${response.status}`);
  }
  return (await response.json()) as WorkspaceState;
}

export const regosApi = {
  workspace: () => request("/workspace", { cache: "no-store" }),
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
};

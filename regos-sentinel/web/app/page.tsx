"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Agents } from "../components/Agents";
import { AuditTrail } from "../components/AuditTrail";
import { Dashboard } from "../components/Dashboard";
import { DocumentReview } from "../components/DocumentReview";
import { GuidedReview } from "../components/GuidedReview";
import { ScenarioCase, ScenarioSelector } from "../components/Scenarios";
import { regosApi } from "../lib/api";
import type {
  DocumentLimits,
  LiveSourceVerificationReceipt,
  ScenarioCatalogue,
  ScenarioId,
  UploadedDocument,
  WorkspaceState,
} from "../lib/types";

/**
 * Ordered by who is asking. The dashboard answers "where do we stand" and is where
 * anyone accountable lands; the working tabs come next; the technical record is last
 * and is named for what it is rather than for how it is built.
 */
const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "guided", label: "Review a requirement" },
  { id: "document", label: "Your own document" },
  { id: "agents", label: "AI agents" },
  { id: "audit", label: "Full record" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [limits, setLimits] = useState<DocumentLimits | null>(null);
  const [receipt, setReceipt] = useState<LiveSourceVerificationReceipt | null>(null);
  const [catalogue, setCatalogue] = useState<ScenarioCatalogue | null>(null);
  const [scenario, setScenario] = useState<ScenarioId>("A_MISSING_TRIGGER");
  const [tab, setTab] = useState<TabId>("dashboard");
  const [busy, setBusy] = useState(false);
  const [sourceBusy, setSourceBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const load = useCallback(async () => {
    try {
      const [workspace, documentList, documentLimits, scenarioCatalogue] = await Promise.all([
        regosApi.workspace(),
        regosApi.listDocuments().catch(() => [] as UploadedDocument[]),
        regosApi.documentLimits().catch(() => null),
        regosApi.scenarios().catch(() => null),
      ]);
      setState(workspace);
      setDocuments(documentList);
      setLimits(documentLimits);
      setCatalogue(scenarioCatalogue);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to reach the RegOS API.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const act = useCallback(
    async (operation: () => Promise<WorkspaceState>, focusTarget?: string) => {
      setBusy(true);
      setError(null);
      try {
        setState(await operation());
        setCatalogue(await regosApi.scenarios().catch(() => null));
        if (focusTarget) {
          window.requestAnimationFrame(() => {
            document.getElementById(focusTarget)?.scrollIntoView({
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth",
              block: "start",
            });
          });
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "That action could not be completed.");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const verifySource = useCallback(async () => {
    setSourceBusy(true);
    setSourceError(null);
    try {
      setReceipt(await regosApi.verifyLiveSource());
    } catch (caught) {
      setSourceError(
        caught instanceof Error ? caught.message : "Live source verification is unavailable.",
      );
    } finally {
      setSourceBusy(false);
    }
  }, []);

  const download = useCallback(async (operation: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await operation();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That download failed.");
    } finally {
      setBusy(false);
    }
  }, []);

  const restart = useCallback(async () => {
    setReceipt(null);
    setSourceError(null);
    setDocumentError(null);
    setDocuments([]);
    await act(regosApi.reset, "top");
  }, [act]);

  const activeScenario = catalogue?.scenarios.find((item) => item.id === scenario) ?? null;
  const activeOutcome =
    catalogue?.outcomes.find((item) => item.scenario_id === scenario) ?? null;

  /** Roving arrow-key navigation across the tablist, per WAI-ARIA tabs. */
  const onTabKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    const last = TABS.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }, []);

  if (!state) {
    return (
      <main className="boot">
        <p className="micro">RegOS Sentinel</p>
        <h1 className="page-title">
          {error ? "The API is not reachable" : "Loading the demo workspace…"}
        </h1>
        <p className="lede">{error ?? "Connecting to the prototype state."}</p>
        {error && (
          <button type="button" className="btn btn--primary" onClick={() => void load()}>
            Try again
          </button>
        )}
      </main>
    );
  }

  return (
    <>
      <header className="app-header" id="top">
        <div className="app-header-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="rg-shield" x1="4" y1="3" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5B8FE0" />
                    <stop offset="1" stopColor="#1D3F76" />
                  </linearGradient>
                  <linearGradient id="rg-sheen" x1="12" y1="2" x2="12" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fff" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#fff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2.2 4.2 5.1v6c0 4.7 3.3 9 7.8 10.2 4.5-1.2 7.8-5.5 7.8-10.2v-6L12 2.2Z"
                  fill="url(#rg-shield)"
                />
                <path
                  d="M12 2.2 4.2 5.1v6c0 4.7 3.3 9 7.8 10.2 4.5-1.2 7.8-5.5 7.8-10.2v-6L12 2.2Z"
                  stroke="#fff"
                  strokeOpacity="0.35"
                  strokeWidth="0.8"
                />
                <path
                  d="M12 3.4 5.3 5.9v5.1c0 .5 0 1 .1 1.5h13.2c.1-.5.1-1 .1-1.5V5.9L12 3.4Z"
                  fill="url(#rg-sheen)"
                  opacity="0.5"
                />
                <path
                  d="m8.4 12.1 2.5 2.5 4.7-5"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="brand-text">
              <span className="brand-name">RegOS Sentinel</span>
            </span>
          </div>

          <p className="env-line">
            <span>Demo workspace</span>
            <span className="dot" aria-hidden="true">·</span>
            <span>Public SEBI source</span>
            <span className="dot" aria-hidden="true">·</span>
            <span className="synthetic">Synthetic broker data</span>
          </p>

          <div className="header-actions">
            <button
              type="button"
              className="btn btn--quiet btn--small"
              disabled={busy || sourceBusy}
              onClick={() => void restart()}
            >
              Restart demo
            </button>
          </div>
        </div>
      </header>

      <nav className="tabs" aria-label="Main">
        <div className="tablist" role="tablist">
          {TABS.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => { tabRefs.current[index] = node; }}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              className="tab"
              aria-selected={tab === item.id}
              aria-controls={`panel-${item.id}`}
              tabIndex={tab === item.id ? 0 : -1}
              onClick={() => setTab(item.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="page">
        {error && (
          <p className="banner" role="alert" style={{ marginBottom: "24px" }}>
            <span aria-hidden="true">✕</span>
            {error}
          </p>
        )}

        <div
          role="tabpanel"
          id="panel-dashboard"
          aria-labelledby="tab-dashboard"
          hidden={tab !== "dashboard"}
        >
          {tab === "dashboard" && (
            <Dashboard
              state={state}
              receipt={receipt}
              busy={busy || sourceBusy}
              onRunCheck={() => void act(regosApi.runBuild, "top")}
              onOpenDecision={() => setTab("guided")}
              onVerifySource={verifySource}
              onDownloadReport={() =>
                void download(() => regosApi.downloadBuildReport(state.builds.at(-1)!.id))}
              onRefresh={() => void load()}
            />
          )}
        </div>

        <div
          role="tabpanel"
          id="panel-guided"
          aria-labelledby="tab-guided"
          hidden={tab !== "guided"}
        >
          {tab === "guided" && catalogue && (
            <div style={{ marginBottom: "28px" }}>
              <ScenarioSelector
                catalogue={catalogue}
                active={scenario}
                onSelect={setScenario}
              />
            </div>
          )}

          {tab === "guided" && activeScenario && !activeScenario.guided && (
            <ScenarioCase
              scenario={activeScenario}
              outcome={activeOutcome}
              busy={busy}
              onRun={() => act(() => regosApi.runScenario(activeScenario.id))}
              onReset={restart}
            />
          )}

          {tab === "guided" && (!activeScenario || activeScenario.guided) && (
            <GuidedReview
              state={state}
              receipt={receipt}
              sourceError={sourceError}
              busy={busy}
              sourceBusy={sourceBusy}
              onVerifySource={verifySource}
              onRunBuild={() => act(regosApi.runBuild, "step-compare")}
              onResolveReferences={() => act(regosApi.resolveScopedReferences, "step-human")}
              onCommitReading={(body) => act(() => regosApi.commitQ17Reading(body), "step-human")}
              onApprove={(body) => act(() => regosApi.approveQ17(body), "step-impact")}
              onDownloadReport={() =>
                download(() => regosApi.downloadBuildReport(state.builds.at(-1)!.id))}
              onDownloadBeforeAfter={() =>
                download(() => regosApi.downloadBeforeAfter(state.builds.at(-1)!.id))}
            />
          )}
        </div>

        <div
          role="tabpanel"
          id="panel-document"
          aria-labelledby="tab-document"
          hidden={tab !== "document"}
        >
          {tab === "document" && (
            <DocumentReview
              documents={documents}
              limits={limits}
              busy={busy}
              error={documentError}
              onChanged={setDocuments}
              onError={setDocumentError}
              onBusy={setBusy}
              onUseGuidedExample={() => setTab("guided")}
            />
          )}
        </div>

        <div
          role="tabpanel"
          id="panel-agents"
          aria-labelledby="tab-agents"
          hidden={tab !== "agents"}
        >
          {tab === "agents" && <Agents state={state} busy={busy} onRun={act} />}
        </div>

        <div
          role="tabpanel"
          id="panel-audit"
          aria-labelledby="tab-audit"
          hidden={tab !== "audit"}
        >
          {tab === "audit" && <AuditTrail state={state} />}
        </div>
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <p>
            Decision support · not legal advice · not a SEBI determination · synthetic broker
            data · no automated filing
          </p>
        </div>
      </footer>
    </>
  );
}

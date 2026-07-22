"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AuditTrail } from "../components/AuditTrail";
import { DocumentReview } from "../components/DocumentReview";
import { GuidedReview } from "../components/GuidedReview";
import { Disclosure } from "../components/ui";
import { regosApi } from "../lib/api";
import type {
  DocumentLimits,
  LiveSourceVerificationReceipt,
  UploadedDocument,
  WorkspaceState,
} from "../lib/types";

const TABS = [
  { id: "guided", label: "Guided review" },
  { id: "document", label: "Review your document" },
  { id: "audit", label: "Audit trail" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [limits, setLimits] = useState<DocumentLimits | null>(null);
  const [receipt, setReceipt] = useState<LiveSourceVerificationReceipt | null>(null);
  const [tab, setTab] = useState<TabId>("guided");
  const [busy, setBusy] = useState(false);
  const [sourceBusy, setSourceBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const load = useCallback(async () => {
    try {
      const [workspace, documentList, documentLimits] = await Promise.all([
        regosApi.workspace(),
        regosApi.listDocuments().catch(() => [] as UploadedDocument[]),
        regosApi.documentLimits().catch(() => null),
      ]);
      setState(workspace);
      setDocuments(documentList);
      setLimits(documentLimits);
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
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M10 1.8 3.4 4.3v5.2c0 4 2.8 7.7 6.6 8.7 3.8-1 6.6-4.7 6.6-8.7V4.3L10 1.8Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="m7.2 9.9 2 2 3.6-3.8"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="brand-text">
              <span className="brand-name">RegOS Sentinel</span>
              <span className="brand-tagline">
                Turn regulatory text into reviewable compliance work.
              </span>
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
              onClick={() => setShowGuide((value) => !value)}
              aria-expanded={showGuide}
            >
              {showGuide ? "Hide demo guide" : "Demo guide"}
            </button>
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
        {showGuide && (
          <div style={{ marginBottom: "24px" }}>
            <Disclosure summary="Three-minute presenter path" open>
              <ol className="stack-s">
                <li>1. Verify the SEBI source.</li>
                <li>2. Run the control check.</li>
                <li>3. Show why RegOS refuses to invent a date.</li>
                <li>4. Approve the human policy.</li>
                <li>5. Download the actual report.</li>
              </ol>
            </Disclosure>
          </div>
        )}

        {error && (
          <p className="banner" role="alert" style={{ marginBottom: "24px" }}>
            <span aria-hidden="true">✕</span>
            {error}
          </p>
        )}

        <div
          role="tabpanel"
          id="panel-guided"
          aria-labelledby="tab-guided"
          hidden={tab !== "guided"}
        >
          {tab === "guided" && (
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
          id="panel-audit"
          aria-labelledby="tab-audit"
          hidden={tab !== "audit"}
        >
          {tab === "audit" && <AuditTrail state={state} />}
        </div>
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <p>Decision support. Not legal advice. Not a SEBI determination.</p>
          <p>
            No automated filing · no production write access · synthetic entity and evidence data ·
            FAQ guidance must be read with the governing SEBI instruments.
          </p>
        </div>
      </footer>
    </>
  );
}

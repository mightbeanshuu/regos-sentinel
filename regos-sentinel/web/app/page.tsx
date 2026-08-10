"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Agents } from "../components/Agents";
import { AuditTrail } from "../components/AuditTrail";
import { Dashboard } from "../components/Dashboard";
import { DocumentReview } from "../components/DocumentReview";
import { FlowMap } from "../components/FlowMap";
import { FlowScene } from "../components/FlowScene";
import { GuidedReview } from "../components/GuidedReview";
import { Rail } from "../components/Rail";
import { DocumentGuidedReview } from "../components/DocumentGuidedReview";
import { StartHere, type StartScope } from "../components/StartHere";
import { Tag } from "../components/ui";
import { ScenarioCase, ScenarioSelector } from "../components/Scenarios";
import {
  IconAgents,
  IconAsk,
  IconBell,
  IconClauses,
  IconDecision,
  IconGauge,
  IconHelp,
  IconLedger,
} from "../components/vector";
import { regosApi } from "../lib/api";
import { agentNameOf, checkLabel, cscrfCategoryLabel, labelOf } from "../lib/presentation";
import type {
  DocumentCaseRecord,
  DocumentLimits,
  DocumentScore,
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
  { id: "dashboard", label: "Dashboard", icon: IconGauge },
  { id: "guided", label: "Review a requirement", icon: IconDecision },
  { id: "document", label: "Your own document", icon: IconClauses },
  { id: "agents", label: "AI assistants", icon: IconAgents },
  { id: "audit", label: "Full record", icon: IconLedger },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [bootSeconds, setBootSeconds] = useState(0);

  // Free-tier hosting sleeps between visits; the judges should know the wait is
  // expected and bounded, not a hang.
  useEffect(() => {
    const timer = window.setInterval(
      () => setBootSeconds((prior) => prior + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [openDocumentScore, setOpenDocumentScore] = useState<DocumentScore | null>(null);
  const [openDocumentCase, setOpenDocumentCase] = useState<DocumentCaseRecord | null>(null);
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
  const [showFlow, setShowFlow] = useState(false);
  /* The top-bar search carries its question into the assistant, which is the
     only surface in this product that answers one. */
  const [askSeed, setAskSeed] = useState("");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const errorRef = useRef<HTMLParagraphElement | null>(null);

  /* A refused action has to be visible from where it was refused. This banner
     sits at the top of the body, and the actions that can fail — committing a
     reading, approving a build — live far down a long page, so a rejection
     could render entirely off-screen and read as a button that does nothing.
     Bring the banner to the reader and move focus to it, which also announces
     the text to a screen reader. */
  useEffect(() => {
    if (!error) return;
    const node = errorRef.current;
    if (!node) return;
    node.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    });
    node.focus();
  }, [error]);

  // The Stitch tab shell scrolls horizontally on a phone. Keep the selected
  // destination in view when a workflow button changes tabs programmatically;
  // otherwise the active Dashboard or Full record tab can sit off-screen.
  useEffect(() => {
    const index = TABS.findIndex((item) => item.id === tab);
    const target = tabRefs.current[index];
    if (!target) return;
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [tab]);

  // The Stitch tab shell scrolls horizontally on a phone. Keep the selected
  // destination in view when a workflow button changes tabs programmatically;
  // otherwise the active Dashboard or Full record tab can sit off-screen.
  useEffect(() => {
    const index = TABS.findIndex((item) => item.id === tab);
    const target = tabRefs.current[index];
    if (!target) return;
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [tab]);

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
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not reach the RegOS service. Check your connection and try again.",
      );
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
        setError(
          caught instanceof Error
            ? caught.message
            : "That action could not be completed. Nothing was changed. Try again, or restart the demo.",
        );
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
        caught instanceof Error
          ? caught.message
          : "The check against the live SEBI website could not run just now. Try again shortly.",
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
      setError(caught instanceof Error ? caught.message : "That download failed. Try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  /**
   * "Restart demo" returns the dashboard to a blank start: no decision card, no
   * score, no deadline table until a document is here. A restarted demo that
   * immediately shows a full review presents work nobody in this session did.
   * Nothing is deleted — the seeded SEBI sources are still on file, the panel
   * says so, and "Continue with the built-in SEBI sources" is one click away.
   */
  /* Opens empty, and that is the point.
     It used to open on the seeded demo, so a first-time reader met Aster
     Securities' worked example as though it were their own review — and that
     example then sat beside a document they had uploaded, with its "1 week" and
     its "1 of 2 deadline statements" describing a different source entirely.
     The demo is one click away and clearly labelled as the example it is. */
  const [awaitingUpload, setAwaitingUpload] = useState(true);

  const restart = useCallback(async () => {
    setReceipt(null);
    setSourceError(null);
    setDocumentError(null);
    setDocuments([]);
    setAwaitingUpload(true);
    await act(regosApi.reset, "top");
  }, [act]);

  /* An added document is what ends the blank start. */
  useEffect(() => {
    if (documents.length > 0) setAwaitingUpload(false);
  }, [documents.length]);

  /* One gate for every tab except the upload surface itself. Before this the
     dashboard alone had an empty state, so a reader who clicked "Review a
     requirement" or "Full record" first still met the seeded example presented
     as their own work. */
  const startPanel = (scope: StartScope) => (
    <StartHere
      scope={scope}
      busy={busy}
      officialSourceCount={state?.documents.length ?? 0}
      onAddDocument={() => setTab("document")}
      onUseBuiltIn={() => setAwaitingUpload(false)}
    />
  );

  /* The document the reader has open, and its model read, so the rail can
     describe THAT file instead of the seeded workspace beside it. Scored here
     rather than inside the review panel because two surfaces now need it. */
  /* Not scoped to the upload tab any more. A document the reader has added is
     the subject of the whole workspace — the rail, the review and the record all
     have to describe it, or they describe something else while it is on screen. */
  const openDocument = documents.at(-1) ?? null;
  const openDocumentId = openDocument?.id ?? null;
  const openDocumentPassages = openDocument?.passages.length ?? 0;
  useEffect(() => {
    if (!openDocumentId) {
      setOpenDocumentScore(null);
      setOpenDocumentCase(null);
      return;
    }
    let cancelled = false;
    regosApi
      .documentScore(openDocumentId)
      .then((value) => { if (!cancelled) setOpenDocumentScore(value); })
      .catch(() => { if (!cancelled) setOpenDocumentScore(null); });
    // A document with no case yet answers 204, which the client reads as null.
    // That is the ordinary state of a fresh upload, not a failure.
    regosApi
      .documentCase(openDocumentId)
      .then((value) => { if (!cancelled) setOpenDocumentCase(value); })
      .catch(() => { if (!cancelled) setOpenDocumentCase(null); });
    return () => { cancelled = true; };
  }, [openDocumentId, openDocumentPassages]);

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
        <span className="boot-halo" aria-hidden="true">
          <span className="boot-ring" />
          <span className="boot-mark">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="boot-shield" x1="4" y1="3" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#5B8FE0" />
                  <stop offset="1" stopColor="#1D3F76" />
                </linearGradient>
              </defs>
              <path
                d="M12 2.2 4.2 5.1v6c0 4.7 3.3 9 7.8 10.2 4.5-1.2 7.8-5.5 7.8-10.2v-6L12 2.2Z"
                fill="url(#boot-shield)"
              />
              <path
                className="boot-check"
                d="m8.4 12.1 2.5 2.5 4.7-5"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
        <p className="micro">RegOS Sentinel</p>
        <h1 className="page-title">
          {error ? "Could not connect" : "Starting up…"}
        </h1>
        <p className="lede">
          {error
            ?? (bootSeconds < 8
              ? "Connecting to the demo."
              : bootSeconds < 30
                ? "This demo goes to sleep between visits, so the first load takes a moment."
                : "Still starting — the dashboard opens as soon as it is ready.")}
        </p>
        {!error && (
          <>
            <span className="boot-track" aria-hidden="true">
              <span className="boot-track-fill" />
            </span>
            <p className="boot-eta">
              <span className="boot-eta-dot" aria-hidden="true" />
              usually ready in under a minute
              <span className="boot-eta-clock mono">{String(Math.floor(bootSeconds / 60)).padStart(1, "0")}:{String(bootSeconds % 60).padStart(2, "0")}</span>
            </p>
          </>
        )}
        {error && (
          <button type="button" className="btn btn--primary" onClick={() => void load()}>
            Try again
          </button>
        )}
      </main>
    );
  }

  /* Same derivation the dashboard uses: a receipt whose hash no longer matches
     means SEBI has republished the document since this review read it. */
  const sourceStale = receipt !== null && !receipt.hash_matches_expected;
  /* What the bell counts: deadlines the source cannot produce a date for, plus
     checks the last run stopped on for a person. Both are read, never assumed —
     an empty bell has to mean the desk is genuinely clear. */
  const waitingCount = awaitingUpload
    ? 0
    : state.deadline_computations.filter((item) => !item.computable).length +
      (state.builds.at(-1)?.tests.filter((test) => test.status === "BLOCK").length ?? 0);

  /* What the bell opens. Each row points at the tab that can resolve it. */
  const waitingItems = awaitingUpload
    ? []
    : [
        ...state.deadline_computations
          .filter((item) => !item.computable)
          .map((item) => ({
            id: item.id,
            title: "Decide what starts this reporting clock",
            note: item.citation.locator,
            tab: "guided" as TabId,
          })),
        ...(state.builds.at(-1)?.tests ?? [])
          .filter((test) => test.status === "BLOCK")
          .map((test) => ({
            id: test.id,
            title: checkLabel(test.id, test.name),
            note: test.message,
            tab: "guided" as TabId,
          })),
      ];

  const assistantRuns = awaitingUpload ? [] : [...state.agent_runs].slice(-4).reverse();

  const sourceChecked = receipt
    ? sourceStale
      ? "changed since this review"
      : "verified"
    : "not re-checked";

  return (
    <div className="romer" id="top">
      {/* ---- Sidebar: the five sections, then the two demo controls --------- */}
      <nav className="romer-side" aria-label="Main sections">
        <p className="romer-brand">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.2 4.2 5.1v6c0 4.7 3.3 9 7.8 10.2 4.5-1.2 7.8-5.5 7.8-10.2v-6L12 2.2Z" />
          </svg>
          RegOS Sentinel
        </p>

        <div>
          <p className="romer-micro">Navigation</p>
          <div className="romer-nav" role="tablist">
            {TABS.map((item, index) => {
              const TabIcon = item.icon;
              const on = tab === item.id;
              return (
                <button
                  key={item.id}
                  ref={(node) => { tabRefs.current[index] = node; }}
                  type="button"
                  role="tab"
                  id={`tab-${item.id}`}
                  className={`romer-nav-item${on ? " romer-nav-item--on" : ""}`}
                  aria-selected={on}
                  aria-controls={`panel-${item.id}`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setTab(item.id)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                >
                  <TabIcon />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="romer-side-group">
          <div className="romer-nav">
            <button
              type="button"
              className="romer-nav-item"
              onClick={() => setShowFlow(true)}
            >
              How it works
            </button>
            <button
              type="button"
              className="romer-nav-item"
              disabled={busy || sourceBusy}
              onClick={() => void restart()}
            >
              Restart demo
            </button>
          </div>
        </div>

        <div className="romer-side-foot">
          <details className="profile">
            <summary className="romer-profile">
              <span className="romer-avatar" aria-hidden="true">
                {awaitingUpload
                  ? "+"
                  : openDocument
                    ? "\u25A6"
                    : state.entity_profile.legal_name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("")}
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="romer-profile-name">
                  {awaitingUpload
                    ? "No workspace yet"
                    : openDocument?.filename ?? state.entity_profile.legal_name}
                </span>
                {/* The category alone. "· synthetic" pushed this to 25 characters
                    in a 149px slot and broke a word at a time; the profile menu
                    below and the page footer both already say the data is
                    synthetic, so nothing is lost by not saying it a third time. */}
                <span className="romer-profile-sub">
                  {awaitingUpload
                    ? "nothing added"
                    : openDocument
                      ? `${openDocument.scope.page_count} pages · added by you`
                      : cscrfCategoryLabel(state.entity_profile.cscrf_category)}
                </span>
              </span>
            </summary>
            {/* The account menu. It shows the firm this workspace belongs to and
                every registration the API reports for it.

                There is no firm switcher, and that is a deliberate omission. The
                backend exposes exactly one `entity_profile` and no endpoint for a
                second workspace, so a switcher would either do nothing or move
                between firms this prototype invented — and an invented regulated
                entity is a worse fabrication than an invented number. The menu
                says what a live deployment does instead of miming it. */}
            <div className="romer-account">
              <p className="romer-micro">Signed in to</p>
              <p className="romer-account-name">
                {awaitingUpload ? "No workspace yet" : state.entity_profile.legal_name}
              </p>
              <p className="meta">
                {awaitingUpload ? (
                  "Add a document, or open the worked SEBI example, and this names what you are reviewing."
                ) : (
                  <>
                    {labelOf(state.entity_profile.entity_type)} ·{" "}
                    {cscrfCategoryLabel(state.entity_profile.cscrf_category)}
                    {state.entity_profile.is_qsb ? " · Qualified stockbroker" : ""}
                  </>
                )}
              </p>

              <p className="romer-micro">Registrations on file</p>
              {state.entity_profile.registrations.length === 0 ? (
                <p className="meta">No registration is recorded for this firm.</p>
              ) : (
                <ul className="romer-account-list">
                  {state.entity_profile.registrations.map((reg, index) => (
                    <li key={`${reg.registration_type}-${index}`}>
                      <span>{labelOf(reg.registration_type)}</span>
                      <Tag
                        value={reg.operational ? "Operational" : "Not operational"}
                        tone={reg.operational ? "ok" : "neutral"}
                      />
                    </li>
                  ))}
                </ul>
              )}

              <p className="romer-account-note">
                One synthetic broker in this prototype. A live deployment gives each
                broker their own workspace — so no switcher is offered here rather
                than one that moves between firms nobody registered.
              </p>
            </div>
          </details>
        </div>
      </nav>

      {/* ---- Centre column ------------------------------------------------- */}
      <div className="romer-main">
        {/* Breadcrumb, search, and a bell carrying the real number of things
            waiting on a person. The search does not decorate: it carries the
            question into the assistant, which is the only place in this product
            that answers one. A box that searched nothing would be the same lie
            as an invented figure, told with an icon instead of a number. */}
        <div className="romer-topbar">
          <p className="romer-crumbs">
            {/* What is open, not who we think you are. Printing the seeded firm's
                legal name above someone else's uploaded circular asserts an
                identity this product never asked for and cannot verify. */}
            <span>
              {openDocument
                ? openDocument.filename
                : awaitingUpload
                  ? "No document yet"
                  : state.entity_profile.legal_name}
            </span>
            <span className="romer-crumbs-sep" aria-hidden="true">›</span>
            <span className="romer-crumbs-here">
              {TABS.find((item) => item.id === tab)?.label}
            </span>
          </p>

          <div className="romer-topbar-tools">
            <form
              className="romer-search"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                if (!askSeed.trim()) return;
                setTab("agents");
              }}
            >
              <IconAsk />
              <input
                type="search"
                value={askSeed}
                placeholder="Ask about these SEBI rules…"
                aria-label="Ask about these SEBI rules"
                onChange={(event) => setAskSeed(event.target.value)}
              />
            </form>

            {/* Every row below is a record that exists. A notification list is
                the easiest place in a product to invent activity, and inventing
                one here would undo the claim the whole page rests on. */}
            <details className="romer-bell">
              <summary
                className="romer-icon-btn"
                aria-label={
                  waitingCount === 0
                    ? "Nothing is waiting on a person"
                    : `${waitingCount} item${waitingCount === 1 ? "" : "s"} waiting on a person`
                }
              >
                <IconBell />
                {waitingCount > 0 && (
                  <span className="romer-bell-count" aria-hidden="true">{waitingCount}</span>
                )}
              </summary>
              <div className="romer-pop">
                <p className="romer-micro">Waiting on a person</p>
                {waitingItems.length === 0 ? (
                  <p className="meta">Nothing is waiting on a person in this workspace.</p>
                ) : (
                  <ul className="romer-pop-list">
                    {waitingItems.slice(0, 5).map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="romer-pop-row"
                          onClick={() => setTab(item.tab)}
                        >
                          <span className="romer-pop-mark romer-pop-mark--review" aria-hidden="true">!</span>
                          <span>
                            <span className="romer-pop-title">{item.title}</span>
                            <span className="romer-pop-meta">{item.note}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {waitingItems.length > 5 && (
                  <p className="romer-pop-more">
                    and {waitingItems.length - 5} more — open Review a requirement to work
                    through them.
                  </p>
                )}

                <p className="romer-micro">What the assistants recorded</p>
                {assistantRuns.length === 0 ? (
                  <p className="meta">No assistant has run in this session.</p>
                ) : (
                  <ul className="romer-pop-list">
                    {assistantRuns.map((run) => (
                      <li key={`${run.agent_id}-${run.started_at}`}>
                        <button
                          type="button"
                          className="romer-pop-row"
                          onClick={() => setTab("agents")}
                        >
                          <span className="romer-pop-mark romer-pop-mark--ok" aria-hidden="true">✓</span>
                          <span>
                            <span className="romer-pop-title">{agentNameOf(run.agent_id)}</span>
                            <span className="romer-pop-meta">
                              {run.findings.length} finding
                              {run.findings.length === 1 ? "" : "s"} · {run.tool_call_count} step
                              {run.tool_call_count === 1 ? "" : "s"}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>

            <button
              type="button"
              className="romer-icon-btn"
              onClick={() => setShowFlow(true)}
              aria-label="How it works"
            >
              <IconHelp />
            </button>
          </div>
        </div>

        <div className="romer-status">
          <span
            className="romer-status-live"
            style={{ color: awaitingUpload ? "var(--ink-3)" : "var(--ok)" }}
          >
            <span className="romer-status-dot" aria-hidden="true" />
            {awaitingUpload ? "Waiting for a document" : "Review in progress"}
          </span>
          <span>
            <span className="romer-status-key">SEBI source:</span>
            <span className="romer-status-val">
              {awaitingUpload ? "none added yet" : sourceChecked}
            </span>
          </span>
        </div>

        <main className="romer-body">
        {error && (
          <p
            ref={errorRef}
            className="banner"
            role="alert"
            tabIndex={-1}
            style={{ marginBottom: "24px" }}
          >
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
          {tab === "dashboard" && awaitingUpload && startPanel("dashboard")}
          {tab === "dashboard" && !awaitingUpload && (
            <Dashboard
              state={state}
              documents={documents}
              receipt={receipt}
              busy={busy || sourceBusy}
              onRunCheck={() => void act(regosApi.runBuild, "top")}
              onOpenDecision={() => setTab("guided")}
              onVerifySource={verifySource}
              onDownloadReport={() =>
                void download(() => regosApi.downloadBuildReport(state.builds.at(-1)!.id))}
              onRefresh={() => void load()}
              onOpenDocuments={() => setTab("document")}
              onRunAgent={(id) => {
                void act(() => regosApi.runAgent(id, "DETERMINISTIC_PLAN") as Promise<WorkspaceState>);
              }}
              awaitingUpload={awaitingUpload}
              onShowWorkspace={() => setAwaitingUpload(false)}
              documentCase={openDocumentCase}
              onRunAssistants={(documentId) => {
                void act(() => regosApi.runAllAgents("DETERMINISTIC_PLAN", documentId) as Promise<WorkspaceState>);
              }}
            />
          )}
        </div>

        <div
          role="tabpanel"
          id="panel-guided"
          aria-labelledby="tab-guided"
          hidden={tab !== "guided"}
        >
          {tab === "guided" && awaitingUpload && startPanel("guided")}
          {tab === "guided" && !awaitingUpload && openDocument && (
            <DocumentGuidedReview
              document={openDocument}
              busy={busy}
              onBusy={setBusy}
              onError={setDocumentError}
              onDocumentChanged={() => void load()}
              onOpenDocument={() => setTab("document")}
            />
          )}

          {tab === "guided" && !awaitingUpload && !openDocument && catalogue && (
            <div style={{ marginBottom: "28px" }}>
              <ScenarioSelector
                catalogue={catalogue}
                active={scenario}
                onSelect={setScenario}
              />
            </div>
          )}

          {tab === "guided" && !awaitingUpload && !openDocument && activeScenario && !activeScenario.guided && (
            <ScenarioCase
              scenario={activeScenario}
              outcome={activeOutcome}
              busy={busy}
              onRun={() => act(() => regosApi.runScenario(activeScenario.id))}
              onReset={restart}
            />
          )}

          {tab === "guided" && !awaitingUpload && !openDocument && (!activeScenario || activeScenario.guided) && (
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
              onOpenAudit={() => setTab("audit")}
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
              onRunAssistants={(documentId) => {
                void act(() => regosApi.runAllAgents("DETERMINISTIC_PLAN", documentId) as Promise<WorkspaceState>);
                setTab("agents");
              }}
            />
          )}
        </div>

        <div
          role="tabpanel"
          id="panel-agents"
          aria-labelledby="tab-agents"
          hidden={tab !== "agents"}
        >
          {tab === "agents" && awaitingUpload && startPanel("agents")}
          {tab === "agents" && !awaitingUpload && (
            <Agents state={state} busy={busy} onRun={act} askSeed={askSeed} />
          )}
        </div>

        <div
          role="tabpanel"
          id="panel-audit"
          aria-labelledby="tab-audit"
          hidden={tab !== "audit"}
        >
          {tab === "audit" && awaitingUpload && startPanel("audit")}
          {tab === "audit" && !awaitingUpload && (
            <AuditTrail state={state} onOpenGuidedReview={() => setTab("guided")} />
          )}
        </div>
        </main>

        <footer className="romer-foot">
          <p>
            This tool supports your decisions. It is not legal advice, it is not a SEBI
            determination, the broker data is synthetic, and nothing is filed automatically.
          </p>
        </footer>
      </div>

      {/* ---- Intelligence rail --------------------------------------------- */}
      <Rail
        state={state}
        awaitingUpload={awaitingUpload}
        focusDocument={openDocument}
        focusScore={openDocumentScore}
      />

      {showFlow && (
        <div
          className="flow-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="How RegOS Sentinel works"
          onClick={() => setShowFlow(false)}
        >
          <div className="flow-overlay-card" onClick={(event) => event.stopPropagation()}>
            <FlowScene />
            <div className="flow-overlay-head">
              <h2 className="section-title">How it works</h2>
              <button
                type="button"
                className="btn btn--quiet btn--small"
                onClick={() => setShowFlow(false)}
              >
                Close
              </button>
            </div>
            <div className="flow-overlay-map">
              <FlowMap />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

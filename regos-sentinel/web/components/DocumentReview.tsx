"use client";

import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { regosApi } from "../lib/api";
import {
  formatBytes,
  formatTimestamp,
  labelOf,
  plainError,
  toneOf,
} from "../lib/presentation";
import type {
  DocumentLimits,
  DocumentScore,
  ExtractedPassage,
  PassageClass,
  UploadedDocument,
} from "../lib/types";
import { DocumentCasePanel } from "./DocumentCase";
import {
  Callout,
  DataRow,
  Disclosure,
  Empty,
  Field,
  Hash,
  Meter,
  Panel,
  SegBar,
  Skeleton,
  Stat,
  StatRow,
  StateLabel,
  Tag,
} from "./ui";

/** The committed model's read of one uploaded document — fetched fresh. */
function ModelScorecard({ document }: { document: UploadedDocument }) {
  const [score, setScore] = useState<DocumentScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    regosApi
      .documentScore(document.id)
      .then((value) => { if (!cancelled) { setScore(value); setLoading(false); } })
      .catch(() => { if (!cancelled) { setScore(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, [document.id, document.passages]);

  /* A request still in flight is not an absence: it gets the shape of the
     answer, and only a finished request that returned nothing gets a verdict. */
  if (loading) {
    return (
      <Panel title="How clear are this document's deadlines?">
        <Skeleton kind="stat" />
      </Panel>
    );
  }
  if (!score || score.passages_total === 0) {
    return (
      <Panel title="How clear are this document's deadlines?">
        <Empty
          title="No score for this document"
          hint="Nothing in this file has been read as a passage yet, so there is nothing to score."
        />
      </Panel>
    );
  }

  const timing = Object.entries(score.timing_counts);

  return (
    <Panel
      title="How clear are this document's deadlines?"
      description={`Read by Avadhi, the built-in deadline reader (${score.model_name} ${score.model_version}). It runs on this machine and never sends your document anywhere.`}
    >
      <div className="stack">
        <StatRow>
          <Stat
            size="l"
            value={
              score.deadline_clarity === null
                ? "—"
                : `${Math.round(score.deadline_clarity * 100)}%`
            }
            label="Deadline clarity"
            tone={score.blocked_durations > 0 ? "review" : undefined}
            context={
              score.deadline_clarity === null
                ? "not computable — no timing language in this document"
                : undefined
            }
          />
        </StatRow>

        <p className="lede">{score.clarity_formula}</p>
        {/* The denominator names itself. A ratio this small is only honest if the
            reader can see what it left out and why. */}
        <p className="meta">{score.scope_note}</p>

        {/* A distribution gets a distribution display: one bar, one legend. */}
        <SegBar
          segments={timing.map(([label, count]) => ({
            label: labelOf(label),
            count,
            tone: toneOf(label),
          }))}
          ariaLabel={timing
            .map(([label, count]) => `${count} ${labelOf(label).toLowerCase()}`)
            .join(", ")}
        />

        {score.with_timing_language === 0 && (
          <p className="lede">
            The model read all {score.passages_normative.toLocaleString()} requirement-shaped
            passages — none carries timing language, so no deadline can honestly be computed
            from this document. That is the answer, not an error.
          </p>
        )}

        <Disclosure summary="How each passage was read, class by class">
          <div>
            {timing.map(([label, count]) => (
              <Meter
                key={label}
                label={labelOf(label)}
                value={count}
                max={score.passages_normative}
                tone={toneOf(label)}
                valueLabel={`${count}/${score.passages_normative}`}
              />
            ))}
            {score.non_normative_timing_passages > 0 && (
              <p className="meta">
                A further {score.non_normative_timing_passages.toLocaleString()} passage
                {score.non_normative_timing_passages === 1 ? "" : "s"} outside those{" "}
                {score.passages_normative.toLocaleString()} also carr
                {score.non_normative_timing_passages === 1 ? "ies" : "y"} timing language —
                table rows, background text, permissions and repeats. They create no duty, so
                they are counted here but kept out of the ratio above.
              </p>
            )}
          </div>
        </Disclosure>

        <p className="lede">{score.limitation}</p>
      </div>
    </Panel>
  );
}

const CLASSIFICATIONS: PassageClass[] = [
  "POSSIBLE_REQUIREMENT",
  "RECOMMENDATION",
  "PERMISSION",
  "BACKGROUND",
  "DUPLICATE_OR_SUPERSEDED",
  "NEEDS_REVIEW",
  "NOT_ASSESSED_SCRIPT",
];

interface DocumentReviewProps {
  documents: UploadedDocument[];
  limits: DocumentLimits | null;
  busy: boolean;
  error: string | null;
  onChanged: (next: UploadedDocument[]) => void;
  onError: (message: string | null) => void;
  onBusy: (value: boolean) => void;
  onUseGuidedExample: () => void;
  onRunAssistants?: (documentId: string) => void;
}

/** The file a person has just chosen, before the server has read it. */
interface PendingFile {
  name: string;
  size: number;
}

/**
 * The chosen filename as a sheet of paper. This is the same geometry the uploaded
 * document lands in, so the file the reader picked becomes the document they read
 * rather than being replaced by it.
 *
 * The final state is the resting state: the name and size are painted immediately
 * and never depend on a transition finishing. Under reduced motion the entrance and
 * the scanning rule are dropped, and the sentence "Preparing passages for review"
 * carries the state on its own.
 */
function SourceSheet({
  file,
  preparing,
  stillness,
}: {
  file: PendingFile;
  preparing: boolean;
  stillness: boolean;
}) {
  /* A real elapsed count, not a progress bar.
     Reading a long circular on the hosted free tier takes a while — SEBI's
     205-page CSCRF framework measures about 105 seconds end to end — and for
     most of that a spinner is indistinguishable from a hang. A progress bar
     would be the easy answer and the dishonest one: extraction reports no
     percentage, so any bar would be an animation pretending to be a
     measurement, which is the exact thing this product refuses to do
     everywhere else. Counting the seconds that have actually passed is a
     number we have, and it turns a wait into something a person can judge. */
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!preparing) { setElapsed(0); return; }
    const started = performance.now();
    const timer = window.setInterval(
      () => setElapsed(Math.floor((performance.now() - started) / 1000)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [preparing]);

  /* Sized from the file, so the estimate is about THIS document. Measured on the
     hosted tier: ~2.5s a page, and a page with no text layer is machine-read,
     which costs more again. Given as a range because it is an estimate. */
  const estimateSeconds = Math.max(10, Math.round((file.size / 1024 / 1024) * 34));
  const longRead = estimateSeconds > 25;

  return (
    <div
      className={`panel upload-sheet${stillness ? " upload-sheet--still" : ""}`}
      role="status"
    >
      <p className="upload-sheet-name">{file.name}</p>
      <p className="upload-sheet-meta">PDF · {formatBytes(file.size)}</p>
      {preparing && (
        <>
          <p className="upload-sheet-state">
            {!stillness && (
              <span className="upload-sheet-bar" aria-hidden="true"><span /></span>
            )}
            Reading every page · {elapsed}s
          </p>
          <p className="upload-sheet-wait">
            {longRead ? (
              <>
                A document this size usually takes around{" "}
                <strong>{estimateSeconds}–{estimateSeconds * 2} seconds</strong> here.
                Every page is read, split into passages and classified before anything
                appears, so there is nothing to show until it is done. Leave this tab
                open — closing it loses the read.
              </>
            ) : (
              <>
                Every page is read, split into passages and classified before anything
                appears. Leave this tab open — closing it loses the read.
              </>
            )}
          </p>
          {elapsed > estimateSeconds * 2 && (
            <p className="upload-sheet-wait upload-sheet-wait--long">
              Still going. Long or scanned documents take the longest, because pages
              with no text layer are machine-read one at a time. It has not failed —
              a failure would say so here.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function DocumentReview({
  documents,
  limits,
  busy,
  error,
  onChanged,
  onError,
  onBusy,
  onUseGuidedExample,
  onRunAssistants,
}: DocumentReviewProps) {
  const [dragging, setDragging] = useState(false);
  const [authority, setAuthority] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [rejected, setRejected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stillness = useReducedMotion() ?? false;

  const active = useMemo(
    () => documents.find((item) => item.id === selectedId) ?? documents.at(-1) ?? null,
    [documents, selectedId],
  );

  const upload = useCallback(
    async (file: File) => {
      onBusy(true);
      onError(null);
      try {
        const uploaded = await regosApi.uploadDocument(
          file,
          authority.trim() || "Not stated by the uploader",
        );
        const next = await regosApi.listDocuments();
        onChanged(next);
        setSelectedId(uploaded.id);
      } catch (caught) {
        onError(plainError(caught, "That upload could not be processed."));
      } finally {
        setPending(null);
        onBusy(false);
      }
    },
    [authority, onBusy, onChanged, onError],
  );

  /**
   * One entry point for both halves of the single control — the picker and the drop.
   * The two limits the server publishes are checked here first, so a file that cannot
   * be read is named as an expected correction rather than returning as a server error.
   */
  const accept = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      setRejected(null);
      const looksLikePdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      if (!looksLikePdf) {
        setRejected(`“${file.name}” is not a PDF. RegOS reads PDF files only.`);
        return;
      }
      if (limits && file.size > limits.max_bytes) {
        setRejected(
          `“${file.name}” is ${formatBytes(file.size)}. The most this prototype accepts is ${formatBytes(limits.max_bytes)}.`,
        );
        return;
      }
      setPending({ name: file.name, size: file.size });
      void upload(file);
    },
    [limits, upload],
  );

  const mutate = useCallback(
    async (operation: () => Promise<UploadedDocument>) => {
      onBusy(true);
      onError(null);
      try {
        const updated = await operation();
        const next = await regosApi.listDocuments();
        onChanged(next);
        setSelectedId(updated.id);
      } catch (caught) {
        onError(plainError(caught, "That action could not be completed."));
      } finally {
        onBusy(false);
      }
    },
    [onBusy, onChanged, onError],
  );

  const remove = useCallback(
    async (documentId: string) => {
      onBusy(true);
      onError(null);
      try {
        await regosApi.deleteDocument(documentId);
        const next = await regosApi.listDocuments();
        onChanged(next);
        setSelectedId(next.at(-1)?.id ?? null);
      } catch (caught) {
        onError(plainError(caught, "That document could not be removed."));
      } finally {
        onBusy(false);
      }
    },
    [onBusy, onChanged, onError],
  );

  const jumpTo = (selector: string) =>
    window.document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });

  /**
   * The one upload control. The whole surface is the button, and the same surface
   * takes the drop, so there is a single visible path to a file — never a bare
   * browser picker sitting beside a styled one.
   */
  const chooser = (
    <>
      <button
        type="button"
        className={`upload-gate${dragging ? " upload-gate--over" : ""}`}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          accept(event.dataTransfer.files?.[0]);
        }}
      >
        <span className="upload-gate-mark" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
            <path d="M14 3v5h5" />
            <path d="M12 17v-5" />
            <path d="M9.5 14.5 12 12l2.5 2.5" />
          </svg>
        </span>
        <span className="upload-gate-action">Choose a PDF</span>
        <span className="upload-gate-hint">
          or drag it here
          {limits && (
            <> · PDF only · up to {formatBytes(limits.max_bytes)} · up to {limits.max_pages} pages</>
          )}
        </span>
      </button>
      {/* The surface above is the control. This input is out of the tab order and
          hidden from assistive technology, so nobody is offered a second picker. */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          accept(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </>
  );

  const feedback = (
    <>
      {error && <p className="banner" role="alert"><span aria-hidden="true">✕</span>{error}</p>}
      {rejected && (
        <Callout tone="review" title="Choose a different file">
          <p>{rejected}</p>
        </Callout>
      )}
    </>
  );

  /* ---- Before a document exists: one sentence, one control, one link -------
     No rail, no fingerprint, no OCR state, no authority field. Everything the
     product owes the reader about handling this file is reachable the moment
     the file exists, under "How this document is handled". */
  if (documents.length === 0) {
    return (
      <div className="upload-solo">
        <section className="stack-s">
          <h1 className="page-title">Review a document</h1>
          <p className="lede upload-lede">
            Choose a PDF you are allowed to share. RegOS will show the passages that need a
            person&rsquo;s reading.
          </p>
        </section>

        {feedback}

        {pending ? (
          <SourceSheet file={pending} preparing stillness={stillness} />
        ) : (
          <div className="upload-choice">
            {chooser}
            <p className="upload-alt">
              <button type="button" className="upload-link" onClick={onUseGuidedExample}>
                Use the guided example
              </button>
            </p>
          </div>
        )}

        {/* Shorter than it was, and still the whole promise: session-scoped, and
            never mandatory work without a named person. */}
        <p className="upload-promise">
          Your file stays in this browser session only — nothing is saved after you close this
          tab, and nothing in it becomes mandatory work until a named person approves it.
        </p>
      </div>
    );
  }

  /* ---- A document exists: now the rail, the handling, and the review ------ */
  const sections: Array<[string, string]> = [
    ["#doc-sheet", "This document"],
    ["#doc-score", "Deadline clarity"],
    ["#doc-passages", "Passages"],
    ["#doc-handling", "How it is handled"],
    ["#doc-limits", "Limitations"],
  ];
  if (documents.length > 1) sections.splice(1, 0, ["#doc-list", "All documents"]);

  return (
    <div className="jr-shell">
      <aside className="jr-sidenav" aria-label="Document sections">
        {sections.map(([target, label]) => (
          <button key={target} type="button" className="side-item" onClick={() => jumpTo(target)}>
            <span className="side-item-label">{label}</span>
          </button>
        ))}
      </aside>
      <div className="stack-l jr-body">
      <section className="stack-s">
        <h1 className="page-title">Review a document</h1>
        <p className="lede">
          These are the passages RegOS read in your file. Anything it could not settle is
          waiting for your reading.
        </p>
      </section>

      {feedback}

      {pending && <SourceSheet file={pending} preparing stillness={stillness} />}

      {documents.length > 1 && (
        <StatRow glass>
          <Stat value={documents.length} label="Documents in session" />
          <Stat
            value={documents.reduce(
              (sum, item) =>
                sum + item.passages.filter((p) => p.classification === "NEEDS_REVIEW").length,
              0,
            )}
            label="Pending review"
            tone={
              documents.some((item) =>
                item.passages.some((p) => p.classification === "NEEDS_REVIEW"),
              )
                ? "review"
                : undefined
            }
          />
          <Stat
            value={documents.reduce(
              (sum, item) => sum + item.passages.filter((p) => p.reviewed_by).length,
              0,
            )}
            label="Readings recorded"
          />
          <Stat
            value={documents.reduce((sum, item) => sum + item.requirements.length, 0)}
            label="Approvals recorded"
          />
        </StatRow>
      )}

      {documents.length > 1 && (
        <Panel id="doc-list" title="Documents in this session" tight>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Document</th>
                  <th scope="col">State</th>
                  <th scope="col">Pages</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {documents.map((item) => (
                  <tr key={item.id}>
                    <td>{item.filename}</td>
                    <td><StateLabel value={item.state} /></td>
                    <td>{item.scope.pages_read} of {item.scope.page_count}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--quiet btn--small"
                        onClick={() => setSelectedId(item.id)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {active && onRunAssistants && (
        <div className="btn-row">
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy}
            onClick={() => onRunAssistants(active.id)}
          >
            Run the assistants on this document
          </button>
          <p className="meta">
            All four assistants read only this document. What they find appears on the AI
            assistants tab.
          </p>
        </div>
      )}

      {active && (
        <DocumentCasePanel
          document={active}
          busy={busy}
          onBusy={onBusy}
          onError={onError}
          onDocumentChanged={() => {
            void regosApi.listDocuments().then(onChanged).catch(() => undefined);
          }}
        />
      )}

      {active && (
        <DocumentDetail
          document={active}
          ocrAvailable={limits?.ocr_available ?? false}
          busy={busy}
          onReviewPassage={(passageId, body) =>
            mutate(() => regosApi.reviewPassage(active.id, passageId, body))}
          onApproveRequirement={(body) =>
            mutate(() => regosApi.approveDocumentRequirement(active.id, body))}
          onRemove={() => void remove(active.id)}
          onError={onError}
          onBusy={onBusy}
        />
      )}

      {/* ---- Everything the pre-upload screen used to say, kept in full ---- */}
      {active && (
        <Panel
          id="doc-handling"
          title="How this document is handled"
          description="The same limits that applied before you chose the file, now against the file you chose."
        >
          <dl className="datalist">
            <DataRow label="Where your file is kept">
              {limits?.retention
                ?? "This browser session only. Nothing is saved after you close this tab."}
            </DataRow>
            <DataRow label="How the passages were sorted">
              By fixed rules, not by AI. Anything the rules cannot settle is marked as needing
              your reading rather than being decided for you.
            </DataRow>
            {limits && (
              <DataRow label="Scanned pages">
                {limits.ocr_available
                  ? "Machine-read (OCR). Recovered text is always labelled machine-read, and never treated as if the authority had typed it."
                  : "Machine reading (OCR) is switched off here, so scanned pages stay unread. No content is invented for them."}
              </DataRow>
            )}
            <DataRow label="Authority">
              {active.authority_label}{" "}
              <span className="meta">
                · stated by the uploader, not verified by RegOS
              </span>
            </DataRow>
            <DataRow label="Legal limits">
              None of this is legal advice, and nothing in this document becomes mandatory work
              until a named person approves it.
            </DataRow>
          </dl>
        </Panel>
      )}

      <Panel
        id="doc-add"
        title="Add another document"
        description="Each document keeps its own passages, review record and limitations."
      >
        <div className="stack">
          {pending ? (
            <SourceSheet file={pending} preparing stillness={stillness} />
          ) : (
            <div className="upload-choice upload-choice--compact">{chooser}</div>
          )}
          {/* Authority is an upload-time input the API records once, so it lives with
              the control that sends it — never as a field the first screen explains. */}
          <Field
            label="Authority for the document you add next, if you know it"
            hint="Recorded as information you typed in. RegOS never treats it as proof that the document is official."
          >
            {(aria) => (
              <input
                {...aria}
                value={authority}
                onChange={(event) => setAuthority(event.target.value)}
                placeholder="For example: SEBI, RBI, internal policy"
              />
            )}
          </Field>
        </div>
      </Panel>
    </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * One document: scope, passages, human review, exports.
 * ------------------------------------------------------------------------- */

function DocumentDetail({
  document,
  ocrAvailable,
  busy,
  onReviewPassage,
  onApproveRequirement,
  onRemove,
  onError,
  onBusy,
}: {
  document: UploadedDocument;
  ocrAvailable: boolean;
  busy: boolean;
  onReviewPassage: (
    passageId: string,
    body: {
      classification: PassageClass;
      reviewer_name: string;
      reviewer_role: string;
      rationale: string;
    },
  ) => Promise<void>;
  onApproveRequirement: (body: {
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
  }) => Promise<void>;
  onRemove: () => void;
  onError: (message: string | null) => void;
  onBusy: (value: boolean) => void;
}) {
  const [filter, setFilter] = useState<PassageClass | "ALL">("ALL");
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const scope = document.scope;
  const approved = document.state === "APPROVED";

  const visible = document.passages.filter(
    (passage) => filter === "ALL" || passage.classification === filter,
  );

  const classCounts = Object.fromEntries(
    CLASSIFICATIONS.map((value) => [
      value,
      document.passages.filter((passage) => passage.classification === value).length,
    ]),
  ) as Record<PassageClass, number>;

  /* The drawer follows the table: an explicit pick wins; otherwise the first
     passage still waiting on a person, then the first visible one. */
  const drawerPassage =
    visible.find((passage) => passage.id === drawerId)
    ?? visible.find((passage) => passage.classification === "NEEDS_REVIEW")
    ?? visible[0]
    ?? null;

  const download = useCallback(
    async (operation: () => Promise<void>) => {
      onBusy(true);
      onError(null);
      try {
        await operation();
      } catch (caught) {
        onError(caught instanceof Error ? caught.message : "That download failed.");
      } finally {
        onBusy(false);
      }
    },
    [onBusy, onError],
  );

  return (
    <div className="stack-l">
      <div id="doc-score"><ModelScorecard document={document} /></div>

      <Panel
        id="doc-sheet"
        title={document.filename}
        aside={<StateLabel value={document.state} showHint />}
      >
        <div className="stack">
          {/* The four figures a reader checks first. */}
          <StatRow>
            <Stat
              value={`${scope.pages_read}/${scope.page_count}`}
              label="Pages read"
              context={
                scope.pages_unreadable.length > 0
                  ? `${scope.pages_unreadable.length} could not be read`
                  : undefined
              }
            />
            <Stat value={scope.passages_reviewed} label="Passages reviewed" />
            <Stat value={scope.possible_requirements} label="Possible requirements" />
            <Stat
              value={scope.passages_needing_review}
              label="Still need review"
              tone={scope.passages_needing_review > 0 ? "review" : undefined}
              attention={scope.passages_needing_review > 0}
            />
          </StatRow>

          {/* What RegOS read but did not turn into work — the count and, on the
              same row, the effect that count had. */}
          <div className="stack-s">
            <p className="sub-title">What was not turned into work</p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Kind</th>
                    <th scope="col" className="table-num">Count</th>
                    <th scope="col">Effect</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Recommendations</td>
                    <td className="table-num">{scope.recommendations_not_converted}</td>
                    <td className="meta">No mandatory task created</td>
                  </tr>
                  <tr>
                    <td>Permissions</td>
                    <td className="table-num">{scope.permissions_not_converted}</td>
                    <td className="meta">No mandatory task created</td>
                  </tr>
                  <tr>
                    <td>Background passages</td>
                    <td className="table-num">{scope.background}</td>
                    <td className="meta">No mandatory task created</td>
                  </tr>
                  <tr>
                    <td>Duplicate or superseded</td>
                    <td className="table-num">{scope.duplicates}</td>
                    <td className="meta">No mandatory task created</td>
                  </tr>
                  <tr>
                    <td>Pages RegOS could not read</td>
                    <td className="table-num">
                      {scope.pages_unreadable.length > 0
                        ? scope.pages_unreadable.join(", ")
                        : "none"}
                    </td>
                    <td className="meta">
                      Not reviewed. No content was invented for them.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <dl className="datalist">
            <DataRow label="File fingerprint"><Hash value={document.sha256} /></DataRow>
            <DataRow label="File size">{formatBytes(document.byte_count)}</DataRow>
            <DataRow label="Uploaded">{formatTimestamp(document.uploaded_at)}</DataRow>
            <DataRow label="Authority (as entered)">
              {document.authority_label}{" "}
              <span className="meta">· typed in by you, not verified</span>
            </DataRow>
            <DataRow label="How the text was read">
              Read by fixed rules. Any page recovered by machine reading (OCR) is labelled.
            </DataRow>
            {document.scope.pages_machine_read.length > 0 && (
              <DataRow label="Pages machine-read (OCR)">
                {document.scope.pages_machine_read.join(", ")}{" "}
                <span className="meta">· recovered text is always labelled machine-read, and never treated as if SEBI had typed it.</span>
              </DataRow>
            )}
          </dl>

          {scope.pages_unreadable.length > 0 && (
            <Callout tone="review" title="Some pages could not be read">
              <p>
                {ocrAvailable
                  ? "These pages carry no text layer and machine reading (OCR) recovered nothing usable from them, so they were not reviewed and no content was invented for them."
                  : "These pages carry no text layer, and machine reading (OCR) is switched off here, so they were not reviewed and no content was invented for them."}
              </p>
            </Callout>
          )}

          <div className="btn-row">
            <button
              type="button"
              className="btn btn--secondary"
              disabled={busy}
              onClick={() => void download(() => regosApi.downloadReviewPacket(document.id))}
            >
              Download the draft review pack
            </button>
            <div className="stack-s">
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy || !approved}
                onClick={() => void download(() => regosApi.downloadDocumentReport(document.id))}
              >
                Download the approved compliance report
              </button>
              {/* The reason a disabled button is disabled belongs under it. */}
              {!approved && (
                <p className="meta">Available after you approve at least one requirement.</p>
              )}
            </div>
            <button type="button" className="btn btn--danger-quiet btn--small" onClick={onRemove}>
              Remove document
            </button>
          </div>
          {!approved && (
            <p className="meta">
              The draft pack is watermarked <span className="strong-ink">DRAFT — NOT
              APPROVED</span>.
            </p>
          )}
        </div>
      </Panel>

      {document.requirements.length > 0 && (
        <Panel
          title="Requirements approved by a person"
          description="Named reviewer · written reason · exact passage."
        >
          <div className="stack">
            {document.requirements.map((requirement) => (
              <div key={requirement.id} className="stack-s">
                <div className="passage-head">
                  <span className="sub-title">
                    {requirement.action} {requirement.obligation_object}
                  </span>
                  <Tag value="HUMAN_POLICY" />
                </div>
                <dl className="datalist">
                  <DataRow label="Actor">{requirement.actor}</DataRow>
                  <DataRow label="Duration">
                    {requirement.duration_value
                      ? `${requirement.duration_value} ${requirement.duration_unit}`
                      : "No duration recorded"}
                  </DataRow>
                  <DataRow label="Starts from">
                    {requirement.trigger ?? "Not recorded"}
                  </DataRow>
                  <DataRow label="Due date">
                    {requirement.computable ? (
                      "Calculated from the recorded start event"
                    ) : (
                      <>
                        <span className="strong-ink">Not calculated</span>
                        <p className="meta">{requirement.blocked_reason}</p>
                      </>
                    )}
                  </DataRow>
                  <DataRow label="Recorded by">
                    {requirement.reviewer_name} · {requirement.reviewer_role}
                  </DataRow>
                  <DataRow label="Reason">{requirement.reason}</DataRow>
                  <DataRow label="From">{requirement.locator}</DataRow>
                </dl>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel
        title="Passages"
        description="Every passage RegOS read. Open one to record your own reading, or to approve a requirement from it. Nothing here creates work on its own."
      >
        <div className="stack">
          {/* How the whole document was read, as one distribution. */}
          <SegBar
            segments={CLASSIFICATIONS.map((value) => ({
              label: labelOf(value),
              count: classCounts[value],
              tone: toneOf(value),
            }))}
            ariaLabel={CLASSIFICATIONS.map(
              (value) => `${classCounts[value]} ${labelOf(value).toLowerCase()}`,
            ).join(", ")}
          />
          <p className="meta">
            Recommendations and permissions never become mandatory work: no task is created
            from either.
          </p>
        </div>
      </Panel>

      <Panel
        title="Every passage"
        aside={
          /* Chips, not a dropdown: the counts are visible without opening
             anything, and the filter in force reads at a glance. */
          <div className="audit-filters" role="group" aria-label="Filter passages by how they were read">
            <button
              type="button"
              className={`audit-filter${filter === "ALL" ? " audit-filter--on" : ""}`}
              aria-pressed={filter === "ALL"}
              onClick={() => setFilter("ALL")}
            >
              All {document.passages.length}
            </button>
            {CLASSIFICATIONS.map((value) => (
              <button
                key={value}
                type="button"
                className={`audit-filter${filter === value ? " audit-filter--on" : ""}`}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {labelOf(value)} {classCounts[value]}
              </button>
            ))}
          </div>
        }
        tight
      >
        {visible.length === 0 ? (
          <Empty
            title="No passages match this filter"
            hint="Nothing in this document was read that way."
            action={
              <button type="button" className="btn btn--secondary btn--small" onClick={() => setFilter("ALL")}>
                Show all passages
              </button>
            }
          />
        ) : (
          <div className="docreview-layout">
            <div className="table-scroll docreview-table">
              <table>
                {/* Two columns, not four: beside a 380px drawer, four columns
                    squeezed the passage text — the one thing that names the row —
                    to 75px. The locator and the reading ride above the text. */}
                <thead>
                  <tr>
                    <th scope="col">Passage, and how RegOS read it</th>
                    <th scope="col">Your action</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((passage) => {
                    const passageApproved = document.requirements.some(
                      (item) => item.passage_id === passage.id,
                    );
                    const current = drawerPassage?.id === passage.id;
                    return (
                      <tr
                        key={passage.id}
                        className={`docreview-row${current ? " docreview-row--current" : ""}`}
                        tabIndex={0}
                        aria-selected={current}
                        onClick={() => setDrawerId(passage.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setDrawerId(passage.id);
                          }
                        }}
                      >
                        <td>
                          <span className="micro mono">{passage.locator} · </span>
                          <StateLabel value={passage.classification} />
                          <span className="docreview-cell-text" title={passage.text}>
                            {passage.text}
                          </span>
                        </td>
                        <td className="docreview-cell-status">
                          {/* A chip, not a sentence — the reviewer's name is in the
                              drawer beside the passage it belongs to. */}
                          {passageApproved ? (
                            <Tag value="Approved" tone="ok" />
                          ) : passage.reviewed_by ? (
                            <Tag value="Reviewed" tone="neutral" />
                          ) : (
                            <Tag value="Pending" tone="review" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {drawerPassage && (
              <aside className="review-drawer" aria-label="The passage you are reviewing">
                <p className="review-drawer-title">The passage you are reviewing</p>
                <PassageRow
                  key={drawerPassage.id}
                  passage={drawerPassage}
                  busy={busy}
                  canApprove={drawerPassage.classification === "POSSIBLE_REQUIREMENT"}
                  alreadyApproved={document.requirements.some(
                    (item) => item.passage_id === drawerPassage.id,
                  )}
                  onReview={(body) => onReviewPassage(drawerPassage.id, body)}
                  onApprove={(body) =>
                    onApproveRequirement({ ...body, passage_id: drawerPassage.id })}
                />
              </aside>
            )}
          </div>
        )}
      </Panel>

      <Panel id="doc-limits" title="Limitations">
        {/* Every limitation, in full: what is limited on the left, what that
            means on the right. No sentence is shortened or hidden. */}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">What is limited</th>
                <th scope="col">What that means</th>
              </tr>
            </thead>
            <tbody>
              {document.limitations.map((line) => {
                const split = line.indexOf(". ");
                const head = split > 0 ? line.slice(0, split + 1) : line;
                const rest = split > 0 ? line.slice(split + 2) : "";
                return (
                  <tr key={line}>
                    <td colSpan={rest ? 1 : 2}>{head}</td>
                    {rest && <td className="meta">{rest}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * One passage, with the two human actions it supports.
 * ------------------------------------------------------------------------- */

function PassageRow({
  passage,
  busy,
  canApprove,
  alreadyApproved,
  onReview,
  onApprove,
}: {
  passage: ExtractedPassage;
  busy: boolean;
  canApprove: boolean;
  alreadyApproved: boolean;
  onReview: (body: {
    classification: PassageClass;
    reviewer_name: string;
    reviewer_role: string;
    rationale: string;
  }) => Promise<void>;
  onApprove: (body: {
    actor: string;
    action: string;
    obligation_object: string;
    duration_value?: number | null;
    duration_unit?: string | null;
    trigger?: string | null;
    reviewer_name: string;
    reviewer_role: string;
    reason: string;
  }) => Promise<void>;
}) {
  const [mode, setMode] = useState<"none" | "reclassify" | "approve">("none");

  return (
    <article className="passage">
      <div className="passage-head">
        <span className="mono meta">{passage.locator}</span>
        <StateLabel value={passage.classification} />
      </div>
      <p className="passage-text">{passage.text}</p>
      <p className="passage-why">
        {passage.rationale}
        {passage.matched_cues.length > 0 && (
          <> Language found: {passage.matched_cues.map((cue) => `“${cue}”`).join(", ")}.</>
        )}
      </p>
      {passage.reviewed_by && (
        <p className="meta">
          Reading recorded by {passage.reviewed_by} · {formatTimestamp(passage.reviewed_at)}
        </p>
      )}
      {alreadyApproved && (
        <p className="meta">A requirement has already been approved from this passage.</p>
      )}

      <div className="btn-row">
        <button
          type="button"
          className="btn btn--quiet btn--small"
          onClick={() => setMode(mode === "reclassify" ? "none" : "reclassify")}
        >
          {mode === "reclassify" ? "Cancel" : "Record a different reading"}
        </button>
        {canApprove && !alreadyApproved && (
          <button
            type="button"
            className="btn btn--primary btn--small"
            onClick={() => setMode(mode === "approve" ? "none" : "approve")}
          >
            {mode === "approve" ? "Cancel" : "Approve a requirement from this passage"}
          </button>
        )}
      </div>

      {mode === "reclassify" && (
        <ReclassifyForm busy={busy} onSubmit={async (body) => { await onReview(body); setMode("none"); }} />
      )}
      {mode === "approve" && (
        <ApproveForm busy={busy} onSubmit={async (body) => { await onApprove(body); setMode("none"); }} />
      )}
    </article>
  );
}

function ReclassifyForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (body: {
    classification: PassageClass;
    reviewer_name: string;
    reviewer_role: string;
    rationale: string;
  }) => Promise<void>;
}) {
  const [classification, setClassification] = useState<PassageClass>("POSSIBLE_REQUIREMENT");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Compliance Officer");
  const [rationale, setRationale] = useState("");
  const [touched, setTouched] = useState(false);

  const nameError = touched && name.trim().length < 2 ? "Enter your name. The record names you." : null;
  const rationaleError = touched && rationale.trim().length < 8
    ? "Explain why this reading is right, in one sentence."
    : null;

  return (
    <div className="stack" style={{ marginTop: "12px" }}>
      <div className="field-grid">
        <Field label="How should this passage be read?">
          {(aria) => (
            <select
              {...aria}
              value={classification}
              onChange={(event) => setClassification(event.target.value as PassageClass)}
            >
              {CLASSIFICATIONS.map((value) => (
                <option key={value} value={value}>{labelOf(value)}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Your name" error={nameError}>
          {(aria) => <input {...aria} value={name} onChange={(event) => setName(event.target.value)} />}
        </Field>
        <Field label="Your role">
          {(aria) => <input {...aria} value={role} onChange={(event) => setRole(event.target.value)} />}
        </Field>
      </div>
      <Field label="Why is this the right reading?" error={rationaleError}>
        {(aria) => (
          <textarea
            {...aria}
            rows={2}
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
          />
        )}
      </Field>
      <div className="btn-row">
        <button
          type="button"
          className="btn btn--primary btn--small"
          disabled={busy}
          onClick={() => {
            setTouched(true);
            if (name.trim().length < 2 || rationale.trim().length < 8) return;
            void onSubmit({
              classification,
              reviewer_name: name.trim(),
              reviewer_role: role.trim() || "Compliance Officer",
              rationale: rationale.trim(),
            });
          }}
        >
          Record this reading
        </button>
      </div>
    </div>
  );
}

function ApproveForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (body: {
    actor: string;
    action: string;
    obligation_object: string;
    duration_value?: number | null;
    duration_unit?: string | null;
    trigger?: string | null;
    reviewer_name: string;
    reviewer_role: string;
    reason: string;
  }) => Promise<void>;
}) {
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [object, setObject] = useState("");
  const [durationValue, setDurationValue] = useState("");
  const [durationUnit, setDurationUnit] = useState("days");
  const [trigger, setTrigger] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Compliance Officer");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const required = (value: string, message: string) =>
    touched && value.trim().length < 2 ? message : null;

  const reasonError = touched && reason.trim().length < 8
    ? "Enter a written reason. The exported record must explain why this was approved."
    : null;

  const complete = actor.trim().length >= 2
    && action.trim().length >= 2
    && object.trim().length >= 2
    && name.trim().length >= 2
    && reason.trim().length >= 8;

  return (
    <div className="stack" style={{ marginTop: "12px" }}>
      <Callout tone="accent" title="You are recording your own reading of this passage">
        <p>
          These fields are yours, not the document&rsquo;s. Every one is stored as confirmed by a
          compliance officer. If you leave the start event blank, no due date is calculated.
        </p>
      </Callout>
      <div className="field-grid">
        <Field label="Who must act?" error={required(actor, "Enter who this applies to.")}>
          {(aria) => (
            <input {...aria} value={actor} onChange={(event) => setActor(event.target.value)}
              placeholder="For example: regulated entity" />
          )}
        </Field>
        <Field label="What must they do?" error={required(action, "Enter the action required.")}>
          {(aria) => (
            <input {...aria} value={action} onChange={(event) => setAction(event.target.value)}
              placeholder="For example: close" />
          )}
        </Field>
        <Field label="To what?" error={required(object, "Enter what the action applies to.")}>
          {(aria) => (
            <input {...aria} value={object} onChange={(event) => setObject(event.target.value)}
              placeholder="For example: high-severity findings" />
          )}
        </Field>
      </div>
      <div className="field-grid">
        <Field label="Duration, if the passage states one">
          {(aria) => (
            <input
              {...aria}
              type="number"
              min={1}
              value={durationValue}
              onChange={(event) => setDurationValue(event.target.value)}
              placeholder="For example: 7"
            />
          )}
        </Field>
        <Field label="Unit">
          {(aria) => (
            <select {...aria} value={durationUnit} onChange={(event) => setDurationUnit(event.target.value)}>
              <option value="days">days</option>
              <option value="weeks">weeks</option>
              <option value="months">months</option>
              <option value="years">years</option>
            </select>
          )}
        </Field>
        <Field
          label="What event starts that period?"
          hint="Leave blank if the passage does not say. RegOS will then calculate no due date."
        >
          {(aria) => (
            <input {...aria} value={trigger} onChange={(event) => setTrigger(event.target.value)}
              placeholder="Leave blank if not stated" />
          )}
        </Field>
      </div>
      <div className="field-grid">
        <Field label="Your name" error={required(name, "Enter your name.")}>
          {(aria) => <input {...aria} value={name} onChange={(event) => setName(event.target.value)} />}
        </Field>
        <Field label="Your role">
          {(aria) => <input {...aria} value={role} onChange={(event) => setRole(event.target.value)} />}
        </Field>
      </div>
      <Field label="Reason for approving this requirement" error={reasonError}>
        {(aria) => (
          <textarea {...aria} rows={2} value={reason} onChange={(event) => setReason(event.target.value)} />
        )}
      </Field>
      <div className="btn-row">
        <button
          type="button"
          className="btn btn--primary btn--small"
          disabled={busy}
          onClick={() => {
            setTouched(true);
            if (!complete) return;
            void onSubmit({
              actor: actor.trim(),
              action: action.trim(),
              obligation_object: object.trim(),
              duration_value: durationValue ? Number(durationValue) : null,
              duration_unit: durationValue ? durationUnit : null,
              trigger: trigger.trim() || null,
              reviewer_name: name.trim(),
              reviewer_role: role.trim() || "Compliance Officer",
              reason: reason.trim(),
            });
          }}
        >
          Approve requirement and continue
        </button>
      </div>
    </div>
  );
}

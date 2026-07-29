"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { regosApi } from "../lib/api";
import { formatBytes, formatTimestamp } from "../lib/presentation";
import type {
  DocumentLimits,
  DocumentScore,
  ExtractedPassage,
  PassageClass,
  UploadedDocument,
} from "../lib/types";
import { Callout, Counts, DataRow, Field, Hash, Panel, StateLabel, Tag } from "./ui";

const TIMING_PLAIN: Record<string, string> = {
  PERIOD_AND_TRIGGER: "Date can be worked out",
  PERIOD_ONLY: "Says how long, not from when",
  URGENCY_ONLY: "Says urgent, no period",
  NO_TIMING: "No timing language",
};

/** The committed model's read of one uploaded document — fetched fresh. */
function ModelScorecard({ document }: { document: UploadedDocument }) {
  const [score, setScore] = useState<DocumentScore | null>(null);

  useEffect(() => {
    let cancelled = false;
    regosApi
      .documentScore(document.id)
      .then((value) => { if (!cancelled) setScore(value); })
      .catch(() => { if (!cancelled) setScore(null); });
    return () => { cancelled = true; };
  }, [document.id, document.passages]);

  if (!score || score.passages_total === 0) return null;
  const max = Math.max(...Object.values(score.timing_counts), 1);

  return (
    <Panel
      title="Model scorecard"
      description={`Generated fresh by ${score.model_name} ${score.model_version} — committed weights, no network.`}
    >
      <div className="scorecard">
        <div className="scorecard-figure">
          <span className="scorecard-value">
            {score.deadline_clarity === null
              ? "—"
              : `${Math.round(score.deadline_clarity * 100)}%`}
          </span>
          <span className="scorecard-label">Deadline clarity</span>
          <span className="meta">{score.clarity_formula}</span>
        </div>
        <div className="scorecard-bars">
          {Object.entries(score.timing_counts).map(([label, count]) => (
            <div className="cci-row" key={label}>
              <span className="cci-row-title">{TIMING_PLAIN[label] ?? label}</span>
              <span className="cci-bar" aria-hidden="true">
                <span
                  className={`cci-bar-fill${label === "PERIOD_AND_TRIGGER" ? " cci-bar-fill--ok" : label === "NO_TIMING" ? "" : " cci-bar-fill--review"}`}
                  style={{ transform: `scaleX(${count / max})` }}
                />
              </span>
              <span className="cci-row-score">{count}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="meta clamp2" title={score.limitation}>{score.limitation}</p>
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
  const inputRef = useRef<HTMLInputElement>(null);

  const active = useMemo(
    () => documents.find((item) => item.id === selectedId) ?? documents.at(-1) ?? null,
    [documents, selectedId],
  );

  const maxMb = limits ? Math.round(limits.max_bytes / (1024 * 1024)) : 5;

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
        onError(caught instanceof Error ? caught.message : "That upload could not be processed.");
      } finally {
        onBusy(false);
      }
    },
    [authority, onBusy, onChanged, onError],
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
        onError(caught instanceof Error ? caught.message : "That action could not be completed.");
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
        onError(caught instanceof Error ? caught.message : "That document could not be removed.");
      } finally {
        onBusy(false);
      }
    },
    [onBusy, onChanged, onError],
  );

  return (
    <div className="stack-l">
      <section className="stack-s">
        <h1 className="page-title">Review your regulatory document</h1>
        <p className="lede">
          Upload a public or sandbox PDF. Fingerprinted, passages extracted, anything
          uncertain routed to you.
        </p>
      </section>

      {documents.length > 0 && (
        <Counts
          glass
          items={[
            { value: documents.length, label: "Documents in session" },
            {
              value: documents.reduce(
                (sum, item) =>
                  sum + item.passages.filter((p) => p.classification === "NEEDS_REVIEW").length,
                0,
              ),
              label: "Pending review",
            },
            {
              value: documents.reduce(
                (sum, item) => sum + item.passages.filter((p) => p.reviewed_by).length,
                0,
              ),
              label: "Readings recorded",
            },
            {
              value: documents.reduce((sum, item) => sum + item.requirements.length, 0),
              label: "Approvals recorded",
            },
          ]}
        />
      )}

      <Callout tone="review">
        <p>
          Session-only. Fixed-rule classification, no model call, no legal interpretation.
          Nothing becomes mandatory work until a named person approves it.
        </p>
        {limits && !limits.ocr_available && (
          <p className="meta">Scanned pages are not read — no OCR in this prototype.</p>
        )}
      </Callout>

      {error && <p className="banner" role="alert"><span aria-hidden="true">✕</span>{error}</p>}

      {/* ---- Upload -------------------------------------------------- */}
      <Panel title="Add a document">
        <div className="stack">
          <div
            className={`dropzone${dragging ? " dropzone--active" : ""}${busy ? " dropzone--scanning" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file) void upload(file);
            }}
          >
            <p className="sub-title">Drag a PDF here</p>
            <p className="meta">
              PDF only · up to {maxMb} MB · up to {limits?.max_pages ?? 40} pages
            </p>
            {/* The visible "Choose PDF" button is the real control; this input stays out of
                the tab order but keeps a name for assistive technology. */}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="visually-hidden"
              aria-label="Choose a PDF to review"
              tabIndex={-1}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.target.value = "";
              }}
            />
            <div className="btn-row">
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                {busy && <span className="spinner" aria-hidden="true" />}
                Choose PDF
              </button>
              <button type="button" className="btn btn--quiet" onClick={onUseGuidedExample}>
                Use the guided SEBI example instead
              </button>
            </div>
          </div>

          <Field
            label="Authority, if you know it"
            hint="Recorded as metadata you supplied. RegOS never treats this as proof that a document is official."
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

      {documents.length > 1 && (
        <Panel title="Documents in this session" tight>
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
            All four read this document only; findings appear under AI agents.
          </p>
        </div>
      )}

      {active && (
        <DocumentDetail
          document={active}
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
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * One document: scope, passages, human review, exports.
 * ------------------------------------------------------------------------- */

function DocumentDetail({
  document,
  busy,
  onReviewPassage,
  onApproveRequirement,
  onRemove,
  onError,
  onBusy,
}: {
  document: UploadedDocument;
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
      <ModelScorecard document={document} />

      <Panel
        title={document.filename}
        description="User-uploaded source. No official status."
        aside={<StateLabel value={document.state} showHint />}
      >
        <div className="stack">
          <dl className="datalist">
            <DataRow label="File fingerprint"><Hash value={document.sha256} /></DataRow>
            <DataRow label="File size">{formatBytes(document.byte_count)}</DataRow>
            <DataRow label="Uploaded">{formatTimestamp(document.uploaded_at)}</DataRow>
            <DataRow label="Authority (as entered)">
              {document.authority_label}{" "}
              <span className="meta">· user-provided metadata, not verified</span>
            </DataRow>
            <DataRow label="Extraction">
              Deterministic text extraction · no model call · no OCR
            </DataRow>
          </dl>

          <Counts
            items={[
              { value: `${scope.pages_read}/${scope.page_count}`, label: "pages read" },
              { value: scope.passages_reviewed, label: "passages reviewed" },
              { value: scope.possible_requirements, label: "possible requirements" },
              { value: scope.passages_needing_review, label: "still need review" },
            ]}
          />

          <dl className="datalist">
            <DataRow label="Recommendations not converted">
              {scope.recommendations_not_converted}{" "}
              <span className="meta">— no mandatory task created</span>
            </DataRow>
            <DataRow label="Permissions not converted">
              {scope.permissions_not_converted}{" "}
              <span className="meta">— no mandatory task created</span>
            </DataRow>
            <DataRow label="Background passages">{scope.background}</DataRow>
            <DataRow label="Duplicate or superseded">{scope.duplicates}</DataRow>
            <DataRow label="Pages with no extractable text">
              {scope.pages_unreadable.length > 0
                ? scope.pages_unreadable.join(", ")
                : "none"}
            </DataRow>
          </dl>

          {scope.pages_unreadable.length > 0 && (
            <Callout tone="review" title="Some pages could not be read">
              <p>
                This PDF appears to contain scanned pages. Text extraction is not available for
                those pages in this prototype, so they were not reviewed and no content was
                invented for them.
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
              Download draft review packet
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={busy || !approved}
              onClick={() => void download(() => regosApi.downloadDocumentReport(document.id))}
            >
              Download Compliance Build Report
            </button>
            <button type="button" className="btn btn--danger-quiet btn--small" onClick={onRemove}>
              Remove document
            </button>
          </div>
          {!approved && (
            <p className="meta">
              The draft packet is watermarked <span className="strong-ink">DRAFT — NOT
              APPROVED</span>. The Compliance Build Report becomes available once a named person
              approves at least one structured requirement.
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
        description="Nothing here creates work on its own."
        aside={
          <div className="field" style={{ minWidth: "220px" }}>
            <label className="visually-hidden" htmlFor="passage-filter">
              Filter passages by classification
            </label>
            <select
              id="passage-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value as PassageClass | "ALL")}
            >
              <option value="ALL">All passages ({document.passages.length})</option>
              {CLASSIFICATIONS.map((value) => (
                <option key={value} value={value}>
                  {value === "POSSIBLE_REQUIREMENT" && "Possible requirement"}
                  {value === "RECOMMENDATION" && "Recommended — no mandatory task"}
                  {value === "PERMISSION" && "Optional — no mandatory task"}
                  {value === "BACKGROUND" && "Background only"}
                  {value === "DUPLICATE_OR_SUPERSEDED" && "Duplicate or superseded"}
                  {value === "NEEDS_REVIEW" && "Needs interpretation"}
                  {" "}({document.passages.filter((p) => p.classification === value).length})
                </option>
              ))}
            </select>
          </div>
        }
        tight
      >
        {visible.length === 0 ? (
          <div className="empty">
            <p className="lede">No passages match this filter.</p>
          </div>
        ) : (
          <div className="docreview-layout">
            <div className="table-scroll docreview-table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Passage</th>
                    <th scope="col">Text</th>
                    <th scope="col">Reading</th>
                    <th scope="col">Status</th>
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
                        <td className="mono meta">{passage.locator}</td>
                        <td>
                          <span className="clamp2 docreview-cell-text" title={passage.text}>
                            {passage.text}
                          </span>
                        </td>
                        <td><StateLabel value={passage.classification} /></td>
                        <td className="docreview-cell-status">
                          {passageApproved
                            ? "Approved"
                            : passage.reviewed_by
                              ? `Reviewed by ${passage.reviewed_by}`
                              : "Pending review"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {drawerPassage && (
              <aside className="review-drawer" aria-label="Review drawer">
                <p className="review-drawer-title">Review drawer</p>
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

      <Panel title="Limitations">
        <ul className="stack-s">
          {document.limitations.map((line) => (
            <li key={line} className="lede">— {line}</li>
          ))}
        </ul>
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
        <p className="meta">A structured requirement has already been approved from this passage.</p>
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
            {mode === "approve" ? "Cancel" : "Approve a requirement from this"}
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
              <option value="POSSIBLE_REQUIREMENT">Possible requirement</option>
              <option value="RECOMMENDATION">Recommended — no mandatory task</option>
              <option value="PERMISSION">Optional — no mandatory task</option>
              <option value="BACKGROUND">Background only</option>
              <option value="DUPLICATE_OR_SUPERSEDED">Duplicate or superseded</option>
              <option value="NEEDS_REVIEW">Still needs interpretation</option>
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

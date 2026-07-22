"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { regosApi } from "../lib/api";
import { formatBytes, formatTimestamp } from "../lib/presentation";
import type {
  DocumentLimits,
  ExtractedPassage,
  PassageClass,
  UploadedDocument,
} from "../lib/types";
import { Callout, Counts, DataRow, Field, Hash, Panel, StateLabel, Tag } from "./ui";

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
          Upload a public or sandbox PDF. RegOS will fingerprint it, extract readable passages,
          identify possible requirements, and ask a human to review anything uncertain.
        </p>
      </section>

      <Callout tone="review" title="What this lane does and does not do">
        <p>
          Uploaded documents stay in this browser session and are never written to disk. Passages
          are classified from their language by a fixed rule — no model is called and no legal
          interpretation is performed. Draft interpretations require human review, and no
          mandatory work is created until a named person approves a structured requirement.
        </p>
        {limits && !limits.ocr_available && (
          <p className="meta">
            Scanned pages are not read: this prototype does not perform OCR, and says so per
            document rather than inventing text.
          </p>
        )}
      </Callout>

      {error && <p className="banner" role="alert"><span aria-hidden="true">✕</span>{error}</p>}

      {/* ---- Upload -------------------------------------------------- */}
      <Panel title="Add a document">
        <div className="stack">
          <div
            className={`dropzone${dragging ? " dropzone--active" : ""}`}
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
  const scope = document.scope;
  const approved = document.state === "APPROVED";

  const visible = document.passages.filter(
    (passage) => filter === "ALL" || passage.classification === filter,
  );

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
      <Panel
        title={document.filename}
        description="User-uploaded source. Not validated by SEBI, and carrying no official status here."
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
          description="Recorded with a named reviewer, a written reason, and the exact passage they were read from."
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
        description="Every passage is shown with the page it came from. Nothing here creates work on its own."
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
          <div>
            {visible.map((passage) => (
              <PassageRow
                key={passage.id}
                passage={passage}
                busy={busy}
                canApprove={passage.classification === "POSSIBLE_REQUIREMENT"}
                alreadyApproved={document.requirements.some(
                  (item) => item.passage_id === passage.id,
                )}
                onReview={(body) => onReviewPassage(passage.id, body)}
                onApprove={(body) => onApproveRequirement({ ...body, passage_id: passage.id })}
              />
            ))}
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
            className="btn btn--secondary btn--small"
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

"use client";

import { DocumentCasePanel } from "./DocumentCase";
import { Panel } from "./ui";
import type { UploadedDocument } from "../lib/types";

/**
 * "Review a requirement", for the document the reader actually added.
 *
 * The seeded walkthrough is a good demonstration and a bad answer to the
 * question this tab asks. Once someone has uploaded their own circular, a screen
 * headed "Review a requirement" that walks FAQ Q17(a) — a different source, a
 * different duration, a different firm — is showing them somebody else's work
 * under their own heading. That is the defect this product exists to catch, and
 * it had it.
 *
 * The ritual is identical because it is the same ritual: RegOS names the passage
 * whose deadline cannot be computed, the reviewer records what they think it
 * means BEFORE the system says, and only then does a named person decide. The
 * only thing that changes is whose document it runs on.
 */
export function DocumentGuidedReview({
  document,
  busy,
  onBusy,
  onError,
  onDocumentChanged,
  onOpenDocument,
}: {
  document: UploadedDocument;
  busy: boolean;
  onBusy: (value: boolean) => void;
  onError: (message: string | null) => void;
  onDocumentChanged: () => void;
  onOpenDocument: () => void;
}) {
  const scope = document.scope;
  const waiting = scope.passages_needing_review;

  return (
    <div className="stack">
      <Panel
        title="Review a requirement"
        description={`From ${document.filename} — the document you added. Every figure below is read from that file.`}
      >
        <div className="stack-s">
          <p className="lede">
            {scope.possible_requirements.toLocaleString()} of{" "}
            {scope.passages_reviewed.toLocaleString()} passages in this document are
            requirement-shaped.{" "}
            {waiting > 0 ? (
              <>
                {waiting} carr{waiting === 1 ? "ies" : "y"} more than one requirement
                strength and {waiting === 1 ? "is" : "are"} waiting on a person.
              </>
            ) : (
              <>Every passage has been settled.</>
            )}
          </p>
          <p className="meta">
            Nothing here creates work on its own. A requirement exists only once a named
            person approves it, and the record keeps their reason.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn--quiet btn--small" onClick={onOpenDocument}>
              See every passage
            </button>
          </div>
        </div>
      </Panel>

      <DocumentCasePanel
        document={document}
        busy={busy}
        onBusy={onBusy}
        onError={onError}
        onDocumentChanged={onDocumentChanged}
      />
    </div>
  );
}

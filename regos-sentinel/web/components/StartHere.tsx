"use client";

/**
 * The state this app opens in: nothing reviewed, and one thing to do.
 *
 * It used to open on the seeded demo. That put a worked example — Aster
 * Securities, FAQ Q17(a), "1 week", "1 of 2 deadline statements" — on screen as
 * though it were the reader's own review, and it stayed there beside a document
 * they had just uploaded. Numbers from one source next to a heading about
 * another is the exact defect this product exists to catch in regulators, so it
 * cannot be how the product introduces itself.
 *
 * The demo is still here and still one click away. It is now something a person
 * chooses, and while it is unchosen every surface says so rather than borrowing
 * it. Each tab gets the sentence that belongs to it: what that particular screen
 * would hold once a document exists, so the empty state teaches the app.
 */

export type StartScope = "dashboard" | "guided" | "agents" | "audit";

const WHAT_THIS_SCREEN_WOULD_HOLD: Record<StartScope, { title: string; body: string }> = {
  dashboard: {
    title: "Nothing has been reviewed in this session",
    body:
      "Add the SEBI document you want checked. The decisions waiting on you, the "
      + "deadlines and the record are all built from it, so until one is here this "
      + "page has nothing of yours to show.",
  },
  guided: {
    title: "There is no requirement to review yet",
    body:
      "This screen walks one requirement from the wording that creates it to a "
      + "decision a named person signs. It needs a document to draw that "
      + "requirement from.",
  },
  agents: {
    title: "The assistants have nothing to read",
    body:
      "All four read only the document you add, and every check they run is "
      + "reported against its passages. Add one and they have something to check.",
  },
  audit: {
    title: "The record is empty",
    body:
      "The record is written as you work: what was read, what was set aside, and "
      + "every decision with the name of the person who made it. Nothing has "
      + "happened in this session yet.",
  },
};

export function StartHere({
  scope,
  busy,
  officialSourceCount,
  onAddDocument,
  onUseBuiltIn,
}: {
  scope: StartScope;
  busy: boolean;
  /** Sources the prototype ships with — named honestly, not counted as reviewed. */
  officialSourceCount: number;
  onAddDocument: () => void;
  onUseBuiltIn: () => void;
}) {
  const copy = WHAT_THIS_SCREEN_WOULD_HOLD[scope];
  return (
    <section className="b-card dash-start" aria-labelledby="start-here-title">
      <p className="dash-decision-status">
        {/* "+" rather than a tone glyph: this is not a state the workspace is in,
            it is the one thing to do next, and it matches the action below. */}
        <span aria-hidden="true">+</span>
        Start here
      </p>
      <h2 className="dash-decision-title" id="start-here-title">
        {copy.title}
      </h2>
      <p className="dash-decision-reason">{copy.body}</p>

      <div className="btn-row">
        <button
          type="button"
          className="btn btn--primary dash-decision-action"
          disabled={busy}
          onClick={onAddDocument}
        >
          Add a document
        </button>
        <button type="button" className="btn btn--quiet" disabled={busy} onClick={onUseBuiltIn}>
          Or open the worked SEBI example
        </button>
      </div>

      <p className="dash-status">
        <span className="legend-dot legend-dot--neutral" aria-hidden="true" />
        {/* `documents`, not `corpus_packs`: of the four packs one is an empty slot
            for the reader's own upload and one is reference-only, so calling all
            four "official sources" would overstate what is here. */}
        <span>
          This prototype ships with {officialSourceCount} official SEBI source
          {officialSourceCount === 1 ? "" : "s"}, still on file · nothing has been read
          from them in this session
        </span>
      </p>
    </section>
  );
}

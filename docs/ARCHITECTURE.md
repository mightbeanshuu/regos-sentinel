# Architecture

## Current repository boundary

The implemented code in this repository is the Remotion presentation layer. The compliance services described below are a target architecture and are not represented as deployed software.

## Logical architecture

```text
Official source
    |
    v
Source registry and version identity
    |
    v
Segmentation and Coverage Ledger
    |
    v
Obligation compiler --------> Citation/provenance store
    |                                  |
    v                                  v
Verification and exception queue -> Human approval
    |
    v
Applicability engine -> Applicability Receipt
    |
    v
Compliance Twin graph
    |       |       |       |
  Owner   Control  Evidence  Deadline
    |                 |
    v                 v
Reg-Diff impact   Read-only evidence checks
    \                 /
     v               v
      Compliance Build Manifest
                |
                v
         Sandbox Test Pack
```

## Data model

The minimum durable entities are:

- `SourceDocument`
- `SourceVersion`
- `SourceSpan`
- `Obligation`
- `ObligationVersion`
- `EntityProfile`
- `ApplicabilityDecision`
- `Owner`
- `Control`
- `EvidenceRequirement`
- `EvidenceRecord`
- `ReviewDecision`
- `AuditEvent`
- `TestResult`
- `BuildManifest`

Every material derived field should retain a source locator or an explicit human-decision label.

## Trust boundaries

- Source ingestion is read-only.
- Proposed obligations remain drafts until approved.
- Ambiguous material fields block silent publication.
- Applicability distinguishes deterministic rules, model suggestions, and human confirmation.
- Evidence connectors retrieve approved metadata; they do not write to production systems.
- Evidence checks return `pass`, `fail`, or `human judgment required` rather than a legal conclusion.
- Audit events are append-oriented and versioned.

## Scalability model

Regulatory expansion uses versioned Corpus Packs rather than an unsupported claim that the model can read any document. Each pack should contain:

- source adapters and version rules;
- taxonomy mappings;
- applicability definitions;
- annotation guidance;
- labeled examples and test cases;
- known failure categories;
- evaluation thresholds.

The final-jury scalability proof should be a second small pack that passes the same gates as the initial corpus.

## Presentation implementation

`regos-motion/src/remotion/Root.tsx` registers the compositions. The current film is implemented under `regos-motion/src/remotion/pitch/` with one component per beat, shared camera and UI primitives, centralized timing, and optional media-asset flags.

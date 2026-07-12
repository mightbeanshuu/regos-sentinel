# Product Scope

## Problem statement

RegOS Sentinel targets SEBI TechSprint 2026 Problem Statement 2: **Agentic Compliance - From Regulatory Text to Operational Action**.

The official problem has two connected parts:

1. Translate new or amended regulatory text into structured operational obligations.
2. Maintain existing obligations, evidence, gaps, and audit history over time.

## Product definition

RegOS Sentinel is a supervised regulatory compiler that maintains an applicability-aware Compliance Twin.

```text
INGEST -> COMPILE -> VERIFY -> APPLY -> DIFF -> PROVE
```

### Ingest

- Register an official source and version.
- Segment and classify normative text.
- Expose unclassified or ambiguous segments in a Regulatory Coverage Ledger.

### Compile

- Propose structured actor, action, object, deadline, control, and evidence fields.
- Connect each generated field to its supporting source span.

### Verify

- Expose confidence and competing citations.
- Block publication when a material field is ambiguous.
- Record the human correction and approval.

### Apply

- Combine structured entity facts, deterministic rules, model assistance, and human confirmation.
- Produce an Applicability Receipt for applied and excluded decisions.

### Diff

- Compare source and obligation versions.
- Propagate amendments to owners, deadlines, controls, and evidence freshness.

### Prove

- Run constrained evidence checks.
- Preserve source, model, schema, reviewer, decision, and test versions.
- Export a Compliance Build Manifest and Sandbox Test Pack.

## Scope tiers

### P0 prototype

- one official SEBI source family;
- one synthetic small-intermediary profile;
- one source amendment;
- one controlled ambiguity and human review;
- one applicability decision;
- one simulated read-only evidence connector;
- one obligation test;
- one complete audit and build manifest.

### P1

- additional SEBI, NSE, BSE, CDSL, and NSDL Corpus Packs;
- read-only task, document, training, and control-metadata connectors;
- deadline horizon and owner notifications;
- private or on-premises deployment package;
- a second corpus-family evaluation.

### Vision

- minimum-cohort anonymized supervisory friction signals;
- multi-intermediary corpus packs;
- cross-regulator reference graph with mandatory legal review.

## Explicit exclusions

- autonomous regulatory filing;
- production write access;
- unrestricted AI-generated code changes;
- autonomous legal conflict resolution;
- generic blockchain or token claims;
- speech or video treated as authoritative regulation;
- legal advice or replacement of the compliance officer.

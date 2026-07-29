# Validation evidence

This file records reproducible checks for the scoped prototype. Results apply to the committed
seed, schemas, rules, and synthetic profile; they are not claims about an unlabelled regulatory
corpus or a production intermediary.

## Required commands

```bash
cd services/api
REGOS_OFFLINE=1 uv run pytest -q
uv run ruff check .
uv run python scripts/verify_offline_fallback.py
REGOS_OFFLINE=1 uv run python scripts/replay_build.py
uv run python scripts/measure_prototype.py   # regenerates docs/METRICS.md

cd ../../web
npm run typecheck
npm run build
npm audit --audit-level=high
```

## What the API tests prove

- the Q17(a) deadline row exists before review with `computable=false`, `due_date=null`, and a
  source-gap reason;
- a due date cannot coexist with missing trigger provenance;
- the four Q15–Q17 references remain blocking until their pinned spans are hashed;
- the system suggestion is absent from response payloads before the independent reading is
  committed;
- Q15 recommendation and permission statements cannot create a failing mandatory control;
- QSB half-years resolve to April–September and October–March;
- Q24/Q25 scenarios yield cited applicability receipts from the synthetic profile;
- identical inputs produce identical manifest and replay-input hashes;
- the committed golden manifest reproduces its digest byte-for-byte;
- OSCAL output passes the vendored NIST 1.2.2 assessment-results schema; and
- benchmark metrics are calculated from eight committed case outcomes.
- separate signed browser sessions cannot observe or mutate each other's workspaces;
- identical approved state produces byte-identical Compliance Build Report PDFs; and
- the before/after PDF remains one page and excludes penalty, savings, and regulatory-outcome claims.

## What the agent-layer tests prove

- no agent holds a tool that writes — the toolbox is the permission model, and a test
  enumerates it;
- every agent run is a hash-chained trace: editing any recorded step breaks
  `verify_chain`, and a run with zero steps is never presented as a result;
- a landed adversary challenge blocks publication (`TEST-ADVERSARY-001` is a build gate);
- the defect the adversary found in shipped code — a deadline attributed to FAQ Q17(b),
  which states no clock-start — stays fixed under a regression guard;
- a planner fallback names itself: a deterministic plan is never labelled as a model's;
- watching a run over the live stream records exactly the run the ordinary endpoint
  would have recorded; and
- the streamed run and the page share one workspace per browser session.

## What the scenario, corpus and metrics tests prove

- each demonstration case A–D names a committed test that actually exists, and its
  expected outcome is written down before the case runs;
- Case D's second source version is constructed and carries
  `SYNTHETIC DEMONSTRATION REVISION — NOT PUBLISHED BY SEBI` in the data itself;
- the eight corpus gates are applied identically to all three packs, and the registered
  Master Circular pack honestly reports 1 of 8;
- prototype metrics are measured against a fingerprinted gold set (n=24, labelled before
  the gate saw it) and `docs/METRICS.md` fails a test if it goes stale; and
- the runtime data the API needs ships inside `app/`, so what passes locally cannot 500
  in the container.

## What the model tests prove

- RegOS's own timing classifier (pure-stdlib logistic regression, weights committed)
  reports stratified 6-fold cross-validation accuracy of 0.977 over 87 hand-labelled
  sentences — 22 real SEBI wordings, 65 constructed and labelled `synthetic=true`;
- the model and the deterministic rule are both reported and neither overrules the
  other — disagreement is the output; and
- the Cyber Capability Index scores only the 8 of 23 parameters this workspace can
  evidence and abstains (`score=null`, never zero) on the rest.

## What the live-pulse tests prove

- `GET /api/v1/live` is a bounded server-sent stream whose pulse carries a fingerprint
  recomputed from the whole workspace on every emission; and
- the fingerprint moves when the workspace moves, so a client that refetches on change
  cannot show a stale page for longer than one pulse interval.

## Offline receipt

`demo/offline-approved-receipt.json` stores the expected build, reference-set, replay-input,
manifest, and benchmark digests for the jury scenario. The verifier runs the real domain
models without network access and exits non-zero if any recorded value differs.

## Measured benchmark scope

Label: `SMALL HUMAN-VERIFIED GOLDEN SET · n=8 · SCOPE-LIMITED`

| Operating point | Answered | Error on answered | Deferred |
| --- | ---: | ---: | ---: |
| Conservative | 75.0% | 0.0% | 25.0% |
| Balanced | 87.5% | 0.0% | 12.5% |
| Permissive | 100.0% | 12.5% | 0.0% |

These values are test-derived. They do not project performance beyond the labelled set.

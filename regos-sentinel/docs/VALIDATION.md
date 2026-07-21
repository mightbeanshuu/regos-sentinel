# Validation evidence

This file records reproducible checks for the scoped prototype. Results apply to the committed
seed, schemas, rules, and synthetic profile; they are not claims about an unlabelled regulatory
corpus or a production intermediary.

## Required commands

```bash
cd services/api
uv run pytest -q
uv run ruff check .
uv run python scripts/verify_offline_fallback.py

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

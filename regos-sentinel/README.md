# RegOS Sentinel

**Live prototype:** [regos-sentinel.vercel.app](https://regos-sentinel.vercel.app)

**Live API health:** [regos-sentinel-api-sebi.onrender.com/health](https://regos-sentinel-api-sebi.onrender.com/health)

RegOS Sentinel is a working SEBI circular-to-action prototype. It fetches the official public
CSCRF FAQ, verifies the full PDF and nine reviewed passages, checks the resulting rule against
a synthetic intermediary's current control, and stops when the source does not support a safe
due date. A compliance officer can then record the missing entity policy, approve the change,
and see the recalculated dates, assigned work, vendor advisory, and evidence impact.

The jury path demonstrates a deliberately unsafe interpretation of the SEBI CSCRF FAQ. The
source states a one-week duration for a high-severity missing-patch branch but does not state
the event that starts that clock. RegOS keeps the due date `null`, marks the build
`BLOCKED_AWAITING_HUMAN`, and publishes no manifest until a reviewer:

1. resolves the four explicit Q15–Q17 source dependencies;
2. commits an independent reading before seeing the system suggestion;
3. records an entity policy for the missing clock-start; and
4. approves the corrected branch with a written reason.

The resulting build changes one control, creates two synthetic mandatory-branch remediation
tasks, marks three synthetic evidence artifacts for revalidation, and records one vendor-SLA
advisory gap. The SLA signal is never counted as a control failure and never creates mandatory
work because FAQ Q15 uses recommendation language.

## How the interface is organised

Three in-app tabs, in the order a reviewer needs them:

1. **Guided review** — the jury path, and the four demonstration scenarios. Case A is the
   default: five steps to verify the source, compare it against the broker's existing control,
   record the human decision the source does not supply, see what changed operationally, and
   export the approved record. Cases B, C and D sit behind a small selector above it.
2. **Review your document** — upload a public or sandbox PDF into a session-private lane. RegOS
   fingerprints it, extracts text page by page, segments passages, classifies them by their own
   language, and routes everything uncertain to a person. It never converts an uploaded PDF into
   an approved legal interpretation, and it performs no OCR and no model call.
3. **Audit trail** — the technical record: sources and the eight gates each has cleared, coverage,
   requirement strength, decisions and reviewers, checks, evidence history, reproducibility,
   where the AI is and is not, the measured prototype metrics, and the abstention benchmark.

## Demonstration scenarios A–D

Four cases from the reviewed prototype corpus. They demonstrate one reusable workflow — cite,
compile, gate, defer to a person, record — across four different kinds of regulatory problem.
They do not cover the SEBI corpus and make no claim to. Every case carries the same five parts:
an exact source citation, an expected outcome written down before it runs, seeded synthetic data,
a committed automated test, and a one-click reset.

| Case | The question it answers | Expected outcome | Test |
| --- | --- | --- | --- |
| **A** · missing clock-start | The source says how long, but not from when. | No date is published. The build stops and waits for a named person. | `test_build_fails_closed_before_human_review` |
| **B** · advisory language | Does encouragement create a task, or only a record? | Recommended guidance, no mandatory task, and the shortfall still recorded. | `test_case_b_keeps_advice_out_of_mandatory_work` |
| **C** · applicability | Can an exclusion be explained as precisely as an inclusion? | Four requirements decided against entity facts; each decision carries the fact, the rule and the exact clause. | `test_case_c_receipts_an_exclusion` |
| **D** · source change | When the text moves, what happens to approved work? | Added, changed and superseded passages listed with both quotations, the controls they reach, and the evidence they requeue. Nothing applied automatically. | `test_case_d_reports_changes_without_applying_them` |

Case A is driven by the guided review itself; `POST /api/v1/scenarios/A_MISSING_TRIGGER/run`
deliberately returns 409 and says so. B, C and D run in one click and are cleared by
**Restart demo**.

**Case D uses a constructed second version.** SEBI has published one version of the FAQ this
prototype reads, so the revision it is compared against was written for the demonstration. That
is carried in the data, not only in the copy: `authority` names the prototype, `legal_state` reads
`SYNTHETIC DEMONSTRATION REVISION — NOT PUBLISHED BY SEBI`, and `synthetic` is `true`. No passage
in it may be read, quoted or exported as SEBI wording. The diff itself is computed by
`diff_provisions()` from two pinned provision sets — it is not a stored list of changes.

## Corpus packs and the eight gates

Every corpus is measured against the same eight gates — source identity, segmentation, coverage,
requirement extraction, provenance, applicability, human review, report generation — and each
pack shows honestly which ones it has cleared. `GET /api/v1/corpus/packs` serves them.

The reviewed CSCRF FAQ pack clears all eight once a build is approved. The registered Stock Broker
Master Circular clears exactly one — source identity — and shows seven untouched gates, because
nothing has been read. The upload sandbox declares two gates it deliberately does not run: no
model call and no entity applicability for a file a visitor supplied.

The point is not the number of corpora. It is that the next one meets the same gates rather than
a rewrite.

Backend enums are unchanged and precise. A single frontend module (`web/lib/presentation.ts`)
maps them to plain language, so `BLOCKED_AWAITING_HUMAN` reads as "Needs review" on screen while
staying exact in the API and the manifest. Amber always means a human decision is expected; red
is reserved for a check that actually failed.

## What runs

- Next.js/React/TypeScript cockpit
- FastAPI/Pydantic domain API
- bounded, signed, per-browser in-memory workspaces with no database or shared mutable state
- committed OpenRouter extraction cache; the jury path runs with `REGOS_OFFLINE=1`
- live official-PDF verification with full-file SHA-256 and scoped passage matching
- four-value provenance model: `SOURCE_EXPLICIT`, `DETERMINISTIC`, `AI_SUGGESTED`,
  `HUMAN_POLICY`
- canonical manifest hashing and online/offline verification
- OSCAL 1.2.2 `assessment-results` export validated against a vendored NIST schema
- measured eight-case abstention benchmark with three operating points
- four demonstration scenarios, each with a citation, an expected outcome, seeded data and a test
- deterministic source-version comparison with per-change control and evidence impact
- eight publication gates applied identically to every corpus pack
- an AI-assurance report showing, field by field, what the model proposed and what the gates did
- QSB financial-year periodicity and Q24/Q25 applicability receipts
- byte-identical Compliance Build Report and one-page before/after PDFs generated from build state
- a session-private uploaded-document lane: PDF validation, SHA-256, page-by-page extraction,
  sentence-level passage segmentation, deterministic requirement-strength classification, human
  reclassification and approval, a watermarked `DRAFT — NOT APPROVED` review packet before
  approval, and a Compliance Build Report only after it

All entity, finding, vendor, task, and evidence records are marked `synthetic: true` in API
data. The prototype is decision support: it does not provide legal advice, submit filings, or
write to regulated production systems.

## Three-line local quickstart

```bash
docker-compose up --build
open http://localhost:3000
curl http://localhost:8000/health
```

No database or model credential is required for this offline path.

## Validate

```bash
cd services/api
uv sync --dev
uv run pytest -q
uv run ruff check .
uv run python scripts/verify_offline_fallback.py
REGOS_OFFLINE=1 uv run python scripts/replay_build.py

cd ../../web
npm ci
npm run typecheck
npm run build
```

The measured prototype metrics are regenerated, never hand-written:

```bash
cd services/api
REGOS_OFFLINE=1 uv run python scripts/measure_prototype.py   # rewrites docs/METRICS.md
uv run pytest tests/test_metrics.py -q                       # fails if the doc is stale
```

Each figure in [docs/METRICS.md](docs/METRICS.md) carries the dataset it came from, the command
that reproduces it, and what it does not prove. The abstention gold set is committed at
`services/api/data/prototype_gold_set.json` (n=24, fingerprinted) and its labels were written
before the gate was pointed at them.

The benchmark can be rerun through `POST /api/v1/benchmarks/run`. Approved reports are exposed
at `GET /api/v1/builds/{build_id}/report.pdf` and
`GET /api/v1/builds/{build_id}/before-after.pdf`. Manifest verification is
available through `POST /api/v1/manifest/verify` or:

```bash
cd services/api
uv run python scripts/verify_manifest.py path/to/manifest.json
```

See [validation evidence](docs/VALIDATION.md) and the [segmentation rule](docs/SEGMENTATION.md).

## Source scope

The active hero pack contains nine human-verified spans from the 11 June 2025 CSCRF FAQ. Four
explicit dependencies are pinned from the governing CSCRF: Table 19, PR.MA Guideline 6,
Annexure-A, and PR.MA.S3. A versioned 17 June 2025 Stock Broker Master Circular pack is
registered as the next source target with zero indexed spans and zero compiled candidates, so
the interface never implies work that was not performed. A third pack represents the
session-private upload sandbox. All three are shown against the same eight gates.

`POST /api/v1/sources/verify-live` performs the public-source check. The compliance build uses
the reviewed pinned passages that were matched against that live PDF; it does not treat
unconstrained PDF extraction as an approved legal interpretation.

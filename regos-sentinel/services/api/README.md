# RegOS Sentinel API

This is the executable domain layer for the round-two prototype. It models a
small, human-verified Q14–Q25 scope from SEBI's June 2025 CSCRF FAQ and demonstrates a
fail-closed Compliance Build:

1. the generic three-month VAPT rule is present;
2. Q17's one-week missing-patch branch has no source-stated clock-start;
3. the build enters `BLOCKED_AWAITING_HUMAN` and blocks manifest export;
4. four explicit CSCRF references are hash-pinned;
5. a reviewer commits an independent reading and then approves the cited split; and
6. the control changes, a synthetic 30-day vendor SLA receives an advisory,
   evidence is marked for revalidation, and an approved manifest is generated.

The default atomic JSON store is deliberate for an offline, repeatable jury demo.
Set `REGOS_DATABASE_URL` to use the transactional PostgreSQL JSONB adapter instead;
the included compose stack enables the `vector` extension and runs that path.

## Run

```bash
uv sync --dev
uv run uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs` for the generated API console.

## Test

```bash
uv run pytest -q
uv run ruff check .
uv run python scripts/verify_offline_fallback.py
```

The eight-case benchmark is rerun through `POST /api/v1/benchmarks/run`. OSCAL validation is
available at `GET /api/v1/exports/oscal/validation` and runs against the vendored NIST 1.2.2
assessment-results schema without a network request.

## Safety boundary

All entity, vendor, task and evidence data is synthetic. Source excerpts are
human-verified against the official FAQ and explicitly identify the hash scope.
The prototype provides decision support; it does not give legal advice,
file with SEBI, or write to production systems.

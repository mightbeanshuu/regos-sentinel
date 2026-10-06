# RegOS Surveillance Desk (.NET 8)

RegOS Sentinel reads SEBI circulars and turns them into obligations a compliance team can act on. One of those
obligations is trade surveillance: NSE circular **NSE/SURV/48818 (1 Jul 2021)** requires trading members to
generate their own surveillance alerts and to process every alert **within 45 days** (para 1.2), documenting the
reason for any delay (para 1.3). This service is the part of RegOS that actually does that.

It consumes a broker's order and trade log from Kafka, runs three market-abuse detectors taken from the NSE
guidance note **NSE/INVG/65921 (31 Dec 2024)**, stores alerts in SQL Server, and gives reviewers a React console
in which the 45-day clock, the delay-reason rule and an audit trail are enforced by the API, not by convention.

```
 order/trade log ──► Kafka  surveillance.events.v1  (keyed by symbol → per-symbol ordering)
                        │
                        ▼
              KafkaIngestWorker  ── batch ──► IngestionService ──► SurveillanceEngine (in-memory windows)
              (manual offset store,           │  ProcessedEvents ledger              │  wash / spoofing / front-running
               commit after DB,               │  (idempotency)                       ▼
               rewind on failure,             └────────── one SaveChanges ◄──── AlertSignals ─► fold by dedup key
               DLQ for poison messages)                       │
                                                              ▼
                                         SQL Server: Alerts, AlertTransitions, ProcessedEvents, Clients
                                         dbo.usp_AlertAging (stored procedure)
                                                              │
               Kafka surveillance.alerts.v1 ◄── publish after commit
                                                              │
                     ASP.NET Core Web API (REST + OpenAPI) ◄──┴──► React + TypeScript console
```

## What it detects

Each rule implements a pattern the guidance note describes, and every alert carries that paragraph as its citation.
Thresholds come from configuration because the note says they are "to be determined by brokers as per their business
size". A rule with no threshold section is reported as `DISABLED`; it never runs on a guessed number.

| Rule | Fires when | Source (NSE/INVG/65921, Annexure A) |
|---|---|---|
| `WASH_TRADE` | buyer and seller are the same client, or are **KYC-linked**: they share a PAN, mobile or e-mail, directly or through a chain of accounts (union-find) | "Creation of misleading appearance of trading": connections between clients based on KYC; pre-arranged, wash or circular trades |
| `ORDER_SPOOFING` | a **large, non-marketable** limit order is cancelled within `MaxRestingTime`, and the same client (or a linked account) executes on the **other side** within `OppositeFillProximity` of the cancel, before or after it | "Order Spoofing": large non-bonafide order cancelled; an opposite order entered virtually at the same time or just before the cancellation |
| `FRONT_RUNNING` | a dealer or watch-listed account trades the **same side** within `LookbackWindow` before a **big client order**, at the same or a better price than the client's limit | "Front Running": time proximity to the big client order; same or better price |

Repeat signals with the same dedup key (for example, the same linked pair washing the same symbol on the same day)
fold into one alert with an occurrence count, which is the guidance note's "frequency of occurrence" factor.

## What the workflow enforces

- **Deadline.** `DueAt = GeneratedAt + DispositionDays` (45 by default, cited on the alert). With no value configured,
  the alert carries no deadline and its audit trail says so.
- **Who and why.** Closing needs a reviewer, a disposition and a reason (`400` otherwise).
- **Late closure.** Past `DueAt`, closing without a delay reason is refused with `422`, and the problem response
  quotes para 1.3.
- **No decisions from stale screens.** Every change carries the version the reviewer loaded. A mismatch is a `409`,
  and the UPDATE's `WHERE Version = @v` catches the race too (EF Core concurrency token).
- **Audit trail.** Every status change is an append-only `AlertTransition` row: who, when, from, to, and why.

## Measured

Run it yourself: `dotnet run -c Release --project tools/Surveillance.Sim -- eval`. CI posts the same run to every
job summary.

The simulator writes a synthetic tape: background flow between 2,000 unrelated clients, plus planted scenarios.
Each rule gets real patterns and also **near-miss decoys** that must *not* alert:
- spoofing: an order that rested too long, an opposite fill outside the window, a marketable order
- front-running: a trade outside the look-back, a trade at a worse price
- wash trades: a linked account trading with an outsider

Apple M-series laptop, .NET 8, single thread, seed 42:

```
Rule             planted  caught  decoys  false+  precision  recall
WASH_TRADE           150     150     150       0    100.0 % 100.0 %
ORDER_SPOOFING       150     150     450       0    100.0 % 100.0 %
FRONT_RUNNING        150     150     300       0    100.0 % 100.0 %

Throughput: ~6.1M events/s on 1M events (5.3M events/s on 5M), 65-67 bytes allocated per event
            2.28M events/s on the GitHub Actions ubuntu-latest runner (4 vCPU), same tape, same seed
Resident state stays bounded by the 30 s window (~3-6k trades) however long the tape is
End to end over HTTP into SQLite (JSON + ledger + commit): ~33-41k events/s
```

Read those numbers for what they are:
- **This is a synthetic tape, and the rules were written to the same definitions the generator plants.** 100% shows
  the code implements the definitions and rejects the near-misses. It is not a claim about precision on real
  market data, where the thresholds do the real work.
- **The first eval runs were not clean, and the reasons are worth knowing.**
  - Planted scenarios overlapped in time, so a dealer trade from one scenario fell inside another fund's look-back.
    The engine was right to flag it: it *is* the front-running pattern. That is exactly why the guidance leaves
    thresholds to the broker.
  - A background client's random buy landed 201 ms after that same client's cancelled decoy sell, which is a
    genuine spoof match.
  - Both were fixed in the generator, not the engine, and the generator now says why in comments.

## Design limits (on purpose, and stated)

- **One writer.** The engine's windows are only correct if each symbol's events arrive in order. Kafka gives that
  per partition (the key is the symbol), and the API serialises ingestion behind one gate. To scale, run one engine
  per partition, not more threads on one engine.
- **Window state lives in memory.** Windows are seconds long. After a restart the engine sees the redelivered
  uncommitted batch again; the ledger stops double counting, but a pattern that straddles the crash can be missed.
- **Alerts are published to Kafka after the database commit,** so a crash in between means an alert exists without
  being announced. The database is the system of record; an outbox table is the next step if downstream consumers
  need guarantees.
- **The thresholds in `appsettings.json` are a labelled synthetic demo policy.** Every alert and the console banner
  say so.

## Run it

```bash
# API + console on SQLite, no Docker needed
cd web && npm ci && npm run build && cd ..
dotnet run --project src/Surveillance.Api                # http://localhost:5080  (console at /, OpenAPI at /swagger)
dotnet run -c Release --project tools/Surveillance.Sim -- post --url http://localhost:5080 --events 200000

# Full stack: SQL Server 2022 + Kafka (KRaft) + API
docker compose up --build                                 # http://localhost:8080

# Tests: 23 engine unit tests + 13 API tests (in-process HTTP, fake clock)
dotnet test
# The same API tests against real infrastructure (CI does this with service containers):
SURV_SQLSERVER="Server=localhost,1433;User Id=sa;Password=...;TrustServerCertificate=True" \
SURV_KAFKA=localhost:9092 dotnet test tests/Surveillance.Api.Tests
```

| Endpoint | |
|---|---|
| `POST /api/events` | batch of `order_placed` / `order_cancelled` / `trade_executed` events; re-sending is safe |
| `PUT /api/clients` | upsert KYC profiles; the link graph is rebuilt before the next event |
| `GET /api/alerts?status=&rule=&symbol=&breached=` | most urgent first |
| `GET /api/alerts/{id}` | detail with audit trail |
| `POST /api/alerts/{id}/review`, `/close` | workflow; `400` / `409` / `422` as above |
| `GET /api/reports/aging` | open alerts bucketed by distance to deadline (`dbo.usp_AlertAging` on SQL Server) |
| `GET /api/policy` | thresholds in force, which rules they enable, and each rule's source paragraph |
| `GET /health` | engine counters, resident window state, Kafka consumed/dead-lettered |

## Layout

```
src/Surveillance.Core      engine, rules, KYC link graph (no I/O; 23 unit tests)
src/Surveillance.Api       ASP.NET Core Web API, EF Core (SQL Server / SQLite), Kafka consumer + producer
web/                       React 18 + TypeScript console (Vite), built into the API's wwwroot
tools/Surveillance.Sim     synthetic tape generator, evaluator, HTTP loader
tests/                     xUnit: engine rules, API workflow, SQL Server + Kafka integration
```

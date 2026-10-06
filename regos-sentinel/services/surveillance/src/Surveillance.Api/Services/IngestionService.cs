using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Surveillance.Api.Data;
using Surveillance.Api.Messaging;
using Surveillance.Core.Domain;

namespace Surveillance.Api.Services;

public sealed record IngestResult(int Received, int Duplicates, int Processed, int AlertsCreated, int AlertsUpdated);

/// <summary>
/// The one path every event takes, whether it came from Kafka or the REST endpoint:
/// skip ids already in the ledger, run the rest through the engine in order, fold signals into alerts,
/// and commit ledger + alerts in one transaction. A redelivered batch is therefore a no-op.
/// </summary>
public sealed class IngestionService(
    SurveillanceDbContext db,
    EngineHost host,
    IAlertPublisher publisher,
    TimeProvider clock,
    ILogger<IngestionService> log)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private const int MaxEvidencePerAlert = 50;

    public async Task<IngestResult> IngestAsync(IReadOnlyList<MarketEvent> batch, CancellationToken ct)
    {
        await host.Gate.WaitAsync(ct);
        try
        {
            var ids = batch.Select(e => e.EventId).Distinct().ToList();
            var seen = (await db.ProcessedEvents.Where(p => ids.Contains(p.EventId)).Select(p => p.EventId).ToListAsync(ct))
                .ToHashSet(StringComparer.Ordinal);

            var now = clock.GetUtcNow().UtcDateTime;
            var signals = new List<AlertSignal>();
            var processed = 0;
            foreach (var e in batch)
            {
                if (!seen.Add(e.EventId)) continue; // already in the ledger, or repeated inside this batch
                signals.AddRange(host.Engine.Process(e));
                db.ProcessedEvents.Add(new ProcessedEvent { EventId = e.EventId, ProcessedAt = now });
                processed++;
            }

            var (created, updated) = await FoldAsync(signals, now, ct);

            // One SaveChanges = one transaction: the ledger rows and the alerts commit together or not at all.
            await db.SaveChangesAsync(ct);

            if (created.Count > 0) await publisher.PublishAsync(created, ct);
            if (signals.Count > 0)
                log.LogInformation("Ingested {Processed} events: {Created} new alerts, {Updated} folded", processed, created.Count, updated);

            return new IngestResult(batch.Count, batch.Count - processed, processed, created.Count, updated);
        }
        finally
        {
            host.Gate.Release();
        }
    }

    /// <summary>A signal joins the open alert with the same dedup key; otherwise it opens a new one with a deadline.</summary>
    private async Task<(List<AlertEntity> Created, int Updated)> FoldAsync(List<AlertSignal> signals, DateTime now, CancellationToken ct)
    {
        var created = new List<AlertEntity>();
        var updated = 0;
        if (signals.Count == 0) return (created, 0);

        var keys = signals.Select(s => s.DedupKey).Distinct().ToList();
        var open = await db.Alerts
            .Where(a => keys.Contains(a.DedupKey) && a.Status != AlertStatus.Closed)
            .ToDictionaryAsync(a => a.DedupKey, ct);

        foreach (var s in signals)
        {
            if (open.TryGetValue(s.DedupKey, out var alert))
            {
                var evidence = JsonSerializer.Deserialize<List<string>>(alert.EvidenceJson, Json) ?? new();
                evidence.AddRange(s.EvidenceEventIds.Where(id => !evidence.Contains(id)));
                alert.EvidenceJson = JsonSerializer.Serialize(evidence.TakeLast(MaxEvidencePerAlert), Json);
                alert.Occurrences++;
                alert.LastObservedAt = s.ObservedAt.UtcDateTime;
                if (s.Severity > alert.Severity) alert.Severity = s.Severity;
                if (db.Entry(alert).State != EntityState.Added) { alert.Version++; updated++; }
                continue;
            }

            alert = new AlertEntity
            {
                Id = Guid.NewGuid(),
                DedupKey = s.DedupKey,
                RuleId = s.RuleId,
                Symbol = s.Symbol,
                Severity = s.Severity,
                Status = AlertStatus.Open,
                Summary = s.Summary,
                Citation = s.Citation,
                ClientIdsJson = JsonSerializer.Serialize(s.ClientIds, Json),
                EvidenceJson = JsonSerializer.Serialize(s.EvidenceEventIds, Json),
                FirstObservedAt = s.ObservedAt.UtcDateTime,
                LastObservedAt = s.ObservedAt.UtcDateTime,
                GeneratedAt = now,
                DueAt = host.Policy.DispositionDays is { } days ? now.AddDays(days) : null,
            };
            alert.Transitions.Add(new AlertTransition
            {
                From = null, To = AlertStatus.Open, Actor = "engine", At = now,
                Note = host.Policy.DispositionDays is { } d
                    ? $"Generated; due in {d} days under {Citations.DispositionDeadline}"
                    : "Generated; no disposition deadline configured in policy",
            });
            db.Alerts.Add(alert);
            open[s.DedupKey] = alert;
            created.Add(alert);
        }
        return (created, updated);
    }
}

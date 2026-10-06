using Microsoft.EntityFrameworkCore;
using Surveillance.Api.Data;

namespace Surveillance.Api.Services;

public sealed record AgingRow(
    string RuleId, int OpenAlerts, int NoDeadline, int Breached, int DueWithin7Days, int DueIn8To30Days, int DueLater, DateTime? NextDueAt);

public sealed record AgingReport(DateTime AsOf, string ComputedBy, IReadOnlyList<AgingRow> Rows);

/// <summary>
/// On SQL Server the report runs inside the database as <c>dbo.usp_AlertAging</c>; on SQLite (local dev, unit tests)
/// the same buckets are computed in LINQ. The integration test checks both give the same answer.
/// </summary>
public sealed class AgingReportService(SurveillanceDbContext db, TimeProvider clock)
{
    public async Task<AgingReport> GetAsync(CancellationToken ct)
    {
        var asOf = clock.GetUtcNow().UtcDateTime;
        if (db.Database.IsSqlServer())
        {
            var rows = await db.Database
                .SqlQuery<AgingRow>($"EXEC dbo.usp_AlertAging @AsOf = {asOf}")
                .ToListAsync(ct);
            return new AgingReport(asOf, "dbo.usp_AlertAging", rows);
        }
        return new AgingReport(asOf, "linq", await ComputeInProcessAsync(asOf, ct));
    }

    public async Task<IReadOnlyList<AgingRow>> ComputeInProcessAsync(DateTime asOf, CancellationToken ct)
    {
        var open = await db.Alerts.AsNoTracking()
            .Where(a => a.Status != AlertStatus.Closed)
            .Select(a => new { a.RuleId, a.DueAt })
            .ToListAsync(ct);

        return open
            .GroupBy(a => a.RuleId)
            .Select(g => new AgingRow(
                g.Key,
                g.Count(),
                g.Count(a => a.DueAt is null),
                g.Count(a => a.DueAt < asOf),
                g.Count(a => a.DueAt >= asOf && a.DueAt < asOf.AddDays(7)),
                g.Count(a => a.DueAt >= asOf.AddDays(7) && a.DueAt < asOf.AddDays(30)),
                g.Count(a => a.DueAt >= asOf.AddDays(30)),
                g.Min(a => a.DueAt)))
            .OrderByDescending(r => r.Breached).ThenBy(r => r.RuleId, StringComparer.Ordinal)
            .ToList();
    }
}

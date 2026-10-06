using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Surveillance.Api.Data;
using Surveillance.Core.Domain;

namespace Surveillance.Api.Services;

/// <summary>A rule of the workflow was broken. Maps to a 4xx problem response carrying the source that imposes the rule.</summary>
public sealed class WorkflowException(int status, string title, string detail, string? citation = null) : Exception(detail)
{
    public int Status { get; } = status;
    public string Title { get; } = title;
    public string? Citation { get; } = citation;
}

public sealed record AlertQuery(AlertStatus? Status, string? Rule, string? Symbol, bool? Breached, int Page = 1, int PageSize = 50);

public sealed record AlertDto(
    Guid Id, string RuleId, string Symbol, Severity Severity, AlertStatus Status, string Summary, string Citation,
    IReadOnlyList<string> ClientIds, IReadOnlyList<string> EvidenceEventIds, int Occurrences,
    DateTime FirstObservedAt, DateTime LastObservedAt, DateTime GeneratedAt, DateTime? DueAt,
    int? DaysToDue, bool Breached, DateTime? ClosedAt, Disposition? Disposition, string? ClosedBy,
    string? ClosingReason, string? DelayReason, int Version, IReadOnlyList<TransitionDto>? Transitions);

public sealed record TransitionDto(AlertStatus? From, AlertStatus To, string Actor, string Note, DateTime At);

public sealed record PagedAlerts(int Total, int Page, int PageSize, IReadOnlyList<AlertDto> Items);

public sealed record ReviewRequest(string Reviewer, string? Note, int Version);

public sealed record CloseRequest(string Reviewer, Disposition Disposition, string Reason, string? DelayReason, int Version);

public sealed class AlertService(SurveillanceDbContext db, TimeProvider clock)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task<PagedAlerts> ListAsync(AlertQuery q, CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var pageSize = Math.Clamp(q.PageSize, 1, 200);
        var page = Math.Max(1, q.Page);

        var query = db.Alerts.AsNoTracking();
        if (q.Status is { } st) query = query.Where(a => a.Status == st);
        if (!string.IsNullOrWhiteSpace(q.Rule)) query = query.Where(a => a.RuleId == q.Rule);
        if (!string.IsNullOrWhiteSpace(q.Symbol)) query = query.Where(a => a.Symbol == q.Symbol);
        if (q.Breached == true) query = query.Where(a => a.Status != AlertStatus.Closed && a.DueAt != null && a.DueAt < now);

        var total = await query.CountAsync(ct);
        // Most urgent first: open work by deadline, then everything else newest first.
        var rows = await query
            .OrderBy(a => a.Status == AlertStatus.Closed)
            .ThenBy(a => a.DueAt == null)
            .ThenBy(a => a.DueAt)
            .ThenByDescending(a => a.GeneratedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(ct);

        return new PagedAlerts(total, page, pageSize, rows.Select(a => ToDto(a, now, null)).ToList());
    }

    public async Task<AlertDto?> GetAsync(Guid id, CancellationToken ct)
    {
        var a = await db.Alerts.AsNoTracking().Include(x => x.Transitions).FirstOrDefaultAsync(x => x.Id == id, ct);
        return a is null ? null : ToDto(a, clock.GetUtcNow().UtcDateTime, a.Transitions.OrderBy(t => t.At).ThenBy(t => t.Id));
    }

    public async Task<AlertDto> ReviewAsync(Guid id, ReviewRequest r, CancellationToken ct)
    {
        Require(r.Reviewer, "reviewer");
        var a = await LoadForChange(id, r.Version, ct);
        if (a.Status != AlertStatus.Open)
            throw new WorkflowException(409, "Alert is not open", $"Alert is {a.Status}; only an open alert can be taken into review.");

        var now = clock.GetUtcNow().UtcDateTime;
        Move(a, AlertStatus.UnderReview, r.Reviewer.Trim(), r.Note?.Trim() ?? "Taken into review", now);
        return await SaveAsync(a, now, ct);
    }

    public async Task<AlertDto> CloseAsync(Guid id, CloseRequest r, CancellationToken ct)
    {
        Require(r.Reviewer, "reviewer");
        Require(r.Reason, "reason");
        var a = await LoadForChange(id, r.Version, ct);
        if (a.Status == AlertStatus.Closed)
            throw new WorkflowException(409, "Alert already closed", $"Closed by {a.ClosedBy} at {a.ClosedAt:u}.");

        var now = clock.GetUtcNow().UtcDateTime;
        var late = a.DueAt is { } due && now > due;
        if (late && string.IsNullOrWhiteSpace(r.DelayReason))
            throw new WorkflowException(422, "Delay reason required",
                $"This alert was due {a.DueAt:u} and is being closed {(now - a.DueAt!.Value).TotalDays:0.#} days late. " +
                "Record why the disposition was delayed.", Citations.DispositionDeadline);

        a.Disposition = r.Disposition;
        a.ClosedBy = r.Reviewer.Trim();
        a.ClosingReason = r.Reason.Trim();
        a.DelayReason = late ? r.DelayReason!.Trim() : null;
        a.ClosedAt = now;
        Move(a, AlertStatus.Closed, a.ClosedBy, $"{r.Disposition}: {a.ClosingReason}" + (late ? $" | delay: {a.DelayReason}" : ""), now);
        return await SaveAsync(a, now, ct);
    }

    private async Task<AlertEntity> LoadForChange(Guid id, int expectedVersion, CancellationToken ct)
    {
        var a = await db.Alerts.Include(x => x.Transitions).FirstOrDefaultAsync(x => x.Id == id, ct)
                ?? throw new WorkflowException(404, "Alert not found", $"No alert {id}.");
        if (a.Version != expectedVersion)
            throw new WorkflowException(409, "Alert changed since you loaded it",
                $"You sent version {expectedVersion}; the alert is at version {a.Version}. Reload and decide again.");
        return a;
    }

    private static void Move(AlertEntity a, AlertStatus to, string actor, string note, DateTime now)
    {
        a.Transitions.Add(new AlertTransition { AlertId = a.Id, From = a.Status, To = to, Actor = actor, Note = note, At = now });
        a.Status = to;
        a.Version++;
    }

    private async Task<AlertDto> SaveAsync(AlertEntity a, DateTime now, CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            // Someone else saved between our read and our write: the version check in the UPDATE's WHERE clause caught it.
            throw new WorkflowException(409, "Alert changed since you loaded it", "Another reviewer updated this alert first. Reload and decide again.");
        }
        return ToDto(a, now, a.Transitions.OrderBy(t => t.At).ThenBy(t => t.Id));
    }

    private static void Require(string? value, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new WorkflowException(400, $"'{field}' is required", $"A disposition must say who decided and why; '{field}' was empty.");
    }

    private static AlertDto ToDto(AlertEntity a, DateTime now, IEnumerable<AlertTransition>? transitions)
    {
        // Whole days, rounded away from the deadline: 44.9 days left reads "45", 0.2 days overdue reads "-1".
        int? daysToDue = a.DueAt is { } due
            ? (int)((due - now).TotalDays is var left && left >= 0 ? Math.Ceiling(left) : Math.Floor(left))
            : null;
        var breached = a.Status != AlertStatus.Closed && a.DueAt is { } d && now > d;
        return new AlertDto(
            a.Id, a.RuleId, a.Symbol, a.Severity, a.Status, a.Summary, a.Citation,
            JsonSerializer.Deserialize<List<string>>(a.ClientIdsJson, Json) ?? new(),
            JsonSerializer.Deserialize<List<string>>(a.EvidenceJson, Json) ?? new(),
            a.Occurrences, a.FirstObservedAt, a.LastObservedAt, a.GeneratedAt, a.DueAt, daysToDue, breached,
            a.ClosedAt, a.Disposition, a.ClosedBy, a.ClosingReason, a.DelayReason, a.Version,
            transitions?.Select(t => new TransitionDto(t.From, t.To, t.Actor, t.Note, t.At)).ToList());
    }
}

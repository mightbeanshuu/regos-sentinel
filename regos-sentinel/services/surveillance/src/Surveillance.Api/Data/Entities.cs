using Surveillance.Core.Domain;

namespace Surveillance.Api.Data;

public enum AlertStatus { Open = 0, UnderReview = 1, Closed = 2 }

public enum Disposition { NoAdverseFinding = 0, ReportedToExchange = 1, ClientRestricted = 2 }

/// <summary>All timestamps are UTC <see cref="DateTime"/> so SQL Server and SQLite order and compare them the same way.</summary>
public sealed class AlertEntity
{
    public Guid Id { get; set; }
    public string DedupKey { get; set; } = "";
    public string RuleId { get; set; } = "";
    public string Symbol { get; set; } = "";
    public Severity Severity { get; set; }
    public AlertStatus Status { get; set; }
    public string Summary { get; set; } = "";
    public string Citation { get; set; } = "";
    public string ClientIdsJson { get; set; } = "[]";
    public string EvidenceJson { get; set; } = "[]";
    public int Occurrences { get; set; } = 1;

    /// <summary>Event time of the first and latest evidence.</summary>
    public DateTime FirstObservedAt { get; set; }
    public DateTime LastObservedAt { get; set; }

    /// <summary>Wall-clock time the alert was generated at the member's end: the 45-day clock starts here.</summary>
    public DateTime GeneratedAt { get; set; }
    public DateTime? DueAt { get; set; }

    public DateTime? ClosedAt { get; set; }
    public Disposition? Disposition { get; set; }
    public string? ClosedBy { get; set; }
    public string? ClosingReason { get; set; }
    public string? DelayReason { get; set; }

    /// <summary>Optimistic-concurrency token: two reviewers cannot both close the same alert from stale screens.</summary>
    public int Version { get; set; }

    public List<AlertTransition> Transitions { get; set; } = new();
}

/// <summary>Append-only audit trail of every status change and who made it.</summary>
public sealed class AlertTransition
{
    public long Id { get; set; }
    public Guid AlertId { get; set; }
    public AlertStatus? From { get; set; }
    public AlertStatus To { get; set; }
    public string Actor { get; set; } = "";
    public string Note { get; set; } = "";
    public DateTime At { get; set; }
}

/// <summary>Idempotency ledger: an event id is processed at most once, however many times Kafka redelivers it.</summary>
public sealed class ProcessedEvent
{
    public string EventId { get; set; } = "";
    public DateTime ProcessedAt { get; set; }
}

public sealed class ClientEntity
{
    public string ClientId { get; set; } = "";
    public string? Pan { get; set; }
    public string? Mobile { get; set; }
    public string? Email { get; set; }
    public bool IsDealer { get; set; }
    public bool OnWatchlist { get; set; }
}

namespace Surveillance.Core.Domain;

/// <summary>
/// Thresholds are the broker's to set: the guidance note says they are "to be determined by brokers as per
/// their business size". A rule whose section is missing is reported as disabled, never run on a guessed number.
/// </summary>
public sealed class SurveillancePolicy
{
    public WashTradePolicy? WashTrade { get; init; }
    public SpoofingPolicy? Spoofing { get; init; }
    public FrontRunningPolicy? FrontRunning { get; init; }

    /// <summary>Days allowed to dispose of an alert. Null means no deadline is computed and the alert says so.</summary>
    public int? DispositionDays { get; init; }

    /// <summary>Who approved these thresholds and when; shown on every alert so nobody mistakes a demo file for policy.</summary>
    public string ApprovedBy { get; init; } = "UNAPPROVED";

    public IEnumerable<(string RuleId, bool Enabled)> RuleStates()
    {
        yield return (RuleIds.WashTrade, WashTrade is not null);
        yield return (RuleIds.Spoofing, Spoofing is not null);
        yield return (RuleIds.FrontRunning, FrontRunning is not null);
    }

    /// <summary>The longest look-back any enabled rule needs; the engine forgets trades older than this.</summary>
    public TimeSpan RetentionWindow()
    {
        var spans = new List<TimeSpan> { TimeSpan.FromSeconds(1) };
        if (Spoofing is not null) spans.Add(Spoofing.OppositeFillProximity);
        if (FrontRunning is not null) spans.Add(FrontRunning.LookbackWindow);
        return spans.Max();
    }
}

public sealed class WashTradePolicy
{
    /// <summary>Ignore matched trades below this quantity.</summary>
    public long MinQuantity { get; init; } = 1;
}

public sealed class SpoofingPolicy
{
    /// <summary>An order at or above this quantity is "large".</summary>
    public long LargeOrderQuantity { get; init; }

    /// <summary>A large order cancelled within this long of being placed is a candidate.</summary>
    public TimeSpan MaxRestingTime { get; init; }

    /// <summary>How close (either side of the cancel) the opposite-side execution must be.</summary>
    public TimeSpan OppositeFillProximity { get; init; }
}

public sealed class FrontRunningPolicy
{
    /// <summary>A client order at or above this quantity is a "big client order".</summary>
    public long BigOrderQuantity { get; init; }

    /// <summary>How far before the big order a same-side trade still counts as "in time proximity".</summary>
    public TimeSpan LookbackWindow { get; init; }

    /// <summary>Only accounts flagged as dealers or watch-listed can be front-runners (cuts noise from ordinary clients).</summary>
    public bool OnlyDealersOrWatchlist { get; init; } = true;
}

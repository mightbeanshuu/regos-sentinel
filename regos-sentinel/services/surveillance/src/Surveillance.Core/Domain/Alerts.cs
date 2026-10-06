namespace Surveillance.Core.Domain;

public enum Severity { Low, Medium, High }

public static class RuleIds
{
    public const string WashTrade = "WASH_TRADE";
    public const string Spoofing = "ORDER_SPOOFING";
    public const string FrontRunning = "FRONT_RUNNING";
}

/// <summary>
/// What a rule emits. The engine never decides what an alert means; it records what it saw and
/// which source paragraph made it look. A person disposes of it.
/// </summary>
/// <param name="DedupKey">Signals with the same key fold into one alert (the "frequency of occurrence" factor).</param>
/// <param name="ObservedAt">Event time of the evidence that completed the pattern.</param>
public sealed record AlertSignal(
    string RuleId,
    string DedupKey,
    string Symbol,
    DateTimeOffset ObservedAt,
    Severity Severity,
    IReadOnlyList<string> ClientIds,
    string Summary,
    IReadOnlyList<string> EvidenceEventIds,
    string Citation);

public static class Citations
{
    public const string GuidanceNote =
        "NSE/INVG/65921 (31 Dec 2024), Annexure A, issued under SEBI/HO/MIRSD/MIRSD-PoD-1/P/CIR/2024/96 (4 Jul 2024)";

    public const string WashTrade = GuidanceNote +
        " - 'Creation of misleading appearance of trading': potential connections between clients based on KYC; " +
        "matched trades that suggest pre-arranged, wash or circular trading; time proximity of order entries.";

    public const string Spoofing = GuidanceNote +
        " - 'Order Spoofing': a large non-bonafide, non-marketable limit order is cancelled and an order on the other " +
        "side is entered virtually at the same time or just before the cancellation.";

    public const string FrontRunning = GuidanceNote +
        " - 'Front Running': time proximity of the front-running order to the big client's order; same or better price.";

    public const string DispositionDeadline =
        "NSE/SURV/48818 (1 Jul 2021), para 1.2: processing of alerts within 45 days; para 1.3: documentation of " +
        "reasons for any delay in disposition.";
}

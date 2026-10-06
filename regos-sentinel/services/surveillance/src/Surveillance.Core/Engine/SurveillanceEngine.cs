using Surveillance.Core.Domain;
using Surveillance.Core.Kyc;
using static System.FormattableString;

namespace Surveillance.Core.Engine;

/// <summary>
/// Streaming detector. Feed it one symbol-ordered event at a time; it keeps only the state the enabled
/// rules need (large resting orders, a time-bounded tail of trades, cancelled orders awaiting an
/// opposite fill) and forgets everything older than the policy's longest window.
/// Not thread-safe: run one engine per partition, or serialise calls.
/// </summary>
public sealed class SurveillanceEngine
{
    private readonly SurveillancePolicy _policy;
    private readonly TimeSpan _retention;
    private readonly Dictionary<string, SymbolState> _symbols = new(StringComparer.Ordinal);
    private KycLinkGraph _kyc;

    public SurveillanceEngine(SurveillancePolicy policy, KycLinkGraph kyc)
    {
        _policy = policy;
        _kyc = kyc;
        _retention = policy.RetentionWindow();
    }

    public EngineStats Stats { get; } = new();

    public SurveillancePolicy Policy => _policy;

    /// <summary>Swap in a rebuilt KYC graph (clients were added or edited). In-flight window state is kept.</summary>
    public void ReplaceKyc(KycLinkGraph kyc) => _kyc = kyc;

    public IReadOnlyList<AlertSignal> Process(MarketEvent e)
    {
        var s = State(e.Symbol);
        if (e.Ts < s.Watermark) Stats.OutOfOrderEvents++;
        else s.Watermark = e.Ts;
        Evict(s, e.Ts);

        var signals = new List<AlertSignal>(0);
        switch (e)
        {
            case OrderPlaced o:
                OnOrderPlaced(s, o, signals);
                break;
            case OrderCancelled c:
                OnOrderCancelled(s, c, signals);
                break;
            case TradeExecuted t:
                OnTrade(s, t, signals);
                s.RecentTrades.Enqueue(t);
                break;
        }

        Stats.EventsProcessed++;
        foreach (var sig in signals) Stats.Count(sig.RuleId);
        return signals;
    }

    // ---- order placed: front-running look-back + remember large non-marketable orders --------------

    private void OnOrderPlaced(SymbolState s, OrderPlaced o, List<AlertSignal> signals)
    {
        if (_policy.Spoofing is { } sp && o.Quantity >= sp.LargeOrderQuantity && !o.IsMarketable)
            s.LargeRestingOrders[o.OrderId] = o;

        if (_policy.FrontRunning is { } fr && o.Quantity >= fr.BigOrderQuantity)
            DetectFrontRunning(s, o, fr, signals);
    }

    private void DetectFrontRunning(SymbolState s, OrderPlaced big, FrontRunningPolicy fr, List<AlertSignal> signals)
    {
        var from = big.Ts - fr.LookbackWindow;
        var byRunner = new Dictionary<string, List<TradeExecuted>>(StringComparer.Ordinal);

        foreach (var t in s.RecentTrades)
        {
            if (t.Ts < from || t.Ts >= big.Ts) continue;
            var runner = t.ClientOn(big.Side);
            if (runner == big.ClientId || _kyc.AreLinked(runner, big.ClientId)) continue; // same beneficial owner
            var sameOrBetter = big.Side == Side.Buy ? t.Price <= big.LimitPrice : t.Price >= big.LimitPrice;
            if (!sameOrBetter) continue;
            if (fr.OnlyDealersOrWatchlist && _kyc.Profile(runner) is not ({ IsDealer: true } or { OnWatchlist: true })) continue;
            (byRunner.TryGetValue(runner, out var list) ? list : byRunner[runner] = new()).Add(t);
        }

        foreach (var (runner, trades) in byRunner)
        {
            var isDealer = _kyc.Profile(runner)?.IsDealer == true;
            var verb = big.Side == Side.Buy ? "bought" : "sold";
            var lead = (big.Ts - trades.Min(t => t.Ts)).TotalSeconds;
            signals.Add(new AlertSignal(
                RuleIds.FrontRunning,
                $"{RuleIds.FrontRunning}|{big.Symbol}|{runner}|{big.OrderId}",
                big.Symbol,
                big.Ts,
                isDealer ? Severity.High : Severity.Medium,
                new[] { runner, big.ClientId },
                Invariant($"{runner} ({(isDealer ? "dealer" : "watch-listed")}) {verb} {trades.Sum(t => t.Quantity):N0} {big.Symbol} ") +
                Invariant($"across {trades.Count} trade(s) in the {lead:0.#}s before {big.ClientId}'s {big.Quantity:N0}-share ") +
                Invariant($"{big.Side.ToString().ToLowerInvariant()} order @ {big.LimitPrice}; prices {trades.Min(t => t.Price)}-") +
                Invariant($"{trades.Max(t => t.Price)} were at or better than the client's limit."),
                trades.Select(t => t.EventId).Append(big.EventId).ToArray(),
                Citations.FrontRunning));
        }
    }

    // ---- order cancelled: large non-marketable order pulled quickly ----------------------------------

    private void OnOrderCancelled(SymbolState s, OrderCancelled c, List<AlertSignal> signals)
    {
        if (_policy.Spoofing is not { } sp) return;
        if (!s.LargeRestingOrders.Remove(c.OrderId, out var o)) return;
        if (c.Ts - o.Ts > sp.MaxRestingTime) return;

        // Opposite-side execution "just before the cancellation"...
        TradeExecuted? before = null;
        foreach (var t in s.RecentTrades)
            if (t.Ts >= c.Ts - sp.OppositeFillProximity && t.Ts <= c.Ts && t.Ts >= o.Ts &&
                _kyc.AreLinked(t.ClientOn(o.Side.Opposite()), o.ClientId))
                before = t; // keep the latest

        if (before is not null) signals.Add(SpoofSignal(o, c, before));
        else s.PendingSpoofs.Add(new PendingSpoof(o, c, c.Ts + sp.OppositeFillProximity)); // ...or "virtually at the same time"
    }

    // ---- trade: wash/self trade, and completes a pending spoof ---------------------------------------

    private void OnTrade(SymbolState s, TradeExecuted t, List<AlertSignal> signals)
    {
        if (_policy.WashTrade is { } wp && t.Quantity >= wp.MinQuantity && _kyc.AreLinked(t.BuyClientId, t.SellClientId))
        {
            var self = t.BuyClientId == t.SellClientId;
            var pair = string.CompareOrdinal(t.BuyClientId, t.SellClientId) <= 0
                ? $"{t.BuyClientId}+{t.SellClientId}" : $"{t.SellClientId}+{t.BuyClientId}";
            var why = string.Join(", ", _kyc.SharedAttributes(t.BuyClientId, t.SellClientId));
            signals.Add(new AlertSignal(
                RuleIds.WashTrade,
                Invariant($"{RuleIds.WashTrade}|{t.Symbol}|{pair}|{t.Ts.UtcDateTime:yyyy-MM-dd}"),
                t.Symbol,
                t.Ts,
                self ? Severity.High : Severity.Medium,
                self ? new[] { t.BuyClientId } : new[] { t.BuyClientId, t.SellClientId },
                self
                    ? Invariant($"Self-trade: {t.BuyClientId} was on both sides of {t.Quantity:N0} {t.Symbol} @ {t.Price}.")
                    : Invariant($"{t.BuyClientId} bought {t.Quantity:N0} {t.Symbol} @ {t.Price} from {t.SellClientId}; the two are KYC-linked ({why})."),
                new[] { t.EventId },
                Citations.WashTrade));
        }

        if (s.PendingSpoofs.Count == 0) return;
        for (var i = s.PendingSpoofs.Count - 1; i >= 0; i--)
        {
            var p = s.PendingSpoofs[i];
            if (t.Ts > p.Deadline) continue;
            if (!_kyc.AreLinked(t.ClientOn(p.Order.Side.Opposite()), p.Order.ClientId)) continue;
            signals.Add(SpoofSignal(p.Order, p.Cancel, t));
            s.PendingSpoofs.RemoveAt(i);
        }
    }

    private static AlertSignal SpoofSignal(OrderPlaced o, OrderCancelled c, TradeExecuted fill)
    {
        var rested = (c.Ts - o.Ts).TotalMilliseconds;
        var gap = (fill.Ts - c.Ts).TotalMilliseconds;
        var when = gap < 0 ? Invariant($"{-gap:0} ms before") : Invariant($"{gap:0} ms after");
        var oppVerb = o.Side == Side.Buy ? "sold" : "bought";
        return new AlertSignal(
            RuleIds.Spoofing,
            $"{RuleIds.Spoofing}|{o.Symbol}|{o.OrderId}",
            o.Symbol,
            fill.Ts > c.Ts ? fill.Ts : c.Ts,
            Severity.High,
            new[] { o.ClientId },
            Invariant($"{o.ClientId} placed a non-marketable {o.Side.ToString().ToLowerInvariant()} for {o.Quantity:N0} {o.Symbol} @ {o.LimitPrice} ") +
            Invariant($"(book {o.BestBid}/{o.BestAsk}), cancelled it after {rested:0} ms, and {oppVerb} {fill.Quantity:N0} @ {fill.Price} {when} the cancel."),
            new[] { o.EventId, c.EventId, fill.EventId },
            Citations.Spoofing);
    }

    // ---- state ---------------------------------------------------------------------------------------

    private SymbolState State(string symbol)
    {
        if (!_symbols.TryGetValue(symbol, out var s)) _symbols[symbol] = s = new SymbolState();
        return s;
    }

    private void Evict(SymbolState s, DateTimeOffset now)
    {
        var horizon = now - _retention;
        while (s.RecentTrades.Count > 0 && s.RecentTrades.Peek().Ts < horizon) s.RecentTrades.Dequeue();
        if (s.PendingSpoofs.Count > 0) s.PendingSpoofs.RemoveAll(p => p.Deadline < now);
        if (_policy.Spoofing is { } sp && s.LargeRestingOrders.Count > 0)
        {
            var stale = now - sp.MaxRestingTime;
            foreach (var id in s.LargeRestingOrders.Where(kv => kv.Value.Ts < stale).Select(kv => kv.Key).ToList())
                s.LargeRestingOrders.Remove(id);
        }
    }

    /// <summary>Resident state across all symbols, for the /health endpoint and the memory test.</summary>
    public (int Trades, int RestingLargeOrders, int PendingSpoofs) ResidentState() =>
        (_symbols.Values.Sum(s => s.RecentTrades.Count),
         _symbols.Values.Sum(s => s.LargeRestingOrders.Count),
         _symbols.Values.Sum(s => s.PendingSpoofs.Count));

    private sealed class SymbolState
    {
        public DateTimeOffset Watermark = DateTimeOffset.MinValue;
        public readonly Queue<TradeExecuted> RecentTrades = new();
        public readonly Dictionary<string, OrderPlaced> LargeRestingOrders = new(StringComparer.Ordinal);
        public readonly List<PendingSpoof> PendingSpoofs = new();
    }

    private sealed record PendingSpoof(OrderPlaced Order, OrderCancelled Cancel, DateTimeOffset Deadline);
}

public sealed class EngineStats
{
    public long EventsProcessed;
    public long OutOfOrderEvents;
    public readonly Dictionary<string, long> SignalsByRule = new();
    public void Count(string ruleId) => SignalsByRule[ruleId] = SignalsByRule.GetValueOrDefault(ruleId) + 1;
}

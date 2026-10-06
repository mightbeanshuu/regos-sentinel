using Surveillance.Core.Domain;
using Surveillance.Core.Engine;
using Surveillance.Core.Kyc;

namespace Surveillance.Core.Tests;

public class RuleTests
{
    private static readonly SurveillancePolicy Policy = new()
    {
        WashTrade = new WashTradePolicy { MinQuantity = 1 },
        Spoofing = new SpoofingPolicy
        {
            LargeOrderQuantity = 10_000,
            MaxRestingTime = TimeSpan.FromSeconds(2),
            OppositeFillProximity = TimeSpan.FromMilliseconds(500),
        },
        FrontRunning = new FrontRunningPolicy
        {
            BigOrderQuantity = 50_000,
            LookbackWindow = TimeSpan.FromSeconds(30),
        },
        DispositionDays = 45,
    };

    private static readonly KycLinkGraph Kyc = KycLinkGraph.Build(new[]
    {
        new ClientProfile("ALICE", Pan: "AAAAA1111A", Mobile: "9000000001"),
        new ClientProfile("ALICE_HUF", Mobile: "9000000001"),          // same phone as ALICE
        new ClientProfile("BOB", Pan: "BBBBB2222B"),
        new ClientProfile("CAROL", Pan: "CCCCC3333C"),
        new ClientProfile("DEALER7", Pan: "DDDDD4444D", IsDealer: true),
        new ClientProfile("BIGFUND", Pan: "EEEEE5555E"),
    });

    private static List<AlertSignal> Run(params MarketEvent[] events)
    {
        var engine = new SurveillanceEngine(Policy, Kyc);
        return events.SelectMany(engine.Process).ToList();
    }

    // ---- wash trades ---------------------------------------------------------------------------

    [Fact]
    public void Self_trade_is_high_severity_wash()
    {
        var tape = new Tape();
        var s = Assert.Single(Run(tape.Trade(0, "BOB", "BOB", 500, 100.05m)));
        Assert.Equal(RuleIds.WashTrade, s.RuleId);
        Assert.Equal(Severity.High, s.Severity);
        Assert.StartsWith("Self-trade", s.Summary);
    }

    [Fact]
    public void Trade_between_kyc_linked_clients_names_the_shared_attribute()
    {
        var tape = new Tape();
        var s = Assert.Single(Run(tape.Trade(0, "ALICE", "ALICE_HUF", 500, 100.05m)));
        Assert.Equal(Severity.Medium, s.Severity);
        Assert.Contains("shared mobile ...0001", s.Summary);
    }

    [Fact]
    public void Trade_between_unrelated_clients_is_clean()
    {
        var tape = new Tape();
        Assert.Empty(Run(tape.Trade(0, "ALICE", "BOB", 500, 100.05m)));
    }

    [Fact]
    public void Repeat_wash_trades_between_a_pair_share_one_dedup_key_per_day()
    {
        var tape = new Tape();
        var signals = Run(
            tape.Trade(0, "ALICE", "ALICE_HUF", 100, 100m),
            tape.Trade(1000, "ALICE_HUF", "ALICE", 100, 100m)); // reversed direction, same pair
        Assert.Equal(2, signals.Count);
        Assert.Single(signals.Select(s => s.DedupKey).Distinct());
    }

    // ---- spoofing ------------------------------------------------------------------------------

    [Fact]
    public void Large_non_marketable_bid_cancelled_fast_with_a_sell_after_is_spoofing()
    {
        var tape = new Tape();
        var spoof = tape.Place(0, "CAROL", Side.Buy, 20_000, 100.00m); // rests at the bid, not marketable
        var signals = Run(
            spoof,
            tape.Cancel(900, spoof.OrderId),
            tape.Trade(1_100, "BOB", "CAROL", 2_000, 100.10m)); // CAROL sells 200 ms after the cancel

        var s = Assert.Single(signals);
        Assert.Equal(RuleIds.Spoofing, s.RuleId);
        Assert.Contains("cancelled it after 900 ms", s.Summary);
        Assert.Contains("200 ms after the cancel", s.Summary);
        Assert.Equal(3, s.EvidenceEventIds.Count);
    }

    [Fact]
    public void Opposite_fill_just_before_the_cancel_also_counts()
    {
        var tape = new Tape();
        var spoof = tape.Place(0, "CAROL", Side.Sell, 20_000, 100.10m, bid: 100.00m, ask: 100.10m);
        var signals = Run(
            spoof,
            tape.Trade(700, "CAROL", "BOB", 1_500, 100.00m), // CAROL buys while her big offer sits there
            tape.Cancel(800, spoof.OrderId));

        var s = Assert.Single(signals);
        Assert.Contains("100 ms before the cancel", s.Summary);
    }

    [Fact]
    public void Order_that_rested_longer_than_the_policy_is_not_spoofing()
    {
        var tape = new Tape();
        var o = tape.Place(0, "CAROL", Side.Buy, 20_000, 100.00m);
        Assert.Empty(Run(o, tape.Cancel(2_001, o.OrderId), tape.Trade(2_100, "BOB", "CAROL", 2_000, 100.10m)));
    }

    [Fact]
    public void Opposite_fill_outside_the_proximity_window_is_not_spoofing()
    {
        var tape = new Tape();
        var o = tape.Place(0, "CAROL", Side.Buy, 20_000, 100.00m);
        Assert.Empty(Run(o, tape.Cancel(900, o.OrderId), tape.Trade(1_401, "BOB", "CAROL", 2_000, 100.10m)));
    }

    [Fact]
    public void Marketable_large_order_is_never_a_spoof_candidate()
    {
        var tape = new Tape();
        var o = tape.Place(0, "CAROL", Side.Buy, 20_000, 100.10m); // crosses the 100.10 offer
        Assert.Empty(Run(o, tape.Cancel(100, o.OrderId), tape.Trade(200, "BOB", "CAROL", 2_000, 100.10m)));
    }

    [Fact]
    public void Linked_account_on_the_other_side_completes_the_pattern()
    {
        var tape = new Tape();
        var o = tape.Place(0, "ALICE", Side.Buy, 20_000, 100.00m);
        var s = Assert.Single(Run(o, tape.Cancel(500, o.OrderId), tape.Trade(600, "BOB", "ALICE_HUF", 3_000, 100.10m)));
        Assert.Equal(RuleIds.Spoofing, s.RuleId);
    }

    // ---- front running -------------------------------------------------------------------------

    [Fact]
    public void Dealer_buying_just_before_a_big_client_buy_at_a_better_price_is_front_running()
    {
        var tape = new Tape();
        var signals = Run(
            tape.Trade(0, "DEALER7", "BOB", 3_000, 100.05m),
            tape.Trade(5_000, "DEALER7", "CAROL", 2_000, 100.08m),
            tape.Place(20_000, "BIGFUND", Side.Buy, 80_000, 100.20m));

        var s = Assert.Single(signals);
        Assert.Equal(RuleIds.FrontRunning, s.RuleId);
        Assert.Equal(Severity.High, s.Severity);
        Assert.Contains("5,000 INFY across 2 trade(s)", s.Summary);
        Assert.Equal(new[] { "DEALER7", "BIGFUND" }, s.ClientIds);
    }

    [Fact]
    public void Same_side_trade_at_a_worse_price_is_not_front_running()
    {
        var tape = new Tape();
        Assert.Empty(Run(
            tape.Trade(0, "DEALER7", "BOB", 3_000, 100.30m), // paid more than the client's limit
            tape.Place(20_000, "BIGFUND", Side.Buy, 80_000, 100.20m)));
    }

    [Fact]
    public void Trade_outside_the_lookback_window_is_not_front_running()
    {
        var tape = new Tape();
        Assert.Empty(Run(
            tape.Trade(0, "DEALER7", "BOB", 3_000, 100.05m),
            tape.Place(30_001, "BIGFUND", Side.Buy, 80_000, 100.20m)));
    }

    [Fact]
    public void Ordinary_client_trading_ahead_is_ignored_when_policy_limits_to_dealers()
    {
        var tape = new Tape();
        Assert.Empty(Run(
            tape.Trade(0, "BOB", "CAROL", 3_000, 100.05m),
            tape.Place(20_000, "BIGFUND", Side.Buy, 80_000, 100.20m)));
    }

    // ---- policy and state ----------------------------------------------------------------------

    [Fact]
    public void A_rule_with_no_policy_section_never_fires()
    {
        var engine = new SurveillanceEngine(new SurveillancePolicy(), Kyc);
        var tape = new Tape();
        Assert.Empty(engine.Process(tape.Trade(0, "BOB", "BOB", 500, 100m)));
        Assert.All(engine.Policy.RuleStates(), r => Assert.False(r.Enabled));
    }

    [Fact]
    public void Engine_forgets_trades_older_than_the_longest_window()
    {
        var engine = new SurveillanceEngine(Policy, Kyc);
        var tape = new Tape();
        for (var i = 0; i < 1_000; i++) engine.Process(tape.Trade(i * 1_000, "BOB", "CAROL", 10, 100m));
        // 30 s look-back at one trade per second => at most ~31 trades resident, not 1,000.
        Assert.InRange(engine.ResidentState().Trades, 1, 32);
    }

    [Fact]
    public void Summaries_and_dedup_keys_do_not_depend_on_the_server_locale()
    {
        var saved = System.Globalization.CultureInfo.CurrentCulture;
        try
        {
            // hi-IN groups digits as 1,81,870; th-TH counts years in the Buddhist era. Neither may leak into alerts.
            System.Globalization.CultureInfo.CurrentCulture = new System.Globalization.CultureInfo("hi-IN");
            var tape = new Tape();
            var hi = Run(tape.Trade(0, "ALICE", "ALICE_HUF", 181_870, 1500.5m)).Single();
            Assert.Contains("181,870", hi.Summary);

            System.Globalization.CultureInfo.CurrentCulture = new System.Globalization.CultureInfo("th-TH");
            var th = Run(new Tape().Trade(0, "ALICE", "ALICE_HUF", 1, 1m)).Single();
            Assert.EndsWith("|2026-10-06", th.DedupKey);
        }
        finally
        {
            System.Globalization.CultureInfo.CurrentCulture = saved;
        }
    }

    [Fact]
    public void Out_of_order_events_are_counted_not_dropped()
    {
        var engine = new SurveillanceEngine(Policy, Kyc);
        var tape = new Tape();
        var late = tape.Trade(0, "BOB", "BOB", 1, 100m);
        engine.Process(tape.Trade(5_000, "BOB", "CAROL", 1, 100m));
        Assert.Single(engine.Process(late));
        Assert.Equal(1, engine.Stats.OutOfOrderEvents);
    }
}

using Surveillance.Core.Domain;
using Surveillance.Core.Kyc;

namespace Surveillance.Sim;

/// <summary>A scenario planted in the tape. Positives must alert; decoys are near misses that must not.</summary>
public sealed record Scenario(string Id, string RuleId, bool Positive, string Kind, IReadOnlyList<string> EventIds);

public sealed record Tape(IReadOnlyList<ClientProfile> Clients, MarketEvent[] Events, IReadOnlyList<Scenario> Scenarios);

/// <summary>
/// Synthetic order/trade log: background flow between unrelated ordinary clients, with abuse patterns and decoys
/// planted at known positions. Deterministic for a given seed. Everything here is invented; no real client or trade.
/// </summary>
public sealed class TapeGenerator(int seed)
{
    private readonly Random _rng = new(seed);
    private long _seq;
    private static readonly string[] Symbols =
        { "INFY", "TCS", "RELIANCE", "HDFCBANK", "ICICIBANK", "SBIN", "ITC", "LT", "AXISBANK", "KOTAKBANK",
          "BHARTIARTL", "HINDUNILVR", "MARUTI", "SUNPHARMA", "TITAN", "WIPRO", "ONGC", "NTPC", "POWERGRID", "TATASTEEL" };

    public Tape Generate(int backgroundEvents, int scenariosPerKind)
    {
        var clients = new List<ClientProfile>();
        var ordinary = Enumerable.Range(1, 2_000).Select(i => $"C{i:0000}").ToArray();
        clients.AddRange(ordinary.Select((id, i) => new ClientProfile(id, Pan: $"PAN{i:000000}X", Mobile: $"7{i:000000000}")));

        // 60 KYC-linked groups of 2-3 accounts sharing a mobile or an e-mail; they never appear in background flow.
        var groups = new List<string[]>();
        for (var g = 0; g < 60; g++)
        {
            var size = _rng.Next(2, 4);
            var members = Enumerable.Range(0, size).Select(m => $"G{g:00}_{m}").ToArray();
            var viaMail = g % 2 == 0;
            clients.AddRange(members.Select((id, m) => new ClientProfile(id, Pan: $"GPAN{g:00}{m}Y",
                Mobile: viaMail ? $"81{g:00}{m:000000}" : $"8800{g:000000}", Email: viaMail ? $"family{g}@mail.in" : null)));
            groups.Add(members);
        }
        var dealers = Enumerable.Range(1, 20).Select(i => $"D{i:00}").ToArray();
        clients.AddRange(dealers.Select((id, i) => new ClientProfile(id, Pan: $"DPAN{i:00}Z", IsDealer: true)));
        var funds = Enumerable.Range(1, 30).Select(i => $"F{i:00}").ToArray();
        clients.AddRange(funds.Select((id, i) => new ClientProfile(id, Pan: $"FPAN{i:00}W")));
        // Decoy spoofers never trade in background flow; otherwise a random background fill can land inside the
        // window and turn a near miss into a genuine match (seen in seed 1 before this was split out).
        var decoySpoofers = Enumerable.Range(1, 200).Select(i => $"X{i:000}").ToArray();
        clients.AddRange(decoySpoofers.Select((id, i) => new ClientProfile(id, Pan: $"XPAN{i:000}V")));

        var start = new DateTimeOffset(2026, 10, 5, 9, 15, 0, TimeSpan.FromHours(5.5));
        // Every planted scenario gets its own (symbol, 70-second slot); the longest one spans 60 s, so no two planted
        // windows can touch. The session is stretched if needed to fit them, then background flow fills it evenly.
        var slotLength = TimeSpan.FromSeconds(70);
        var totalScenarios = scenariosPerKind * 9;
        var slotsPerSymbol = (int)Math.Ceiling(totalScenarios / (double)Symbols.Length) + 1;
        var span = TimeSpan.FromMilliseconds(Math.Max(backgroundEvents * 2.0, slotsPerSymbol * slotLength.TotalMilliseconds));
        var avgGapMs = span.TotalMilliseconds / backgroundEvents;

        var mid = Symbols.ToDictionary(s => s, _ => Math.Round((decimal)(_rng.Next(200, 4000)) + 0.05m * _rng.Next(0, 20), 2));
        var scenarios = new List<Scenario>();
        var planted = new List<MarketEvent>();
        void Plant(string rule, bool positive, string kind, params MarketEvent[] evs)
        {
            planted.AddRange(evs);
            scenarios.Add(new Scenario($"S{scenarios.Count + 1:0000}", rule, positive, kind, evs.Select(e => e.EventId).ToArray()));
        }

        var cells = (from sym in Symbols from k in Enumerable.Range(0, slotsPerSymbol - 1) select (sym, k))
            .OrderBy(_ => _rng.Next()).ToList();
        var slot = 0;
        (DateTimeOffset T, string Sym) NextSlot()
        {
            var (sym, k) = cells[slot++];
            return (start + slotLength * k + TimeSpan.FromSeconds(1), sym);
        }

        for (var k = 0; k < scenariosPerKind; k++)
        {
            // --- wash: linked accounts on both sides | decoy: linked account vs an outsider
            { var (t, sym) = NextSlot(); var g = groups[_rng.Next(groups.Count)];
              Plant(RuleIds.WashTrade, true, "linked-pair", Trade(t, sym, g[0], g[1], _rng.Next(50, 5_000), mid[sym])); }
            { var (t, sym) = NextSlot(); var g = groups[_rng.Next(groups.Count)];
              Plant(RuleIds.WashTrade, false, "linked-vs-outsider", Trade(t, sym, g[0], ordinary[_rng.Next(ordinary.Length)], _rng.Next(50, 5_000), mid[sym])); }

            // --- spoofing
            { var (t, sym) = NextSlot(); var g = groups[_rng.Next(groups.Count)]; var spoofer = g[0];
              var side = _rng.Next(2) == 0 ? Side.Buy : Side.Sell;
              var (o, c, f) = SpoofShape(t, sym, spoofer, g[^1], ordinary, side, mid[sym], restMs: _rng.Next(100, 1_900), fillOffsetMs: _rng.Next(-400, 400), marketable: false);
              Plant(RuleIds.Spoofing, true, "fast-cancel-opposite-fill", o, c, f); }
            { var (t, sym) = NextSlot(); var spoofer = decoySpoofers[_rng.Next(decoySpoofers.Length)];
              var (o, c, f) = SpoofShape(t, sym, spoofer, spoofer, ordinary, Side.Buy, mid[sym], restMs: _rng.Next(2_500, 5_000), fillOffsetMs: 100, marketable: false);
              Plant(RuleIds.Spoofing, false, "rested-too-long", o, c, f); }
            { var (t, sym) = NextSlot(); var spoofer = decoySpoofers[_rng.Next(decoySpoofers.Length)];
              var (o, c, f) = SpoofShape(t, sym, spoofer, spoofer, ordinary, Side.Sell, mid[sym], restMs: 600, fillOffsetMs: _rng.Next(700, 3_000), marketable: false);
              Plant(RuleIds.Spoofing, false, "fill-too-late", o, c, f); }
            { var (t, sym) = NextSlot(); var spoofer = decoySpoofers[_rng.Next(decoySpoofers.Length)];
              var (o, c, f) = SpoofShape(t, sym, spoofer, spoofer, ordinary, Side.Buy, mid[sym], restMs: 300, fillOffsetMs: 100, marketable: true);
              Plant(RuleIds.Spoofing, false, "marketable-order", o, c, f); }

            // --- front running
            { var (t, sym) = NextSlot(); var d = dealers[_rng.Next(dealers.Length)]; var fund = funds[_rng.Next(funds.Length)];
              var px = mid[sym]; var lead = _rng.Next(1_000, 25_000);
              Plant(RuleIds.FrontRunning, true, "dealer-ahead-better-price",
                  Trade(t, sym, d, ordinary[_rng.Next(ordinary.Length)], _rng.Next(1_000, 8_000), px),
                  Place(t.AddMilliseconds(lead), sym, fund, Side.Buy, _rng.Next(60_000, 200_000), px + 1.00m, px - 0.05m, px + 0.05m)); }
            { var (t, sym) = NextSlot(); var d = dealers[_rng.Next(dealers.Length)]; var fund = funds[_rng.Next(funds.Length)]; var px = mid[sym];
              Plant(RuleIds.FrontRunning, false, "outside-window",
                  Trade(t, sym, d, ordinary[_rng.Next(ordinary.Length)], 3_000, px),
                  Place(t.AddMilliseconds(_rng.Next(31_000, 55_000)), sym, fund, Side.Buy, 90_000, px + 1.00m, px - 0.05m, px + 0.05m)); }
            { var (t, sym) = NextSlot(); var d = dealers[_rng.Next(dealers.Length)]; var fund = funds[_rng.Next(funds.Length)]; var px = mid[sym];
              Plant(RuleIds.FrontRunning, false, "worse-price",
                  Trade(t, sym, d, ordinary[_rng.Next(ordinary.Length)], 3_000, px + 2.00m),
                  Place(t.AddMilliseconds(5_000), sym, fund, Side.Buy, 90_000, px + 1.00m, px - 0.05m, px + 0.05m)); }
        }

        // Background: unrelated ordinary clients only, small orders, so every alert has a planted cause.
        var background = new List<MarketEvent>(backgroundEvents);
        var resting = Symbols.ToDictionary(s => s, _ => new List<string>());
        var ts = start;
        for (var i = 0; i < backgroundEvents; i++)
        {
            ts = ts.AddMilliseconds(_rng.NextDouble() * 2 * avgGapMs);
            var sym = Symbols[_rng.Next(Symbols.Length)];
            mid[sym] = Math.Max(1m, mid[sym] + 0.05m * _rng.Next(-1, 2));
            var roll = _rng.Next(100);
            if (roll < 45)
            {
                var side = _rng.Next(2) == 0 ? Side.Buy : Side.Sell;
                var px = mid[sym] + (side == Side.Buy ? -0.05m : 0.05m) * _rng.Next(0, 4);
                var o = Place(ts, sym, ordinary[_rng.Next(ordinary.Length)], side, _rng.Next(1, 2_000), px, mid[sym] - 0.05m, mid[sym] + 0.05m);
                resting[sym].Add(o.OrderId);
                background.Add(o);
            }
            else if (roll < 60 && resting[sym].Count > 0)
            {
                var idx = _rng.Next(resting[sym].Count);
                background.Add(new OrderCancelled(NextId(), ts, sym, resting[sym][idx]));
                resting[sym].RemoveAt(idx);
            }
            else
            {
                string buyer = ordinary[_rng.Next(ordinary.Length)], seller;
                do seller = ordinary[_rng.Next(ordinary.Length)]; while (seller == buyer);
                background.Add(Trade(ts, sym, buyer, seller, _rng.Next(1, 2_000), mid[sym]));
            }
            if (resting[sym].Count > 500) resting[sym].RemoveRange(0, 250);
        }

        // Merge by timestamp; within a tie keep generation order (OrderBy is stable).
        var events = background.Concat(planted).OrderBy(e => e.Ts).ToArray();
        return new Tape(clients, events, scenarios);
    }

    private (OrderPlaced, OrderCancelled, TradeExecuted) SpoofShape(DateTimeOffset t, string sym, string spoofer, string filler,
        string[] counterparties, Side side, decimal px, int restMs, int fillOffsetMs, bool marketable)
    {
        var (bid, ask) = (px - 0.05m, px + 0.05m);
        var limit = marketable ? (side == Side.Buy ? ask : bid) : (side == Side.Buy ? bid : ask);
        var o = Place(t, sym, spoofer, side, _rng.Next(15_000, 80_000), limit, bid, ask);
        var c = new OrderCancelled(NextId(), t.AddMilliseconds(restMs), sym, o.OrderId);
        var cp = counterparties[_rng.Next(counterparties.Length)];
        var fillTs = c.Ts.AddMilliseconds(fillOffsetMs);
        if (fillTs <= o.Ts) fillTs = o.Ts.AddMilliseconds(1);
        var f = side == Side.Buy
            ? Trade(fillTs, sym, cp, filler, _rng.Next(500, 5_000), ask)   // spoofed the bid, sells into it
            : Trade(fillTs, sym, filler, cp, _rng.Next(500, 5_000), bid);  // spoofed the offer, buys under it
        return (o, c, f);
    }

    private string NextId() => $"ev{++_seq:00000000}";

    private OrderPlaced Place(DateTimeOffset t, string sym, string client, Side side, long qty, decimal limit, decimal bid, decimal ask)
    {
        var id = NextId();
        return new OrderPlaced(id, t, sym, "o" + id[2..], client, side, qty, limit, bid, ask);
    }

    private TradeExecuted Trade(DateTimeOffset t, string sym, string buyer, string seller, long qty, decimal px)
    {
        var id = NextId();
        return new TradeExecuted(id, t, sym, "t" + id[2..], px, qty, buyer, seller, "b" + id[2..], "s" + id[2..]);
    }
}

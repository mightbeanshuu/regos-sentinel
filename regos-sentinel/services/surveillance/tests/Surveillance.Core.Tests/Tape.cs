using Surveillance.Core.Domain;

namespace Surveillance.Core.Tests;

/// <summary>Builds a symbol-ordered event tape with readable relative timestamps.</summary>
internal sealed class Tape
{
    public static readonly DateTimeOffset T0 = new(2026, 10, 6, 9, 15, 0, TimeSpan.FromHours(5.5));
    private int _seq;

    public static DateTimeOffset At(double ms) => T0.AddMilliseconds(ms);

    public OrderPlaced Place(double ms, string client, Side side, long qty, decimal limit,
        decimal bid = 100.00m, decimal ask = 100.10m, string symbol = "INFY", string? orderId = null) =>
        new($"e{++_seq}", At(ms), symbol, orderId ?? $"o{_seq}", client, side, qty, limit, bid, ask);

    public OrderCancelled Cancel(double ms, string orderId, string symbol = "INFY") =>
        new($"e{++_seq}", At(ms), symbol, orderId);

    public TradeExecuted Trade(double ms, string buyer, string seller, long qty, decimal price, string symbol = "INFY") =>
        new($"e{++_seq}", At(ms), symbol, $"t{_seq}", price, qty, buyer, seller, $"bo{_seq}", $"so{_seq}");
}

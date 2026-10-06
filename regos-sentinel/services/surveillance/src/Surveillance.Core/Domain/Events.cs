using System.Text.Json.Serialization;

namespace Surveillance.Core.Domain;

public enum Side { Buy, Sell }

/// <summary>
/// One entry of a broker's order/trade log. Events for a symbol must arrive in timestamp order
/// (the Kafka topic is keyed by symbol, so a partition preserves that order).
/// </summary>
[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(OrderPlaced), "order_placed")]
[JsonDerivedType(typeof(OrderCancelled), "order_cancelled")]
[JsonDerivedType(typeof(TradeExecuted), "trade_executed")]
public abstract record MarketEvent(string EventId, DateTimeOffset Ts, string Symbol);

/// <param name="BestBid">Best bid on the exchange book at the moment the order was accepted.</param>
/// <param name="BestAsk">Best offer on the exchange book at the moment the order was accepted.</param>
public sealed record OrderPlaced(
    string EventId, DateTimeOffset Ts, string Symbol,
    string OrderId, string ClientId, Side Side, long Quantity, decimal LimitPrice,
    decimal BestBid, decimal BestAsk) : MarketEvent(EventId, Ts, Symbol)
{
    /// <summary>A limit order that would not execute on arrival: a buy below the offer, a sell above the bid.</summary>
    [JsonIgnore]
    public bool IsMarketable => Side == Side.Buy ? LimitPrice >= BestAsk : LimitPrice <= BestBid;
}

public sealed record OrderCancelled(
    string EventId, DateTimeOffset Ts, string Symbol, string OrderId) : MarketEvent(EventId, Ts, Symbol);

public sealed record TradeExecuted(
    string EventId, DateTimeOffset Ts, string Symbol,
    string TradeId, decimal Price, long Quantity,
    string BuyClientId, string SellClientId, string BuyOrderId, string SellOrderId) : MarketEvent(EventId, Ts, Symbol)
{
    public string ClientOn(Side side) => side == Side.Buy ? BuyClientId : SellClientId;
}

public static class SideExtensions
{
    public static Side Opposite(this Side side) => side == Side.Buy ? Side.Sell : Side.Buy;
}

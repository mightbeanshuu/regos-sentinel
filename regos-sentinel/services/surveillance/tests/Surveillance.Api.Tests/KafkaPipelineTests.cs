using System.Net.Http.Json;
using System.Text.Json;
using Confluent.Kafka;
using Confluent.Kafka.Admin;
using Surveillance.Api.Controllers;
using Surveillance.Api.Services;
using Surveillance.Core.Domain;

namespace Surveillance.Api.Tests;

/// <summary>Runs only when an environment variable points at real infrastructure; otherwise reported as skipped, never as passed.</summary>
public sealed class RequiresEnvFactAttribute : FactAttribute
{
    public RequiresEnvFactAttribute(string variable)
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(variable)))
            Skip = $"Set {variable} to run against real infrastructure (CI does).";
    }
}

public class KafkaPipelineTests
{
    private static readonly string? Bootstrap = Environment.GetEnvironmentVariable("SURV_KAFKA");
    private static readonly DateTimeOffset T0 = new(2026, 10, 6, 9, 15, 0, TimeSpan.FromHours(5.5));

    [RequiresEnvFact("SURV_KAFKA")]
    public async Task Topic_events_become_alerts_exactly_once_and_poison_messages_go_to_the_dead_letter_topic()
    {
        var run = Guid.NewGuid().ToString("N")[..8];
        var (events, alerts, dlq) = ($"surv.events.{run}", $"surv.alerts.{run}", $"surv.dlq.{run}");
        using (var admin = new AdminClientBuilder(new AdminClientConfig { BootstrapServers = Bootstrap }).Build())
        {
            await admin.CreateTopicsAsync(new[]
            {
                new TopicSpecification { Name = events, NumPartitions = 3, ReplicationFactor = 1 },
                new TopicSpecification { Name = alerts, NumPartitions = 1, ReplicationFactor = 1 },
                new TopicSpecification { Name = dlq, NumPartitions = 1, ReplicationFactor = 1 },
            });
        }

        using var app = new ApiFactory(new()
        {
            ["Kafka:BootstrapServers"] = Bootstrap,
            ["Kafka:EventsTopic"] = events,
            ["Kafka:AlertsTopic"] = alerts,
            ["Kafka:DeadLetterTopic"] = dlq,
            ["Kafka:GroupId"] = "test-" + run,
        });
        using var http = app.CreateClient();
        (await http.PutAsJsonAsync("/api/clients", new[]
        {
            new ClientDto("ALICE", "AAAAA1111A", "9000000001", null, false, false),
            new ClientDto("ALICE_HUF", null, "9000000001", null, false, false),
            new ClientDto("BOB", null, null, null, false, false),
            new ClientDto("CAROL", null, null, null, false, false),
        }, Http.Json)).EnsureSuccessStatusCode();

        var tape = new MarketEvent[]
        {
            new TradeExecuted("k1", T0, "INFY", "t1", 1500m, 500, "ALICE", "ALICE_HUF", "b1", "s1"),
            new OrderPlaced("k2", T0.AddMilliseconds(1_000), "TCS", "SP1", "CAROL", Side.Sell, 30_000, 4001m, 4000m, 4000.5m),
            new OrderCancelled("k3", T0.AddMilliseconds(1_600), "TCS", "SP1"),
            new TradeExecuted("k4", T0.AddMilliseconds(1_700), "TCS", "t4", 4000m, 2_000, "CAROL", "BOB", "b4", "s4"),
        };

        using (var producer = new ProducerBuilder<string, string>(new ProducerConfig { BootstrapServers = Bootstrap }).Build())
        {
            foreach (var e in tape.Concat(tape)) // every event delivered twice
                await producer.ProduceAsync(events, new Message<string, string> { Key = e.Symbol, Value = JsonSerializer.Serialize(e, Http.Json) });
            await producer.ProduceAsync(events, new Message<string, string> { Key = "INFY", Value = "{not json" });
            producer.Flush(TimeSpan.FromSeconds(10));
        }

        PagedAlerts page = new(0, 1, 50, Array.Empty<AlertDto>());
        var deadline = DateTime.UtcNow.AddSeconds(60);
        while (DateTime.UtcNow < deadline)
        {
            page = await (await http.GetAsync("/api/alerts")).Read<PagedAlerts>();
            var h = JsonDocument.Parse(await http.GetStringAsync("/health")).RootElement.GetProperty("kafka");
            if (page.Total >= 2 && h.GetProperty("consumed").GetInt64() >= 9) break;
            await Task.Delay(500);
        }
        await Task.Delay(2_000); // give any (wrong) extra processing time to show up

        page = await (await http.GetAsync("/api/alerts")).Read<PagedAlerts>();
        Assert.Equal(new[] { RuleIds.Spoofing, RuleIds.WashTrade }, page.Items.Select(a => a.RuleId).Order());
        Assert.All(page.Items, a => Assert.Equal(1, a.Occurrences)); // the duplicates were skipped by the ledger

        var health = JsonDocument.Parse(await http.GetStringAsync("/health")).RootElement;
        Assert.Equal(1, health.GetProperty("kafka").GetProperty("deadLettered").GetInt64());
        Assert.Equal(4, health.GetProperty("engine").GetProperty("eventsProcessed").GetInt64());

        using var consumer = new ConsumerBuilder<string, string>(new ConsumerConfig
        {
            BootstrapServers = Bootstrap, GroupId = "verify-" + run, AutoOffsetReset = AutoOffsetReset.Earliest,
        }).Build();
        consumer.Subscribe(alerts);
        var announced = new List<string>();
        var until = DateTime.UtcNow.AddSeconds(15);
        while (announced.Count < 2 && DateTime.UtcNow < until)
            if (consumer.Consume(TimeSpan.FromMilliseconds(500)) is { } m) announced.Add(m.Message.Value);
        Assert.Equal(2, announced.Count);
    }
}

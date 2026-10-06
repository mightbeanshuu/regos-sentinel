using System.Text.Json;
using Confluent.Kafka;
using Microsoft.Extensions.Options;
using Surveillance.Api.Data;
using Surveillance.Api.Services;
using Surveillance.Core.Domain;

namespace Surveillance.Api.Messaging;

public sealed class KafkaOptions
{
    /// <summary>Empty = Kafka off; events then arrive only through POST /api/events.</summary>
    public string? BootstrapServers { get; set; }
    public string EventsTopic { get; set; } = "surveillance.events.v1";
    public string AlertsTopic { get; set; } = "surveillance.alerts.v1";
    public string DeadLetterTopic { get; set; } = "surveillance.events.dlq.v1";
    public string GroupId { get; set; } = "surveillance-engine";
    public int MaxBatch { get; set; } = 500;
    public int MaxBatchWaitMs { get; set; } = 250;
    public bool Enabled => !string.IsNullOrWhiteSpace(BootstrapServers);
}

public interface IAlertPublisher
{
    Task PublishAsync(IReadOnlyList<AlertEntity> alerts, CancellationToken ct);
}

public sealed class NoopAlertPublisher : IAlertPublisher
{
    public Task PublishAsync(IReadOnlyList<AlertEntity> alerts, CancellationToken ct) => Task.CompletedTask;
}

/// <summary>
/// Announces new alerts on a topic so downstream case-management can pick them up. The database stays the system
/// of record: publishing happens after commit and a failed publish is logged, never allowed to undo an alert.
/// </summary>
public sealed class KafkaAlertPublisher : IAlertPublisher, IDisposable
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private readonly IProducer<string, string> _producer;
    private readonly KafkaOptions _opt;
    private readonly ILogger<KafkaAlertPublisher> _log;

    public KafkaAlertPublisher(IOptions<KafkaOptions> opt, ILogger<KafkaAlertPublisher> log)
    {
        _opt = opt.Value;
        _log = log;
        _producer = new ProducerBuilder<string, string>(new ProducerConfig
        {
            BootstrapServers = _opt.BootstrapServers,
            EnableIdempotence = true, // broker de-duplicates producer retries
            Acks = Acks.All,
        }).Build();
    }

    public async Task PublishAsync(IReadOnlyList<AlertEntity> alerts, CancellationToken ct)
    {
        foreach (var a in alerts)
        {
            try
            {
                var payload = JsonSerializer.Serialize(new
                {
                    a.Id, a.RuleId, a.Symbol, Severity = a.Severity.ToString(), a.Summary, a.Citation, a.GeneratedAt, a.DueAt,
                }, Json);
                await _producer.ProduceAsync(_opt.AlertsTopic, new Message<string, string> { Key = a.Symbol, Value = payload }, ct);
            }
            catch (ProduceException<string, string> ex)
            {
                _log.LogWarning(ex, "Alert {AlertId} committed but not announced on {Topic}", a.Id, _opt.AlertsTopic);
            }
        }
    }

    public void Dispose() => _producer.Dispose();
}

/// <summary>
/// Consumes the order/trade log. Offsets are committed only after the batch is in the database, so a crash replays
/// the batch, and the ProcessedEvents ledger turns the replay into a no-op: at-least-once delivery, effectively-once
/// processing. Messages that will never parse go to a dead-letter topic instead of blocking the partition.
/// </summary>
public sealed class KafkaIngestWorker(
    IServiceScopeFactory scopes,
    IOptions<KafkaOptions> opt,
    ILogger<KafkaIngestWorker> log) : BackgroundService
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() },
    };

    public long Consumed;
    public long DeadLettered;

    protected override Task ExecuteAsync(CancellationToken stoppingToken) =>
        Task.Factory.StartNew(() => Run(stoppingToken), stoppingToken, TaskCreationOptions.LongRunning, TaskScheduler.Default).Unwrap();

    private async Task Run(CancellationToken ct)
    {
        var o = opt.Value;
        using var consumer = new ConsumerBuilder<string, string>(new ConsumerConfig
        {
            BootstrapServers = o.BootstrapServers,
            GroupId = o.GroupId,
            EnableAutoCommit = false,
            EnableAutoOffsetStore = false, // an offset is stored only once its message is safely in the database
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnablePartitionEof = false,
        }).Build();
        using var dlq = new ProducerBuilder<string, string>(new ProducerConfig { BootstrapServers = o.BootstrapServers }).Build();
        consumer.Subscribe(o.EventsTopic);
        log.LogInformation("Consuming {Topic} as {Group}", o.EventsTopic, o.GroupId);

        var batch = new List<MarketEvent>(o.MaxBatch);
        var polled = new List<ConsumeResult<string, string>>(o.MaxBatch);
        while (!ct.IsCancellationRequested)
        {
            var deadline = DateTime.UtcNow.AddMilliseconds(o.MaxBatchWaitMs);
            try
            {
                while (batch.Count < o.MaxBatch && DateTime.UtcNow < deadline)
                {
                    var r = consumer.Consume(TimeSpan.FromMilliseconds(50));
                    if (r is null) continue;
                    polled.Add(r);
                    Interlocked.Increment(ref Consumed);
                    MarketEvent? e = null;
                    try { e = JsonSerializer.Deserialize<MarketEvent>(r.Message.Value, Json); }
                    catch (JsonException) { }
                    if (e is null || string.IsNullOrWhiteSpace(e.EventId))
                    {
                        Interlocked.Increment(ref DeadLettered);
                        await dlq.ProduceAsync(o.DeadLetterTopic, r.Message, ct);
                        continue;
                    }
                    batch.Add(e);
                }

                if (batch.Count > 0)
                {
                    using var scope = scopes.CreateScope();
                    await scope.ServiceProvider.GetRequiredService<IngestionService>().IngestAsync(batch, ct);
                }
                if (polled.Count > 0)
                {
                    foreach (var r in polled) consumer.StoreOffset(r);
                    consumer.Commit(); // every partition in the batch, after the DB commit
                }
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                // Rewind each partition to the first message of the failed batch. Nothing was committed, and on the
                // retry the ledger skips whatever did land, so no event is lost and none is counted twice.
                log.LogError(ex, "Batch of {Count} failed; rewinding and retrying", polled.Count);
                foreach (var first in polled.GroupBy(r => r.TopicPartition).Select(g => g.MinBy(r => r.Offset.Value)!))
                    consumer.Seek(first.TopicPartitionOffset);
                await Task.Delay(TimeSpan.FromSeconds(2), ct);
            }
            finally
            {
                batch.Clear();
                polled.Clear();
            }
        }
        consumer.Close();
    }
}

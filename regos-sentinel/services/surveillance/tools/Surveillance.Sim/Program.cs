using System.Diagnostics;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Surveillance.Core.Domain;
using Surveillance.Core.Engine;
using Surveillance.Core.Kyc;
using Surveillance.Sim;

System.Globalization.CultureInfo.DefaultThreadCurrentCulture = System.Globalization.CultureInfo.InvariantCulture;
System.Globalization.CultureInfo.CurrentCulture = System.Globalization.CultureInfo.InvariantCulture;

// Usage:
//   eval  [--events N] [--scenarios K] [--seed S]      run the engine in-process: accuracy on planted scenarios + throughput
//   post  --url http://localhost:5080 [--events N] [--scenarios K] [--seed S]   load clients and stream the tape into the API
var cmd = args.FirstOrDefault() ?? "eval";
int Arg(string name, int dflt) => args.SkipWhile(a => a != name).Skip(1).Select(int.Parse).DefaultIfEmpty(dflt).First();
string? Str(string name) => args.SkipWhile(a => a != name).Skip(1).FirstOrDefault();

var events = Arg("--events", 1_000_000);
var perKind = Arg("--scenarios", 100);
var seed = Arg("--seed", 42);

var genWatch = Stopwatch.StartNew();
var tape = new TapeGenerator(seed).Generate(events, perKind);
genWatch.Stop();
Console.WriteLine($"Synthetic tape: {tape.Events.Length:N0} events ({events:N0} background + planted), {tape.Clients.Count:N0} clients, " +
                  $"{tape.Scenarios.Count(s => s.Positive)} planted patterns + {tape.Scenarios.Count(s => !s.Positive)} decoys, seed {seed} " +
                  $"(generated in {genWatch.Elapsed.TotalSeconds:0.0}s)");

var policy = new SurveillancePolicy
{
    ApprovedBy = "SYNTHETIC EVAL POLICY",
    DispositionDays = 45,
    WashTrade = new WashTradePolicy { MinQuantity = 1 },
    Spoofing = new SpoofingPolicy { LargeOrderQuantity = 10_000, MaxRestingTime = TimeSpan.FromSeconds(2), OppositeFillProximity = TimeSpan.FromMilliseconds(500) },
    FrontRunning = new FrontRunningPolicy { BigOrderQuantity = 50_000, LookbackWindow = TimeSpan.FromSeconds(30) },
};

if (cmd == "eval")
{
    var engine = new SurveillanceEngine(policy, KycLinkGraph.Build(tape.Clients));
    var signals = new List<AlertSignal>();

    // Warm up the JIT on a slice so tiered compilation does not count against the measured run.
    var warm = new SurveillanceEngine(policy, KycLinkGraph.Build(tape.Clients));
    foreach (var e in tape.Events.Take(50_000)) warm.Process(e);

    GC.Collect(); GC.WaitForPendingFinalizers(); GC.Collect();
    var allocBefore = GC.GetTotalAllocatedBytes(precise: true);
    var gen0Before = GC.CollectionCount(0);
    var sw = Stopwatch.StartNew();
    foreach (var e in tape.Events) signals.AddRange(engine.Process(e));
    sw.Stop();
    var alloc = GC.GetTotalAllocatedBytes(precise: true) - allocBefore;

    var eventToScenario = tape.Scenarios.SelectMany(s => s.EventIds.Select(id => (id, s))).ToDictionary(x => x.id, x => x.s);
    Console.WriteLine();
    Console.WriteLine($"{"Rule",-16}{"planted",8}{"caught",8}{"decoys",8}{"false+",8}{"precision",11}{"recall",8}");
    foreach (var rule in new[] { RuleIds.WashTrade, RuleIds.Spoofing, RuleIds.FrontRunning })
    {
        var positives = tape.Scenarios.Where(s => s.RuleId == rule && s.Positive).ToList();
        var decoys = tape.Scenarios.Count(s => s.RuleId == rule && !s.Positive);
        var ruleSignals = signals.Where(s => s.RuleId == rule).ToList();
        var caught = new HashSet<string>();
        var falsePos = 0;
        foreach (var sig in ruleSignals)
        {
            var hit = sig.EvidenceEventIds.Select(id => eventToScenario.GetValueOrDefault(id))
                .FirstOrDefault(s => s is { Positive: true } && s.RuleId == rule);
            if (hit is null)
            {
                falsePos++;
                if (args.Contains("--explain"))
                {
                    var owners = sig.EvidenceEventIds.Select(id => eventToScenario.TryGetValue(id, out var sc) ? $"{id}->{sc.Id}:{sc.Kind}" : $"{id}->background");
                    Console.WriteLine($"  FALSE+ {sig.Summary}\n         evidence: {string.Join(", ", owners)}");
                }
            }
            else caught.Add(hit.Id);
        }
        var precision = ruleSignals.Count == 0 ? 1.0 : (ruleSignals.Count - falsePos) / (double)ruleSignals.Count;
        var recall = positives.Count == 0 ? 1.0 : caught.Count / (double)positives.Count;
        Console.WriteLine($"{rule,-16}{positives.Count,8}{caught.Count,8}{decoys,8}{falsePos,8}{precision,11:P1}{recall,8:P1}");
    }

    var (trades, resting, pending) = engine.ResidentState();
    Console.WriteLine();
    Console.WriteLine($"Throughput: {tape.Events.Length / sw.Elapsed.TotalSeconds:N0} events/s single-threaded " +
                      $"({tape.Events.Length:N0} events in {sw.Elapsed.TotalMilliseconds:N0} ms, {Environment.ProcessorCount} cores available, .NET {Environment.Version})");
    Console.WriteLine($"Allocation: {alloc / (double)tape.Events.Length:N0} bytes/event, gen0 GCs: {GC.CollectionCount(0) - gen0Before}");
    Console.WriteLine($"Resident state at end: {trades:N0} trades, {resting:N0} large resting orders, {pending:N0} pending spoof checks " +
                      $"(bounded by the {policy.RetentionWindow().TotalSeconds:0}s window, not by tape length)");
    Console.WriteLine($"Out-of-order events: {engine.Stats.OutOfOrderEvents}");
    return;
}

if (cmd == "post")
{
    var url = Str("--url") ?? "http://localhost:5080";
    var json = new JsonSerializerOptions(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };
    using var http = new HttpClient { BaseAddress = new Uri(url), Timeout = TimeSpan.FromMinutes(2) };
    (await http.PutAsJsonAsync("/api/clients", tape.Clients.Select(c =>
        new { c.ClientId, c.Pan, c.Mobile, c.Email, c.IsDealer, c.OnWatchlist }), json)).EnsureSuccessStatusCode();
    var sw = Stopwatch.StartNew();
    var created = 0;
    foreach (var chunk in tape.Events.Chunk(2_000))
    {
        var r = await http.PostAsJsonAsync("/api/events", chunk.ToList(), json);
        r.EnsureSuccessStatusCode();
        created += (await r.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("alertsCreated").GetInt32();
    }
    Console.WriteLine($"Posted {tape.Events.Length:N0} events in {sw.Elapsed.TotalSeconds:0.0}s " +
                      $"({tape.Events.Length / sw.Elapsed.TotalSeconds:N0} events/s end to end, incl. HTTP + database); {created} alerts created");
    return;
}

Console.Error.WriteLine($"Unknown command '{cmd}'. Use eval or post.");
return;

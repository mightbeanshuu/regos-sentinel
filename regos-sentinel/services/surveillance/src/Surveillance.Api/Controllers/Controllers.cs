using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Surveillance.Api.Data;
using Surveillance.Api.Services;
using Surveillance.Core.Domain;

namespace Surveillance.Api.Controllers;

[ApiController]
[Route("api/events")]
public sealed class EventsController(IngestionService ingestion) : ControllerBase
{
    /// <summary>Ingest a symbol-ordered batch of order/trade events. Re-sending a batch is safe: known event ids are skipped.</summary>
    [HttpPost]
    [ProducesResponseType<IngestResult>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IngestResult>> Post([FromBody] List<MarketEvent> events, CancellationToken ct)
    {
        if (events.Count == 0) return Problem(statusCode: 400, title: "Empty batch");
        if (events.Count > 10_000) return Problem(statusCode: 413, title: "Batch too large", detail: "Send at most 10,000 events per request.");
        if (events.Any(e => string.IsNullOrWhiteSpace(e.EventId) || string.IsNullOrWhiteSpace(e.Symbol)))
            return Problem(statusCode: 400, title: "Every event needs an eventId and a symbol");
        return Ok(await ingestion.IngestAsync(events, ct));
    }
}

[ApiController]
[Route("api/alerts")]
public sealed class AlertsController(AlertService alerts) : ControllerBase
{
    [HttpGet]
    public Task<PagedAlerts> List([FromQuery] AlertStatus? status, [FromQuery] string? rule, [FromQuery] string? symbol,
        [FromQuery] bool? breached, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default) =>
        alerts.ListAsync(new AlertQuery(status, rule, symbol, breached, page, pageSize), ct);

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AlertDto>> Get(Guid id, CancellationToken ct) =>
        await alerts.GetAsync(id, ct) is { } a ? a : NotFound();

    /// <summary>Open → Under review. Send the version you loaded; a stale version is refused with 409.</summary>
    [HttpPost("{id:guid}/review")]
    public Task<AlertDto> Review(Guid id, [FromBody] ReviewRequest body, CancellationToken ct) => alerts.ReviewAsync(id, body, ct);

    /// <summary>Close with a disposition and a reason. Past the deadline, a delay reason is mandatory (422 otherwise).</summary>
    [HttpPost("{id:guid}/close")]
    public Task<AlertDto> Close(Guid id, [FromBody] CloseRequest body, CancellationToken ct) => alerts.CloseAsync(id, body, ct);
}

[ApiController]
[Route("api/reports")]
public sealed class ReportsController(AgingReportService aging) : ControllerBase
{
    [HttpGet("aging")]
    public Task<AgingReport> Aging(CancellationToken ct) => aging.GetAsync(ct);
}

public sealed record ClientDto(string ClientId, string? Pan, string? Mobile, string? Email, bool IsDealer, bool OnWatchlist);

[ApiController]
[Route("api/clients")]
public sealed class ClientsController(SurveillanceDbContext db, EngineHost host) : ControllerBase
{
    /// <summary>Upsert KYC profiles; the engine's link graph is rebuilt before the next event is processed.</summary>
    [HttpPut]
    public async Task<ActionResult<object>> Upsert([FromBody] List<ClientDto> clients, CancellationToken ct)
    {
        if (clients.Any(c => string.IsNullOrWhiteSpace(c.ClientId)))
            return Problem(statusCode: 400, title: "Every client needs a clientId");

        await host.Gate.WaitAsync(ct);
        try
        {
            var ids = clients.Select(c => c.ClientId).ToList();
            var existing = await db.Clients.Where(c => ids.Contains(c.ClientId)).ToDictionaryAsync(c => c.ClientId, ct);
            foreach (var c in clients)
            {
                if (!existing.TryGetValue(c.ClientId, out var e)) db.Clients.Add(e = new ClientEntity { ClientId = c.ClientId });
                (e.Pan, e.Mobile, e.Email, e.IsDealer, e.OnWatchlist) = (c.Pan, c.Mobile, c.Email, c.IsDealer, c.OnWatchlist);
            }
            await db.SaveChangesAsync(ct);
            await host.ReloadKycAsync(db, ct);
            return Ok(new { upserted = clients.Count, knownClients = host.KnownClients });
        }
        finally
        {
            host.Gate.Release();
        }
    }
}

[ApiController]
[Route("api/policy")]
public sealed class PolicyController(EngineHost host) : ControllerBase
{
    /// <summary>The thresholds in force, which rules they enable, and the source paragraph behind each rule.</summary>
    [HttpGet]
    public object Get() => new
    {
        host.Policy.ApprovedBy,
        host.Policy.DispositionDays,
        dispositionSource = Citations.DispositionDeadline,
        rules = host.Policy.RuleStates().Select(r => new
        {
            r.RuleId,
            r.Enabled,
            status = r.Enabled ? "ENABLED" : "DISABLED: no threshold set in policy",
            citation = r.RuleId switch
            {
                RuleIds.WashTrade => Citations.WashTrade,
                RuleIds.Spoofing => Citations.Spoofing,
                _ => Citations.FrontRunning,
            },
        }),
        host.Policy.WashTrade,
        host.Policy.Spoofing,
        host.Policy.FrontRunning,
    };
}

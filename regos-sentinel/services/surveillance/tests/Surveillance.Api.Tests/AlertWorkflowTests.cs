using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Surveillance.Api.Controllers;
using Surveillance.Api.Data;
using Surveillance.Api.Services;
using Surveillance.Core.Domain;

namespace Surveillance.Api.Tests;

public class AlertWorkflowTests : IDisposable
{
    private readonly ApiFactory _app = new();
    private readonly HttpClient _http;
    private static readonly DateTimeOffset T0 = new(2026, 10, 6, 9, 15, 0, TimeSpan.FromHours(5.5));

    public AlertWorkflowTests()
    {
        _http = _app.CreateClient();
        var r = _http.PutAsJsonAsync("/api/clients", new[]
        {
            new ClientDto("ALICE", "AAAAA1111A", "9000000001", null, false, false),
            new ClientDto("ALICE_HUF", null, "+91 90000 00001", null, false, false),
            new ClientDto("BOB", "BBBBB2222B", null, null, false, false),
            new ClientDto("CAROL", "CCCCC3333C", null, null, false, false),
            new ClientDto("DEALER7", "DDDDD4444D", null, null, true, false),
            new ClientDto("BIGFUND", "EEEEE5555E", null, null, false, false),
        }, Http.Json).Result;
        r.EnsureSuccessStatusCode();
    }

    public void Dispose()
    {
        _http.Dispose();
        _app.Dispose();
    }

    private static TradeExecuted Trade(string id, double ms, string buyer, string seller, long qty, decimal px, string sym = "INFY") =>
        new(id, T0.AddMilliseconds(ms), sym, "t" + id, px, qty, buyer, seller, "b" + id, "s" + id);

    private static MarketEvent[] Scenario() => new MarketEvent[]
    {
        Trade("w1", 0, "ALICE", "ALICE_HUF", 500, 1500.10m),                                       // wash
        new OrderPlaced("s1", T0.AddMilliseconds(1_000), "INFY", "SPOOF1", "CAROL", Side.Buy, 25_000, 1499.00m, 1499.00m, 1499.50m),
        new OrderCancelled("s2", T0.AddMilliseconds(1_800), "INFY", "SPOOF1"),
        Trade("s3", 1_900, "BOB", "CAROL", 3_000, 1499.50m),                                       // spoof completes
        Trade("f1", 10_000, "DEALER7", "BOB", 4_000, 1499.60m),
        new OrderPlaced("f2", T0.AddMilliseconds(25_000), "INFY", "BIG1", "BIGFUND", Side.Buy, 90_000, 1501.00m, 1499.50m, 1499.70m), // front-run
    };

    private async Task<PagedAlerts> Alerts(string query = "") =>
        await (await _http.GetAsync("/api/alerts" + query)).Read<PagedAlerts>();

    [Fact]
    public async Task One_scenario_raises_one_alert_per_rule_each_with_a_45_day_deadline()
    {
        var result = await (await _http.PostEvents(Scenario())).Read<IngestResult>();
        Assert.Equal(6, result.Processed);
        Assert.Equal(3, result.AlertsCreated);

        var page = await Alerts();
        Assert.Equal(new[] { RuleIds.FrontRunning, RuleIds.Spoofing, RuleIds.WashTrade }, page.Items.Select(a => a.RuleId).Order());
        Assert.All(page.Items, a =>
        {
            Assert.Equal(AlertStatus.Open, a.Status);
            Assert.Equal(a.GeneratedAt.AddDays(45), a.DueAt);
            Assert.Equal(45, a.DaysToDue);
            Assert.False(a.Breached);
            Assert.Contains("NSE/INVG/65921", a.Citation);
        });
    }

    [Fact]
    public async Task Redelivering_the_same_batch_changes_nothing()
    {
        await _http.PostEvents(Scenario());
        var again = await (await _http.PostEvents(Scenario())).Read<IngestResult>();

        Assert.Equal(6, again.Duplicates);
        Assert.Equal(0, again.Processed);
        Assert.Equal(0, again.AlertsCreated + again.AlertsUpdated);
        Assert.Equal(3, (await Alerts()).Total);
        Assert.All((await Alerts()).Items, a => Assert.Equal(1, a.Occurrences));
    }

    [Fact]
    public async Task Repeat_wash_trades_fold_into_one_alert_and_count_occurrences()
    {
        await _http.PostEvents(new[] { Trade("a", 0, "ALICE", "ALICE_HUF", 100, 10m), Trade("b", 5_000, "ALICE_HUF", "ALICE", 100, 10m) });
        await _http.PostEvents(new[] { Trade("c", 9_000, "ALICE", "ALICE_HUF", 100, 10m) });

        var alert = Assert.Single((await Alerts()).Items);
        Assert.Equal(3, alert.Occurrences);
        Assert.Equal(new[] { "a", "b", "c" }, alert.EvidenceEventIds);
    }

    [Fact]
    public async Task Closing_needs_a_reviewer_and_a_reason()
    {
        await _http.PostEvents(Scenario());
        var a = (await Alerts()).Items[0];

        var r = await _http.PostAsJsonAsync($"/api/alerts/{a.Id}/close",
            new CloseRequest("ops.reviewer", Disposition.NoAdverseFinding, " ", null, a.Version), Http.Json);
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
    }

    [Fact]
    public async Task Closing_after_the_deadline_without_a_delay_reason_is_refused_with_the_citation()
    {
        await _http.PostEvents(Scenario());
        var a = (await Alerts()).Items[0];
        _app.Clock.Advance(TimeSpan.FromDays(46));

        Assert.True((await Alerts("?breached=true")).Total == 3);

        var refused = await _http.PostAsJsonAsync($"/api/alerts/{a.Id}/close",
            new CloseRequest("ops.reviewer", Disposition.ReportedToExchange, "Pattern confirmed with order-entry logs", null, a.Version), Http.Json);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, refused.StatusCode);
        var problem = JsonDocument.Parse(await refused.Content.ReadAsStringAsync()).RootElement;
        Assert.Contains("para 1.3", problem.GetProperty("citation").GetString());

        var closed = await (await _http.PostAsJsonAsync($"/api/alerts/{a.Id}/close",
            new CloseRequest("ops.reviewer", Disposition.ReportedToExchange, "Pattern confirmed with order-entry logs",
                "Exchange data for the session arrived on day 44", a.Version), Http.Json)).Read<AlertDto>();
        Assert.Equal(AlertStatus.Closed, closed.Status);
        Assert.Equal("Exchange data for the session arrived on day 44", closed.DelayReason);
        Assert.False(closed.Breached);
        Assert.Equal(2, closed.Transitions!.Count); // generated, closed
    }

    [Fact]
    public async Task A_decision_made_on_a_stale_screen_is_rejected()
    {
        await _http.PostEvents(Scenario());
        var a = (await Alerts()).Items[0];

        var first = await _http.PostAsJsonAsync($"/api/alerts/{a.Id}/review", new ReviewRequest("reviewer.one", null, a.Version), Http.Json);
        first.EnsureSuccessStatusCode();
        var second = await _http.PostAsJsonAsync($"/api/alerts/{a.Id}/close",
            new CloseRequest("reviewer.two", Disposition.NoAdverseFinding, "Looks fine", null, a.Version), Http.Json); // old version
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Closed_alert_cannot_be_closed_again_and_a_new_pattern_opens_a_fresh_alert()
    {
        await _http.PostEvents(new[] { Trade("x1", 0, "BOB", "BOB", 10, 10m) });
        var a = Assert.Single((await Alerts()).Items);
        var closed = await (await _http.PostAsJsonAsync($"/api/alerts/{a.Id}/close",
            new CloseRequest("ops", Disposition.NoAdverseFinding, "Error trade, corrected", null, a.Version), Http.Json)).Read<AlertDto>();

        var again = await _http.PostAsJsonAsync($"/api/alerts/{a.Id}/close",
            new CloseRequest("ops", Disposition.NoAdverseFinding, "again", null, closed.Version), Http.Json);
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);

        await _http.PostEvents(new[] { Trade("x2", 1_000, "BOB", "BOB", 10, 10m) }); // same pair, same day
        Assert.Equal(2, (await Alerts()).Total);
    }

    [Fact]
    public async Task Aging_report_buckets_open_alerts_by_distance_to_deadline()
    {
        await _http.PostEvents(Scenario());
        _app.Clock.Advance(TimeSpan.FromDays(40)); // 5 days left on every alert

        var report = await (await _http.GetAsync("/api/reports/aging")).Read<AgingReport>();
        Assert.Equal(_app.OnSqlServer ? "dbo.usp_AlertAging" : "linq", report.ComputedBy);
        Assert.Equal(3, report.Rows.Count);
        Assert.All(report.Rows, r => { Assert.Equal(1, r.DueWithin7Days); Assert.Equal(0, r.Breached); });

        _app.Clock.Advance(TimeSpan.FromDays(6));
        report = await (await _http.GetAsync("/api/reports/aging")).Read<AgingReport>();
        Assert.Equal(3, report.Rows.Sum(r => r.Breached));
    }

    [Fact]
    public async Task Policy_endpoint_shows_each_rule_its_threshold_and_its_source()
    {
        var policy = JsonDocument.Parse(await _http.GetStringAsync("/api/policy")).RootElement;
        Assert.Equal(45, policy.GetProperty("dispositionDays").GetInt32());
        Assert.StartsWith("SYNTHETIC DEMO POLICY", policy.GetProperty("approvedBy").GetString());
        Assert.All(policy.GetProperty("rules").EnumerateArray(), r => Assert.True(r.GetProperty("enabled").GetBoolean()));
    }

    [Fact]
    public async Task Events_without_ids_are_rejected_before_they_reach_the_engine()
    {
        var r = await _http.PostEvents(new MarketEvent[] { Trade("", 0, "BOB", "BOB", 1, 1m) });
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
    }

    [Fact]
    public async Task Health_reports_engine_state()
    {
        await _http.PostEvents(Scenario());
        var health = JsonDocument.Parse(await _http.GetStringAsync("/health")).RootElement;
        Assert.Equal(6, health.GetProperty("engine").GetProperty("eventsProcessed").GetInt64());
        Assert.Equal(6, health.GetProperty("engine").GetProperty("knownClients").GetInt32());
    }
}

public class PolicyGapTests
{
    [Fact]
    public async Task With_no_disposition_days_configured_alerts_carry_no_deadline_and_say_why()
    {
        using var app = new ApiFactory(new() { ["Surveillance:Policy:DispositionDays"] = "" });
        using var http = app.CreateClient();
        await http.PostEvents(new MarketEvent[]
        {
            new TradeExecuted("z1", DateTimeOffset.UtcNow, "TCS", "t", 1m, 1, "BOB", "BOB", "b", "s"),
        });

        var page = await (await http.GetAsync("/api/alerts")).Read<PagedAlerts>();
        var a = Assert.Single(page.Items);
        Assert.Null(a.DueAt);
        var detail = await (await http.GetAsync($"/api/alerts/{a.Id}")).Read<AlertDto>();
        Assert.Contains("no disposition deadline configured", detail.Transitions![0].Note);
    }
}

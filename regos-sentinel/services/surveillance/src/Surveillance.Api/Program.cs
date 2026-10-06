using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Surveillance.Api.Data;
using Surveillance.Api.Messaging;
using Surveillance.Api.Services;
using Surveillance.Core.Domain;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => c.SwaggerDoc("v1", new() { Title = "RegOS Surveillance Desk", Version = "v1" }));
builder.Services.AddProblemDetails();

// Database: SQL Server in production, SQLite for local runs and tests. Same model, same queries.
var provider = builder.Configuration["Database:Provider"] ?? "Sqlite";
var conn = builder.Configuration.GetConnectionString("Surveillance") ?? "Data Source=surveillance.db";
builder.Services.AddDbContext<SurveillanceDbContext>(o =>
{
    if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
        o.UseSqlServer(conn, sql => sql.EnableRetryOnFailure(3));
    else
        o.UseSqlite(conn);
});

var policy = builder.Configuration.GetSection("Surveillance:Policy").Get<SurveillancePolicy>() ?? new SurveillancePolicy();
builder.Services.AddSingleton(policy);
builder.Services.AddSingleton<EngineHost>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<IngestionService>();
builder.Services.AddScoped<AlertService>();
builder.Services.AddScoped<AgingReportService>();

builder.Services.Configure<KafkaOptions>(builder.Configuration.GetSection("Kafka"));
var kafka = builder.Configuration.GetSection("Kafka").Get<KafkaOptions>() ?? new KafkaOptions();
if (kafka.Enabled)
{
    builder.Services.AddSingleton<IAlertPublisher, KafkaAlertPublisher>();
    builder.Services.AddSingleton<KafkaIngestWorker>();
    builder.Services.AddHostedService(sp => sp.GetRequiredService<KafkaIngestWorker>());
}
else
{
    builder.Services.AddSingleton<IAlertPublisher, NoopAlertPublisher>();
}

var app = builder.Build();

// Workflow violations become RFC 7807 problem responses that carry the paragraph that imposes the rule.
app.UseExceptionHandler(errors => errors.Run(async ctx =>
{
    var ex = ctx.Features.Get<IExceptionHandlerFeature>()?.Error;
    var problem = ex is WorkflowException w
        ? new ProblemDetails { Status = w.Status, Title = w.Title, Detail = w.Message }
        : new ProblemDetails { Status = 500, Title = "Unexpected error" };
    if (ex is WorkflowException { Citation: { } cite }) problem.Extensions["citation"] = cite;
    ctx.Response.StatusCode = problem.Status!.Value;
    await ctx.Response.WriteAsJsonAsync(problem, options: null, contentType: "application/problem+json");
}));

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SurveillanceDbContext>();
    await DbInitializer.InitialiseAsync(db);
    await app.Services.GetRequiredService<EngineHost>().ReloadKycAsync(db, CancellationToken.None);
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseDefaultFiles();
app.UseStaticFiles(); // the React console, built into wwwroot
app.MapControllers();

app.MapGet("/health", (EngineHost host, IServiceProvider sp) =>
{
    var (trades, resting, pending) = host.Engine.ResidentState();
    var worker = sp.GetService<KafkaIngestWorker>();
    return Results.Ok(new
    {
        status = "ok",
        database = provider,
        kafka = kafka.Enabled ? new { topic = kafka.EventsTopic, consumed = worker?.Consumed, deadLettered = worker?.DeadLettered } : null,
        engine = new
        {
            host.Engine.Stats.EventsProcessed,
            host.Engine.Stats.OutOfOrderEvents,
            signalsByRule = host.Engine.Stats.SignalsByRule,
            residentTrades = trades,
            restingLargeOrders = resting,
            pendingSpoofs = pending,
            knownClients = host.KnownClients,
        },
        policyApprovedBy = host.Policy.ApprovedBy,
    });
});

app.MapFallbackToFile("index.html");
app.Run();

public partial class Program; // for WebApplicationFactory in the integration tests

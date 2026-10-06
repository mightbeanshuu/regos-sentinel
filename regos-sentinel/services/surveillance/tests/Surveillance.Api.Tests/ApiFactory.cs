using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Time.Testing;
using Surveillance.Api.Data;
using Surveillance.Core.Domain;

namespace Surveillance.Api.Tests;

/// <summary>
/// Boots the real API in-process. SQLite in-memory by default; set SURV_SQLSERVER to a connection string to run
/// the very same tests against SQL Server (CI does, with a mssql/server:2022 service container).
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    public static readonly string? SqlServer = Environment.GetEnvironmentVariable("SURV_SQLSERVER");
    private readonly SqliteConnection _sqlite = new("DataSource=:memory:");
    private readonly string _sqlServerDb = $"surv_test_{Guid.NewGuid():N}";
    private string? _sqlServerConn;
    private readonly Dictionary<string, string?> _settings;

    public ApiFactory(Dictionary<string, string?>? settings = null)
    {
        _settings = settings ?? new();
    }

    public FakeTimeProvider Clock { get; } = new(new DateTimeOffset(2026, 10, 6, 4, 0, 0, TimeSpan.Zero));

    public bool OnSqlServer => !string.IsNullOrWhiteSpace(SqlServer);

    protected override void ConfigureWebHost(IWebHostBuilder b)
    {
        b.UseEnvironment("Testing");
        b.UseSetting("Kafka:BootstrapServers", "");
        b.UseSetting("Database:Provider", OnSqlServer ? "SqlServer" : "Sqlite");
        foreach (var (k, v) in _settings) b.UseSetting(k, v);

        b.ConfigureServices(s =>
        {
            s.RemoveAll<DbContextOptions<SurveillanceDbContext>>();
            if (OnSqlServer)
            {
                _sqlServerConn = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(SqlServer) { InitialCatalog = _sqlServerDb }.ConnectionString;
                s.AddDbContext<SurveillanceDbContext>(o => o.UseSqlServer(_sqlServerConn));
            }
            else
            {
                _sqlite.Open();
                s.AddDbContext<SurveillanceDbContext>(o => o.UseSqlite(_sqlite));
            }
            s.RemoveAll<TimeProvider>();
            s.AddSingleton<TimeProvider>(Clock);
        });
    }

    protected override void Dispose(bool disposing)
    {
        // The factory disposes its own service provider first, so the per-test database is dropped with a context
        // built here, after pooled connections are cleared (otherwise SQL Server reports the database "in use").
        base.Dispose(disposing);
        if (!disposing) return;
        _sqlite.Dispose();
        if (_sqlServerConn is null) return;
        Microsoft.Data.SqlClient.SqlConnection.ClearAllPools();
        using var db = new SurveillanceDbContext(new DbContextOptionsBuilder<SurveillanceDbContext>().UseSqlServer(_sqlServerConn).Options);
        db.Database.EnsureDeleted();
    }
}

internal static class Http
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    public static Task<HttpResponseMessage> PostEvents(this HttpClient c, IEnumerable<MarketEvent> events) =>
        c.PostAsJsonAsync("/api/events", events.ToList(), Json); // declared as List<MarketEvent> so "type" is written

    public static async Task<T> Read<T>(this HttpResponseMessage r)
    {
        var body = await r.Content.ReadAsStringAsync();
        Assert.True(r.IsSuccessStatusCode, $"{(int)r.StatusCode}: {body}");
        return JsonSerializer.Deserialize<T>(body, Json)!;
    }
}

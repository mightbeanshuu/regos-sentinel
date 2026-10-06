using Microsoft.EntityFrameworkCore;

namespace Surveillance.Api.Data;

public static class DbInitializer
{
    /// <summary>
    /// Alert ageing, computed where the data lives. One pass over the open-alert index, bucketed by how far each
    /// alert is from its NSE/SURV/48818 para 1.2 deadline. Created or replaced on every start, so it never drifts
    /// from the schema it reads.
    /// </summary>
    public const string AgingProcedure = """
        CREATE OR ALTER PROCEDURE dbo.usp_AlertAging
            @AsOf DATETIME2
        AS
        BEGIN
            SET NOCOUNT ON;
            SELECT  a.RuleId,
                    COUNT(*)                                                                              AS OpenAlerts,
                    SUM(CASE WHEN a.DueAt IS NULL THEN 1 ELSE 0 END)                                      AS NoDeadline,
                    SUM(CASE WHEN a.DueAt < @AsOf THEN 1 ELSE 0 END)                                      AS Breached,
                    SUM(CASE WHEN a.DueAt >= @AsOf AND a.DueAt < DATEADD(DAY, 7, @AsOf) THEN 1 ELSE 0 END) AS DueWithin7Days,
                    SUM(CASE WHEN a.DueAt >= DATEADD(DAY, 7, @AsOf)
                              AND a.DueAt < DATEADD(DAY, 30, @AsOf) THEN 1 ELSE 0 END)                    AS DueIn8To30Days,
                    SUM(CASE WHEN a.DueAt >= DATEADD(DAY, 30, @AsOf) THEN 1 ELSE 0 END)                   AS DueLater,
                    MIN(a.DueAt)                                                                          AS NextDueAt
            FROM    dbo.Alerts AS a  -- no NOLOCK: a compliance report must not count uncommitted rows
            WHERE   a.Status <> 2  -- not Closed
            GROUP BY a.RuleId
            ORDER BY Breached DESC, a.RuleId;
        END
        """;

    public static async Task InitialiseAsync(SurveillanceDbContext db, CancellationToken ct = default)
    {
        await db.Database.EnsureCreatedAsync(ct);
        if (db.Database.IsSqlServer())
            await db.Database.ExecuteSqlRawAsync(AgingProcedure, ct);
    }
}

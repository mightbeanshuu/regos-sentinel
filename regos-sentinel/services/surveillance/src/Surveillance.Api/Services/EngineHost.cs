using Microsoft.EntityFrameworkCore;
using Surveillance.Api.Data;
using Surveillance.Core.Domain;
using Surveillance.Core.Engine;
using Surveillance.Core.Kyc;

namespace Surveillance.Api.Services;

/// <summary>
/// Owns the single detection engine and the lock that serialises everything that touches it.
/// One writer is deliberate: the engine's windows are only correct if events reach it in order.
/// </summary>
public sealed class EngineHost
{
    public EngineHost(SurveillancePolicy policy)
    {
        Policy = policy;
        Engine = new SurveillanceEngine(policy, KycLinkGraph.Build(Array.Empty<ClientProfile>()));
    }

    public SurveillancePolicy Policy { get; }
    public SurveillanceEngine Engine { get; }
    public SemaphoreSlim Gate { get; } = new(1, 1);
    public int KnownClients { get; private set; }

    public async Task ReloadKycAsync(SurveillanceDbContext db, CancellationToken ct)
    {
        var clients = await db.Clients.AsNoTracking()
            .Select(c => new ClientProfile(c.ClientId, c.Pan, c.Mobile, c.Email, c.IsDealer, c.OnWatchlist))
            .ToListAsync(ct);
        Engine.ReplaceKyc(KycLinkGraph.Build(clients));
        KnownClients = clients.Count;
    }
}

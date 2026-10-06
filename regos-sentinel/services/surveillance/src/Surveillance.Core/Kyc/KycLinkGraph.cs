namespace Surveillance.Core.Kyc;

public sealed record ClientProfile(
    string ClientId,
    string? Pan = null,
    string? Mobile = null,
    string? Email = null,
    bool IsDealer = false,
    bool OnWatchlist = false);

/// <summary>
/// Groups clients that share a KYC attribute (PAN, mobile, e-mail), transitively, with a union-find.
/// The guidance note lists "same mobile number / email id tagged to different client accounts" and
/// "potential connections and relations between clients, based on KYC" as factors to assess.
/// Build is O(n·α(n)); every lookup afterwards is effectively O(1).
/// </summary>
public sealed class KycLinkGraph
{
    private readonly Dictionary<string, int> _index = new(StringComparer.Ordinal);
    private readonly Dictionary<string, ClientProfile> _profiles = new(StringComparer.Ordinal);
    private int[] _parent = Array.Empty<int>();
    private int[] _rank = Array.Empty<int>();

    public static KycLinkGraph Build(IEnumerable<ClientProfile> clients)
    {
        var g = new KycLinkGraph();
        var list = clients.ToList();
        g._parent = new int[list.Count];
        g._rank = new int[list.Count];
        var firstOwner = new Dictionary<string, int>(StringComparer.Ordinal);

        for (var i = 0; i < list.Count; i++)
        {
            var c = list[i];
            g._index[c.ClientId] = i;
            g._profiles[c.ClientId] = c;
            g._parent[i] = i;
            foreach (var key in AttributeKeys(c))
            {
                if (firstOwner.TryGetValue(key, out var j)) g.Union(i, j);
                else firstOwner[key] = i;
            }
        }
        return g;
    }

    public int Count => _profiles.Count;

    public ClientProfile? Profile(string clientId) => _profiles.GetValueOrDefault(clientId);

    /// <summary>True for the same client, or two clients joined by any chain of shared KYC attributes.</summary>
    public bool AreLinked(string a, string b)
    {
        if (a == b) return true;
        if (!_index.TryGetValue(a, out var ia) || !_index.TryGetValue(b, out var ib)) return false;
        return Find(ia) == Find(ib);
    }

    /// <summary>The attributes two clients share directly, for the alert's evidence ("shared mobile ...4821").</summary>
    public IReadOnlyList<string> SharedAttributes(string a, string b)
    {
        if (a == b) return new[] { "same client code" };
        if (!_profiles.TryGetValue(a, out var pa) || !_profiles.TryGetValue(b, out var pb)) return Array.Empty<string>();
        var shared = AttributeKeys(pa).Intersect(AttributeKeys(pb)).Select(Describe).ToList();
        if (shared.Count == 0 && AreLinked(a, b)) shared.Add("same KYC group through other accounts");
        return shared;
    }

    private static IEnumerable<string> AttributeKeys(ClientProfile c)
    {
        if (Norm(c.Pan) is { } pan) yield return "pan:" + pan;
        if (NormMobile(c.Mobile) is { } mobile) yield return "mobile:" + mobile;
        if (Norm(c.Email) is { } email) yield return "email:" + email;
    }

    private static string Describe(string key)
    {
        var (kind, value) = (key[..key.IndexOf(':')], key[(key.IndexOf(':') + 1)..]);
        var tail = value.Length > 4 ? value[^4..] : value;
        return $"shared {kind} ...{tail}";
    }

    private static string? Norm(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim().ToLowerInvariant();

    /// <summary>"+91 98765-43210", "098765 43210" and "9876543210" are the same phone.</summary>
    private static string? NormMobile(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return null;
        var digits = new string(s.Where(char.IsDigit).ToArray());
        return digits.Length >= 10 ? digits[^10..] : null;
    }

    private int Find(int x)
    {
        while (_parent[x] != x)
        {
            _parent[x] = _parent[_parent[x]]; // path halving
            x = _parent[x];
        }
        return x;
    }

    private void Union(int a, int b)
    {
        int ra = Find(a), rb = Find(b);
        if (ra == rb) return;
        if (_rank[ra] < _rank[rb]) (ra, rb) = (rb, ra);
        _parent[rb] = ra;
        if (_rank[ra] == _rank[rb]) _rank[ra]++;
    }
}

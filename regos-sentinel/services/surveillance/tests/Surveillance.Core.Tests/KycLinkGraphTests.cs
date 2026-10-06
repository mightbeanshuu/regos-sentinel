using Surveillance.Core.Kyc;

namespace Surveillance.Core.Tests;

public class KycLinkGraphTests
{
    [Fact]
    public void Clients_sharing_a_mobile_are_linked_even_when_formatted_differently()
    {
        var g = KycLinkGraph.Build(new[]
        {
            new ClientProfile("C1", Mobile: "+91 98765-43210"),
            new ClientProfile("C2", Mobile: "09876543210"),
            new ClientProfile("C3", Mobile: "9123456780"),
        });

        Assert.True(g.AreLinked("C1", "C2"));
        Assert.False(g.AreLinked("C1", "C3"));
        Assert.Contains("shared mobile ...3210", g.SharedAttributes("C1", "C2"));
    }

    [Fact]
    public void Links_are_transitive_across_different_attributes()
    {
        // C1-C2 share a PAN, C2-C3 share an e-mail: C1 and C3 share nothing directly but are one group.
        var g = KycLinkGraph.Build(new[]
        {
            new ClientProfile("C1", Pan: "ABCDE1234F"),
            new ClientProfile("C2", Pan: "abcde1234f", Email: "Ops@Firm.in"),
            new ClientProfile("C3", Email: "ops@firm.in"),
            new ClientProfile("C4", Email: "other@firm.in"),
        });

        Assert.True(g.AreLinked("C1", "C3"));
        Assert.False(g.AreLinked("C3", "C4"));
        Assert.Equal(new[] { "same KYC group through other accounts" }, g.SharedAttributes("C1", "C3"));
    }

    [Fact]
    public void Blank_and_short_attributes_never_link_anyone()
    {
        var g = KycLinkGraph.Build(new[]
        {
            new ClientProfile("C1", Pan: " ", Mobile: "12345", Email: ""),
            new ClientProfile("C2", Pan: " ", Mobile: "12345", Email: ""),
        });

        Assert.False(g.AreLinked("C1", "C2"));
    }

    [Fact]
    public void A_client_is_linked_to_itself_even_if_unknown()
    {
        var g = KycLinkGraph.Build(Array.Empty<ClientProfile>());
        Assert.True(g.AreLinked("ghost", "ghost"));
        Assert.False(g.AreLinked("ghost", "other"));
    }

    [Fact]
    public void Ten_thousand_clients_in_one_chain_resolve_to_one_group()
    {
        // Each client shares exactly one attribute with the next (alternating mobile / e-mail), so C0 and C9999
        // are joined only through 9,998 intermediaries: a worst case for a tree without path compression.
        static string Phone(int i) => $"9{i:000000000}";
        static string Mail(int i) => $"u{i}@x.in";
        var clients = Enumerable.Range(0, 10_000)
            .Select(i => i % 2 == 0
                ? new ClientProfile($"C{i}", Mobile: Phone(i + 1), Email: Mail(i))
                : new ClientProfile($"C{i}", Mobile: Phone(i), Email: Mail(i + 1)))
            .ToList();
        var g = KycLinkGraph.Build(clients);

        Assert.True(g.AreLinked("C0", "C9999"));
    }
}

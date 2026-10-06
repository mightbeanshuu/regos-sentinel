using Microsoft.EntityFrameworkCore;

namespace Surveillance.Api.Data;

public sealed class SurveillanceDbContext(DbContextOptions<SurveillanceDbContext> options) : DbContext(options)
{
    public DbSet<AlertEntity> Alerts => Set<AlertEntity>();
    public DbSet<AlertTransition> AlertTransitions => Set<AlertTransition>();
    public DbSet<ProcessedEvent> ProcessedEvents => Set<ProcessedEvent>();
    public DbSet<ClientEntity> Clients => Set<ClientEntity>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<AlertEntity>(e =>
        {
            e.ToTable("Alerts");
            e.HasKey(a => a.Id);
            e.Property(a => a.DedupKey).HasMaxLength(300).IsRequired();
            e.Property(a => a.RuleId).HasMaxLength(40).IsRequired();
            e.Property(a => a.Symbol).HasMaxLength(40).IsRequired();
            e.Property(a => a.Summary).HasMaxLength(1000);
            e.Property(a => a.Citation).HasMaxLength(600);
            e.Property(a => a.ClosedBy).HasMaxLength(120);
            e.Property(a => a.ClosingReason).HasMaxLength(2000);
            e.Property(a => a.DelayReason).HasMaxLength(2000);
            e.Property(a => a.Version).IsConcurrencyToken();
            // The two hot queries: "what is open and when is it due" and "is there an open alert for this key".
            e.HasIndex(a => new { a.Status, a.DueAt });
            e.HasIndex(a => new { a.DedupKey, a.Status });
            e.HasIndex(a => new { a.Symbol, a.RuleId });
            e.HasMany(a => a.Transitions).WithOne().HasForeignKey(t => t.AlertId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<AlertTransition>(e =>
        {
            e.ToTable("AlertTransitions");
            e.HasKey(t => t.Id);
            e.Property(t => t.Actor).HasMaxLength(120).IsRequired();
            e.Property(t => t.Note).HasMaxLength(2000);
        });

        b.Entity<ProcessedEvent>(e =>
        {
            e.ToTable("ProcessedEvents");
            e.HasKey(p => p.EventId);
            e.Property(p => p.EventId).HasMaxLength(100);
        });

        b.Entity<ClientEntity>(e =>
        {
            e.ToTable("Clients");
            e.HasKey(c => c.ClientId);
            e.Property(c => c.ClientId).HasMaxLength(60);
            e.Property(c => c.Pan).HasMaxLength(20);
            e.Property(c => c.Mobile).HasMaxLength(30);
            e.Property(c => c.Email).HasMaxLength(200);
        });
    }
}

using Microsoft.EntityFrameworkCore;
using RiderService.Models;

namespace RiderService.Data;

public class RiderDbContext : DbContext
{
    public RiderDbContext(DbContextOptions<RiderDbContext> options) : base(options)
    {
    }

    public DbSet<Rider> Riders { get; set; }
    public DbSet<RiderAvailability> RiderAvailability { get; set; }
    public DbSet<RiderEarning> RiderEarnings { get; set; }
    public DbSet<RiderFeedback> RiderFeedback { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Rider>(entity =>
        {
            entity.HasKey(e => e.RiderId);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(50);
        });

        modelBuilder.Entity<RiderAvailability>(entity =>
        {
            entity.HasKey(e => e.AvailabilityId);
            entity.HasOne(e => e.Rider)
                  .WithMany()
                  .HasForeignKey(e => e.RiderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RiderEarning>(entity =>
        {
            entity.HasKey(e => e.EarningId);
            entity.HasOne(e => e.Rider)
                  .WithMany()
                  .HasForeignKey(e => e.RiderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RiderFeedback>(entity =>
        {
            entity.HasKey(e => e.FeedbackId);
            entity.HasOne(e => e.Rider)
                  .WithMany()
                  .HasForeignKey(e => e.RiderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

/*
 * UnifiedService Architecture - Rider DbContext
 * 
 * Part of UnifiedService on port 5000.
 * Each domain maintains its own database (RiderServiceDB) for separation of concerns.
 */
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using RiderService.Models;
using System.Data;
using UnifiedService.Data;

namespace RiderService.Data;

public class RiderDbContext : StoredProcedureDbContext
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

    #region Rider Stored Procedure Methods

    public async Task<RiderAvailability?> SpRiderGetAvailabilityAsync(int riderId)
    {
        var parameters = new[]
        {
            new SqlParameter("@RiderId", SqlDbType.Int) { Value = riderId }
        };

        return await ExecuteSpSingleAsync<RiderAvailability>("dbo.sp_Rider_GetAvailability", parameters);
    }

    public async Task<List<Rider>> SpRiderGetOnlineAsync()
    {
        return await ExecuteSpAsync<Rider>("dbo.sp_Rider_GetOnline");
    }

    #endregion
}

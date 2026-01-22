/*
 * Database-First Architecture - Rider DbContext
 * 
 * ARCHITECTURAL RULES ENFORCED:
 * - ALL data access through stored procedures only
 * - DbSet properties kept for EF Core SP result mapping only
 * - NO LINQ queries against DbSets allowed
 * - NO Add/Update/Remove/SaveChanges (except via SP wrappers)
 */
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using RiderService.Models;
using System.Data;
using UnifiedService.Data;

namespace RiderService.Data;

/// <summary>
/// Rider database context - stored procedure execution only.
/// Connects to RiderServiceDB.
/// </summary>
public class RiderDbContext : StoredProcedureDbContext
{
    public RiderDbContext(DbContextOptions<RiderDbContext> options) : base(options)
    {
    }

    // DbSets kept for SP result mapping only - DO NOT use for LINQ queries
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
            entity.Property(e => e.CurrentLatitude).HasPrecision(9, 6);
            entity.Property(e => e.CurrentLongitude).HasPrecision(9, 6);
            entity.HasOne(e => e.Rider)
                  .WithMany()
                  .HasForeignKey(e => e.RiderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RiderEarning>(entity =>
        {
            entity.HasKey(e => e.EarningId);
            entity.Property(e => e.Amount).HasPrecision(10, 2);
            entity.Property(e => e.CommissionRate).HasPrecision(5, 2);
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

    /// <summary>
    /// sp_Rider_GetById: Get rider by ID.
    /// </summary>
    public async Task<Rider?> SpRiderGetByIdAsync(int riderId)
    {
        var parameters = new[]
        {
            new SqlParameter("@RiderId", SqlDbType.Int) { Value = riderId }
        };

        return await ExecuteSpSingleAsync<Rider>("dbo.sp_Rider_GetById", parameters);
    }

    /// <summary>
    /// sp_Rider_GetByUserId: Get rider by User ID.
    /// </summary>
    public async Task<Rider?> SpRiderGetByUserIdAsync(int userId)
    {
        var parameters = new[]
        {
            new SqlParameter("@UserId", SqlDbType.Int) { Value = userId }
        };

        return await ExecuteSpSingleAsync<Rider>("dbo.sp_Rider_GetByUserId", parameters);
    }

    /// <summary>
    /// sp_Rider_GetAll: Get all riders.
    /// </summary>
    public async Task<List<Rider>> SpRiderGetAllAsync()
    {
        return await ExecuteSpAsync<Rider>("dbo.sp_Rider_GetAll");
    }

    /// <summary>
    /// sp_Rider_GetOnline: Get all online riders.
    /// </summary>
    public async Task<List<Rider>> SpRiderGetOnlineAsync()
    {
        return await ExecuteSpAsync<Rider>("dbo.sp_Rider_GetOnline");
    }

    /// <summary>
    /// sp_Rider_GetAvailability: Get rider availability.
    /// </summary>
    public async Task<RiderAvailability?> SpRiderGetAvailabilityAsync(int riderId)
    {
        var parameters = new[]
        {
            new SqlParameter("@RiderId", SqlDbType.Int) { Value = riderId }
        };

        return await ExecuteSpSingleAsync<RiderAvailability>("dbo.sp_Rider_GetAvailability", parameters);
    }

    /// <summary>
    /// sp_Rider_SetOnlineStatus: Set rider online/offline status.
    /// </summary>
    public async Task<(RiderAvailability? Availability, int ResultCode, string ResultMessage)> SpRiderSetOnlineStatusAsync(
        int riderId, bool isOnline, decimal? latitude = null, decimal? longitude = null)
    {
        var inputParams = new[]
        {
            new SqlParameter("@RiderId", SqlDbType.Int) { Value = riderId },
            new SqlParameter("@IsOnline", SqlDbType.Bit) { Value = isOnline },
            new SqlParameter("@Latitude", SqlDbType.Decimal) { Value = (object?)latitude ?? DBNull.Value, Precision = 9, Scale = 6 },
            new SqlParameter("@Longitude", SqlDbType.Decimal) { Value = (object?)longitude ?? DBNull.Value, Precision = 9, Scale = 6 }
        };

        var resultCodeParam = CreateOutputParam("@ResultCode", SqlDbType.Int);
        var resultMessageParam = CreateOutputParam("@ResultMessage", SqlDbType.NVarChar, 500);

        var (data, resultCode, resultMessage) = await ExecuteSpWithResultAsync<RiderAvailability>(
            "dbo.sp_Rider_SetOnlineStatus", inputParams, resultCodeParam, resultMessageParam);

        return (data.FirstOrDefault(), resultCode, resultMessage);
    }

    /// <summary>
    /// sp_Rider_GetEarnings: Get rider earnings.
    /// </summary>
    public async Task<List<RiderEarning>> SpRiderGetEarningsAsync(int riderId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var parameters = new[]
        {
            new SqlParameter("@RiderId", SqlDbType.Int) { Value = riderId },
            new SqlParameter("@StartDate", SqlDbType.DateTime2) { Value = (object?)startDate ?? DBNull.Value },
            new SqlParameter("@EndDate", SqlDbType.DateTime2) { Value = (object?)endDate ?? DBNull.Value }
        };

        return await ExecuteSpAsync<RiderEarning>("dbo.sp_Rider_GetEarnings", parameters);
    }

    /// <summary>
    /// sp_Rider_GetFeedback: Get rider feedback.
    /// </summary>
    public async Task<List<RiderFeedback>> SpRiderGetFeedbackAsync(int riderId)
    {
        var parameters = new[]
        {
            new SqlParameter("@RiderId", SqlDbType.Int) { Value = riderId }
        };

        return await ExecuteSpAsync<RiderFeedback>("dbo.sp_Rider_GetFeedback", parameters);
    }

    #endregion
}

/*
 * Database-First Architecture - Delivery DbContext
 * 
 * ARCHITECTURAL RULES ENFORCED:
 * - ALL data access through stored procedures only
 * - DbSet properties kept for EF Core SP result mapping only
 * - NO LINQ queries against DbSets allowed
 * - NO Add/Update/Remove/SaveChanges
 */
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using DeliveryService.Models;
using System.Data;
using UnifiedService.Data;

namespace DeliveryService.Data;

/// <summary>
/// Delivery database context - stored procedure execution only.
/// Connects to DeliveryServiceDB.
/// </summary>
public class DeliveryDbContext : StoredProcedureDbContext
{
    public DeliveryDbContext(DbContextOptions<DeliveryDbContext> options) : base(options)
    {
    }

    // DbSets kept for SP result mapping only - DO NOT use for LINQ queries
    public DbSet<Delivery> Deliveries { get; set; }
    public DbSet<DeliveryStatusHistory> DeliveryStatusHistory { get; set; }
    public DbSet<DeliveryProof> DeliveryProof { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Delivery>(entity =>
        {
            entity.HasKey(e => e.DeliveryId);
            entity.Property(e => e.OrderId)
                  .IsRequired()
                  .HasComment("References OrderId in OrderServiceDB (no foreign key constraint)");
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.FailureReason).HasMaxLength(500);
        });

        modelBuilder.Entity<DeliveryStatusHistory>(entity =>
        {
            entity.HasKey(e => e.HistoryId);
            entity.HasOne(e => e.Delivery)
                  .WithMany()
                  .HasForeignKey(e => e.DeliveryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DeliveryProof>(entity =>
        {
            entity.HasKey(e => e.ProofId);
            entity.HasOne(e => e.Delivery)
                  .WithMany()
                  .HasForeignKey(e => e.DeliveryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    #region Delivery Stored Procedure Methods

    /// <summary>
    /// sp_Delivery_Create: Create delivery for order.
    /// </summary>
    public async Task<(Delivery? Delivery, int ResultCode, string ResultMessage)> SpDeliveryCreateAsync(
        int orderId, int? riderId = null)
    {
        var inputParams = new[]
        {
            new SqlParameter("@OrderId", SqlDbType.Int) { Value = orderId },
            new SqlParameter("@RiderId", SqlDbType.Int) { Value = (object?)riderId ?? DBNull.Value }
        };

        var resultCodeParam = CreateOutputParam("@ResultCode", SqlDbType.Int);
        var resultMessageParam = CreateOutputParam("@ResultMessage", SqlDbType.NVarChar, 500);

        var (data, resultCode, resultMessage) = await ExecuteSpWithResultAsync<Delivery>(
            "dbo.sp_Delivery_Create", inputParams, resultCodeParam, resultMessageParam);

        return (data.FirstOrDefault(), resultCode, resultMessage);
    }

    /// <summary>
    /// sp_Delivery_AssignRider: Assign rider to delivery.
    /// </summary>
    public async Task<(Delivery? Delivery, int ResultCode, string ResultMessage)> SpDeliveryAssignRiderAsync(
        int deliveryId, int riderId)
    {
        var inputParams = new[]
        {
            new SqlParameter("@DeliveryId", SqlDbType.Int) { Value = deliveryId },
            new SqlParameter("@RiderId", SqlDbType.Int) { Value = riderId }
        };

        var resultCodeParam = CreateOutputParam("@ResultCode", SqlDbType.Int);
        var resultMessageParam = CreateOutputParam("@ResultMessage", SqlDbType.NVarChar, 500);

        var (data, resultCode, resultMessage) = await ExecuteSpWithResultAsync<Delivery>(
            "dbo.sp_Delivery_AssignRider", inputParams, resultCodeParam, resultMessageParam);

        return (data.FirstOrDefault(), resultCode, resultMessage);
    }

    /// <summary>
    /// sp_Delivery_GetByOrderId: Get delivery by Order ID.
    /// </summary>
    public async Task<Delivery?> SpDeliveryGetByOrderIdAsync(int orderId)
    {
        var parameters = new[]
        {
            new SqlParameter("@OrderId", SqlDbType.Int) { Value = orderId }
        };

        return await ExecuteSpSingleAsync<Delivery>("dbo.sp_Delivery_GetByOrderId", parameters);
    }

    /// <summary>
    /// sp_Delivery_GetById: Get delivery by ID.
    /// </summary>
    public async Task<Delivery?> SpDeliveryGetByIdAsync(int deliveryId)
    {
        var parameters = new[]
        {
            new SqlParameter("@DeliveryId", SqlDbType.Int) { Value = deliveryId }
        };

        return await ExecuteSpSingleAsync<Delivery>("dbo.sp_Delivery_GetById", parameters);
    }

    /// <summary>
    /// sp_Delivery_GetAll: Get all deliveries.
    /// </summary>
    public async Task<List<Delivery>> SpDeliveryGetAllAsync()
    {
        return await ExecuteSpAsync<Delivery>("dbo.sp_Delivery_GetAll");
    }

    /// <summary>
    /// sp_Delivery_GetActiveByRiderId: Get active deliveries for rider.
    /// Active statuses: Assigned, Accepted, PickedUp, InTransit
    /// </summary>
    public async Task<List<Delivery>> SpDeliveryGetActiveByRiderIdAsync(int riderId)
    {
        var parameters = new[]
        {
            new SqlParameter("@RiderId", SqlDbType.Int) { Value = riderId }
        };

        return await ExecuteSpAsync<Delivery>("dbo.sp_Delivery_GetActiveByRiderId", parameters);
    }

    /// <summary>
    /// sp_Delivery_GetByRiderId: Get all deliveries for rider (for history).
    /// Returns all deliveries regardless of status.
    /// </summary>
    public async Task<List<Delivery>> SpDeliveryGetByRiderIdAsync(int riderId)
    {
        var parameters = new[]
        {
            new SqlParameter("@RiderId", SqlDbType.Int) { Value = riderId }
        };

        return await ExecuteSpAsync<Delivery>("dbo.sp_Delivery_GetByRiderId", parameters);
    }

    /// <summary>
    /// sp_Delivery_UpdateStatus: Update delivery status.
    /// Business rules (valid transitions) enforced by database.
    /// </summary>
    public async Task<(Delivery? Delivery, int ResultCode, string ResultMessage)> SpDeliveryUpdateStatusAsync(
        int deliveryId, string newStatus, string? failureReason = null)
    {
        var inputParams = new[]
        {
            new SqlParameter("@DeliveryId", SqlDbType.Int) { Value = deliveryId },
            new SqlParameter("@NewStatus", SqlDbType.NVarChar, 50) { Value = newStatus },
            new SqlParameter("@FailureReason", SqlDbType.NVarChar, 500) { Value = (object?)failureReason ?? DBNull.Value }
        };

        var resultCodeParam = CreateOutputParam("@ResultCode", SqlDbType.Int);
        var resultMessageParam = CreateOutputParam("@ResultMessage", SqlDbType.NVarChar, 500);

        var (data, resultCode, resultMessage) = await ExecuteSpWithResultAsync<Delivery>(
            "dbo.sp_Delivery_UpdateStatus", inputParams, resultCodeParam, resultMessageParam);

        return (data.FirstOrDefault(), resultCode, resultMessage);
    }

    /// <summary>
    /// sp_Delivery_AddTracking: Add tracking entry.
    /// </summary>
    public async Task<int> SpDeliveryAddTrackingAsync(
        int deliveryId, string status, decimal? latitude = null, decimal? longitude = null, string? notes = null)
    {
        var parameters = new[]
        {
            new SqlParameter("@DeliveryId", SqlDbType.Int) { Value = deliveryId },
            new SqlParameter("@Status", SqlDbType.NVarChar, 50) { Value = status },
            new SqlParameter("@Latitude", SqlDbType.Decimal) { Value = (object?)latitude ?? DBNull.Value, Precision = 9, Scale = 6 },
            new SqlParameter("@Longitude", SqlDbType.Decimal) { Value = (object?)longitude ?? DBNull.Value, Precision = 9, Scale = 6 },
            new SqlParameter("@Notes", SqlDbType.NVarChar, 1000) { Value = (object?)notes ?? DBNull.Value }
        };

        var result = await ExecuteSpScalarAsync("dbo.sp_Delivery_AddTracking", parameters);
        return result != null ? Convert.ToInt32(result) : 0;
    }

    #endregion
}

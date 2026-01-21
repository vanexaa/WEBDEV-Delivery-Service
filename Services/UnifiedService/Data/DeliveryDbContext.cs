/*
 * UnifiedService Architecture - Delivery DbContext
 * 
 * Part of UnifiedService on port 5000.
 * Each domain maintains its own database (DeliveryServiceDB) for separation of concerns.
 */
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using DeliveryService.Models;
using System.Data;
using UnifiedService.Data;

namespace DeliveryService.Data;

public class DeliveryDbContext : StoredProcedureDbContext
{
    public DeliveryDbContext(DbContextOptions<DeliveryDbContext> options) : base(options)
    {
    }

    // Note: Orders are stored in OrderServiceDB, not DeliveryServiceDB
    // DeliveryServiceDB only stores Deliveries which reference OrderId
    public DbSet<Delivery> Deliveries { get; set; }
    public DbSet<DeliveryStatusHistory> DeliveryStatusHistory { get; set; }
    public DbSet<DeliveryProof> DeliveryProof { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Note: DeliveryOrder removed - orders are in OrderServiceDB only
        
        modelBuilder.Entity<Delivery>(entity =>
        {
            entity.HasKey(e => e.DeliveryId);
            // Note: Orders are in OrderServiceDB, not DeliveryServiceDB
            // Delivery references OrderId but cannot use foreign key across databases
            // No navigation property configured - orders must be fetched separately from OrderServiceDB
            
            // Explicitly configure OrderId as a simple integer property (not a foreign key)
            entity.Property(e => e.OrderId)
                  .IsRequired()
                  .HasComment("References OrderId in OrderServiceDB (no foreign key constraint)");
            
            // Do NOT configure any HasOne/HasForeignKey relationship for OrderId
            // This ensures EF Core won't try to create a foreign key constraint
            // If a foreign key exists in the database, it must be dropped manually via SQL script
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

    public async Task<Delivery?> SpDeliveryGetByOrderIdAsync(int orderId)
    {
        var parameters = new[]
        {
            new SqlParameter("@OrderId", SqlDbType.Int) { Value = orderId }
        };

        return await ExecuteSpSingleAsync<Delivery>("dbo.sp_Delivery_GetByOrderId", parameters);
    }

    public async Task<Delivery?> SpDeliveryGetByIdAsync(int deliveryId)
    {
        var parameters = new[]
        {
            new SqlParameter("@DeliveryId", SqlDbType.Int) { Value = deliveryId }
        };

        return await ExecuteSpSingleAsync<Delivery>("dbo.sp_Delivery_GetById", parameters);
    }

    public async Task<List<Delivery>> SpDeliveryGetAllAsync()
    {
        return await ExecuteSpAsync<Delivery>("dbo.sp_Delivery_GetAll");
    }

    public async Task<List<Delivery>> SpDeliveryGetActiveByRiderIdAsync(int riderId)
    {
        var parameters = new[]
        {
            new SqlParameter("@RiderId", SqlDbType.Int) { Value = riderId }
        };

        return await ExecuteSpAsync<Delivery>("dbo.sp_Delivery_GetActiveByRiderId", parameters);
    }

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

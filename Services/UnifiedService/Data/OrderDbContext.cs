/*
 * UnifiedService Architecture - Order DbContext
 * 
 * Part of UnifiedService on port 5000.
 * Each domain maintains its own database (OrderServiceDB) for separation of concerns.
 */
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using OrderService.Models;
using System.Data;
using UnifiedService.Data;

namespace OrderService.Data;

public class OrderDbContext : StoredProcedureDbContext
{
    public OrderDbContext(DbContextOptions<OrderDbContext> options) : base(options)
    {
    }

    public DbSet<Order> Orders { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders", "dbo");
            entity.HasKey(e => e.OrderId);
            entity.Property(e => e.CustomerName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.CustomerPhone).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DeliveryAddress).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Status).HasMaxLength(50);
        });
    }

    #region Order Stored Procedure Methods

    public async Task<(Order? Order, int ResultCode, string ResultMessage)> SpOrderCreateAsync(
        int customerId,
        string customerName,
        string customerPhone,
        string deliveryAddress,
        string? specialInstructions,
        decimal orderTotal,
        string paymentMethod)
    {
        var inputParams = new[]
        {
            new SqlParameter("@CustomerId", SqlDbType.Int) { Value = customerId },
            new SqlParameter("@CustomerName", SqlDbType.NVarChar, 255) { Value = customerName },
            new SqlParameter("@CustomerPhone", SqlDbType.NVarChar, 50) { Value = customerPhone },
            new SqlParameter("@DeliveryAddress", SqlDbType.NVarChar, 500) { Value = deliveryAddress },
            new SqlParameter("@SpecialInstructions", SqlDbType.NVarChar, 1000) { Value = (object?)specialInstructions ?? DBNull.Value },
            new SqlParameter("@OrderTotal", SqlDbType.Decimal) { Value = orderTotal, Precision = 18, Scale = 2 },
            new SqlParameter("@PaymentMethod", SqlDbType.NVarChar, 50) { Value = paymentMethod }
        };

        var resultCodeParam = CreateOutputParam("@ResultCode", SqlDbType.Int);
        var resultMessageParam = CreateOutputParam("@ResultMessage", SqlDbType.NVarChar, 500);

        var (data, resultCode, resultMessage) = await ExecuteSpWithResultAsync<Order>(
            "dbo.sp_Order_Create", inputParams, resultCodeParam, resultMessageParam);

        return (data.FirstOrDefault(), resultCode, resultMessage);
    }

    public async Task<List<Order>> SpOrderGetAllAsync()
    {
        return await ExecuteSpAsync<Order>("dbo.sp_Order_GetAll");
    }

    public async Task<List<Order>> SpOrderGetByCustomerIdAsync(int customerId)
    {
        var parameters = new[]
        {
            new SqlParameter("@CustomerId", SqlDbType.Int) { Value = customerId }
        };
        return await ExecuteSpAsync<Order>("dbo.sp_Order_GetByCustomerId", parameters);
    }

    public async Task<Order?> SpOrderGetByIdAsync(int orderId)
    {
        var parameters = new[]
        {
            new SqlParameter("@OrderId", SqlDbType.Int) { Value = orderId }
        };
        return await ExecuteSpSingleAsync<Order>("dbo.sp_Order_GetById", parameters);
    }

    public async Task<List<Order>> SpOrderGetPendingAsync()
    {
        return await ExecuteSpAsync<Order>("dbo.sp_Order_GetPending");
    }

    public async Task<(Order? Order, int ResultCode, string ResultMessage)> SpOrderUpdateStatusAsync(int orderId, string newStatus)
    {
        var inputParams = new[]
        {
            new SqlParameter("@OrderId", SqlDbType.Int) { Value = orderId },
            new SqlParameter("@NewStatus", SqlDbType.NVarChar, 50) { Value = newStatus }
        };

        var resultCodeParam = CreateOutputParam("@ResultCode", SqlDbType.Int);
        var resultMessageParam = CreateOutputParam("@ResultMessage", SqlDbType.NVarChar, 500);

        var (data, resultCode, resultMessage) = await ExecuteSpWithResultAsync<Order>(
            "dbo.sp_Order_UpdateStatus", inputParams, resultCodeParam, resultMessageParam);

        return (data.FirstOrDefault(), resultCode, resultMessage);
    }

    #endregion
}

/*
 * Database-First Architecture - Order DbContext
 * 
 * ARCHITECTURAL RULES ENFORCED:
 * - ALL data access through stored procedures only
 * - DbSet properties kept for EF Core SP result mapping only
 * - NO LINQ queries against DbSets allowed
 * - NO Add/Update/Remove/SaveChanges (except via SP wrappers)
 */
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using OrderService.Models;
using System.Data;
using UnifiedService.Data;

namespace OrderService.Data;

/// <summary>
/// Order database context - stored procedure execution only.
/// Connects to OrderServiceDB.
/// </summary>
public class OrderDbContext : StoredProcedureDbContext
{
    public OrderDbContext(DbContextOptions<OrderDbContext> options) : base(options)
    {
    }

    // DbSets kept for SP result mapping only - DO NOT use for LINQ queries
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
            entity.Property(e => e.OrderTotal).HasPrecision(18, 2);
        });
    }

    #region Order Stored Procedure Methods

    /// <summary>
    /// sp_Order_Create: Create new order.
    /// </summary>
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

    /// <summary>
    /// sp_Order_GetAll: Get all orders.
    /// </summary>
    public async Task<List<Order>> SpOrderGetAllAsync()
    {
        return await ExecuteSpAsync<Order>("dbo.sp_Order_GetAll");
    }

    /// <summary>
    /// sp_Order_GetByCustomerId: Get orders for a customer.
    /// </summary>
    public async Task<List<Order>> SpOrderGetByCustomerIdAsync(int customerId)
    {
        var parameters = new[]
        {
            new SqlParameter("@CustomerId", SqlDbType.Int) { Value = customerId }
        };
        return await ExecuteSpAsync<Order>("dbo.sp_Order_GetByCustomerId", parameters);
    }

    /// <summary>
    /// sp_Order_GetById: Get order by ID.
    /// </summary>
    public async Task<Order?> SpOrderGetByIdAsync(int orderId)
    {
        var parameters = new[]
        {
            new SqlParameter("@OrderId", SqlDbType.Int) { Value = orderId }
        };
        return await ExecuteSpSingleAsync<Order>("dbo.sp_Order_GetById", parameters);
    }

    /// <summary>
    /// sp_Order_GetPending: Get pending orders.
    /// </summary>
    public async Task<List<Order>> SpOrderGetPendingAsync()
    {
        return await ExecuteSpAsync<Order>("dbo.sp_Order_GetPending");
    }

    /// <summary>
    /// sp_Order_UpdateStatus: Update order status.
    /// </summary>
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

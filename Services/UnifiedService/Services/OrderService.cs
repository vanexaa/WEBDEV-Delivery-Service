/*
 * Database-First Architecture - Order Service Implementation
 * 
 * ARCHITECTURAL RULES ENFORCED:
 * - ALL data access through stored procedures only
 * - NO LINQ queries
 * - NO Add/Update/Remove/SaveChanges
 * - Business rules come from SP return codes
 * - Service layer only executes SPs and interprets results
 */

using Microsoft.Extensions.Logging;
using OrderService.Data;
using OrderService.Models;
using OrderService.Models.DTOs;
using DeliveryService.Services;
using DeliveryService.Data;
using DeliveryService.Models.DTOs;
using RiderService.Data;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace OrderService.Services;

/// <summary>
/// Order service - executes stored procedures for order operations.
/// All business rules (validation, status transitions) come from the database.
/// </summary>
public class OrderService : IOrderService
{
    private static readonly HttpClient LogClient = new HttpClient();
    private const string LogEndpoint = "http://127.0.0.1:7243/ingest/6277f6d4-cb92-42c5-ab86-65314cd70192";
    private readonly OrderDbContext _context;
    private readonly DeliveryDbContext _deliveryContext;
    private readonly ILogger<OrderService> _logger;
    private readonly IDeliveryService _deliveryService;
    private readonly RiderDbContext _riderContext;

    public OrderService(
        OrderDbContext context, 
        DeliveryDbContext deliveryContext, 
        IDeliveryService deliveryService, 
        RiderDbContext riderContext, 
        ILogger<OrderService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _deliveryContext = deliveryContext ?? throw new ArgumentNullException(nameof(deliveryContext));
        _deliveryService = deliveryService ?? throw new ArgumentNullException(nameof(deliveryService));
        _riderContext = riderContext ?? throw new ArgumentNullException(nameof(riderContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Create order via sp_Order_Create stored procedure.
    /// Business rules enforced by database:
    /// - OrderTotal must be > 0
    /// - Required fields validated
    /// - Initial Status = 'Pending'
    /// </summary>
    public async Task<Order> CreateOrderAsync(CreateOrderRequest request)
    {
        #region agent log
        WriteDebugLog(
            "H2",
            "OrderService.cs:CreateOrderAsync:entry",
            "Create order request received",
            new
            {
                customerId = request.CustomerId,
                hasName = !string.IsNullOrWhiteSpace(request.CustomerName),
                hasAddress = !string.IsNullOrWhiteSpace(request.DeliveryAddress),
                orderTotal = request.OrderTotal,
                paymentMethod = request.PaymentMethod
            });
        #endregion
        var (order, resultCode, resultMessage) = await _context.SpOrderCreateAsync(
            request.CustomerId,
            request.CustomerName,
            request.CustomerPhone,
            request.DeliveryAddress,
            request.SpecialInstructions,
            request.OrderTotal,
            request.PaymentMethod
        );

        if (resultCode != 0 || order == null)
        {
            _logger.LogError("Failed to create order: {ResultMessage}", resultMessage);
            #region agent log
            WriteDebugLog(
                "H2",
                "OrderService.cs:CreateOrderAsync:failed",
                "Order creation failed",
                new { resultCode, resultMessage, customerId = request.CustomerId, orderTotal = request.OrderTotal });
            #endregion
            throw new InvalidOperationException(resultMessage);
        }

        _logger.LogInformation("✅ Order created: OrderId={OrderId}, CustomerId={CustomerId}, Status={Status}", 
            order.OrderId, order.CustomerId, order.Status);
        #region agent log
        WriteDebugLog(
            "H2",
            "OrderService.cs:CreateOrderAsync:created",
            "Order created via SP",
            new { orderId = order.OrderId, status = order.Status });
        #endregion
        _logger.LogInformation("📦 Order {OrderId} is now PENDING and will appear in Admin Dashboard 'Pending Assignments'", 
            order.OrderId);

        return order;
    }

    /// <summary>
    /// Get all orders via sp_Order_GetAll stored procedure.
    /// </summary>
    public async Task<List<Order>> GetAllOrdersAsync()
    {
        return await _context.SpOrderGetAllAsync();
    }

    /// <summary>
    /// Get orders by customer ID via sp_Order_GetByCustomerId stored procedure.
    /// </summary>
    public async Task<List<Order>> GetOrdersByCustomerIdAsync(int customerId)
    {
        return await _context.SpOrderGetByCustomerIdAsync(customerId);
    }

    /// <summary>
    /// Get order by ID via sp_Order_GetById stored procedure.
    /// </summary>
    public async Task<Order?> GetOrderByIdAsync(int orderId)
    {
        return await _context.SpOrderGetByIdAsync(orderId);
    }

    /// <summary>
    /// Get pending orders via sp_Order_GetPending stored procedure.
    /// Business rule from database: Orders with Status = 'Pending'
    /// </summary>
    public async Task<List<PendingAssignmentDto>> GetPendingAssignmentsAsync()
    {
        try
        {
            _logger.LogInformation("[GetPendingAssignments] Executing sp_Order_GetPending...");

            // Execute stored procedure - database returns pending orders
            var pendingOrders = await _context.SpOrderGetPendingAsync();

            _logger.LogInformation("[GetPendingAssignments] Found {Count} pending orders from database", 
                pendingOrders.Count);

            if (!pendingOrders.Any())
            {
                _logger.LogInformation("[GetPendingAssignments] No pending orders found. Returning empty list.");
                return new List<PendingAssignmentDto>();
            }

            // Map to DTOs - business logic already applied by database
            var result = pendingOrders.Select(order => new PendingAssignmentDto
            {
                OrderId = order.OrderId,
                CustomerId = order.CustomerId,
                CustomerName = order.CustomerName ?? "Unknown",
                CustomerPhone = order.CustomerPhone ?? "",
                DeliveryAddress = order.DeliveryAddress ?? "",
                SpecialInstructions = order.SpecialInstructions,
                OrderTotal = order.OrderTotal,
                PaymentMethod = order.PaymentMethod ?? "COD",
                OrderDate = order.OrderDate,
                Status = order.Status ?? "Pending",
                DeliveryId = null,
                DeliveryStatus = null,
                RiderId = null,
                RiderName = null,
                PendingReason = "Awaiting rider assignment"
            }).ToList();

            _logger.LogInformation("[GetPendingAssignments] Returning {Count} pending orders. OrderIds: {OrderIds}",
                result.Count,
                string.Join(", ", result.Select(r => r.OrderId)));

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[GetPendingAssignments] Error fetching pending assignments");
            throw;
        }
    }

    /// <summary>
    /// Update order status via sp_Order_UpdateStatus stored procedure.
    /// Business rules enforced by database:
    /// - Valid status transitions only
    /// </summary>
    public async Task<Order?> UpdateOrderStatusAsync(int orderId, string newStatus)
    {
        var (order, resultCode, resultMessage) = await _context.SpOrderUpdateStatusAsync(orderId, newStatus);

        if (resultCode != 0)
        {
            _logger.LogWarning("Failed to update order status: {ResultMessage}", resultMessage);
            return null;
        }

        _logger.LogInformation("Order {OrderId} status updated to {Status}", orderId, newStatus);
        return order;
    }

    private static void WriteDebugLog(string hypothesisId, string location, string message, object data)
    {
        try
        {
            var payload = new
            {
                sessionId = "debug-session",
                runId = "run1",
                hypothesisId,
                location,
                message,
                data,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };
            var logPath = @"c:\Users\Ideapad\OneDrive\Desktop\WEBDEV\.cursor\debug.log";
            var logDir = Path.GetDirectoryName(logPath);

            if (!string.IsNullOrWhiteSpace(logDir) && !File.Exists(logDir))
            {
                Directory.CreateDirectory(logDir);
                File.AppendAllText(logPath, JsonSerializer.Serialize(payload) + Environment.NewLine);
                return;
            }

            if (!string.IsNullOrWhiteSpace(logDir) && Directory.Exists(logDir))
            {
                File.AppendAllText(logPath, JsonSerializer.Serialize(payload) + Environment.NewLine);
                return;
            }

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            _ = LogClient.PostAsync(LogEndpoint, content);
        }
        catch
        {
            // Swallow logging errors to avoid breaking order flow.
        }
    }
}

/*
 * Database-First Architecture - Delivery Service Implementation
 * 
 * ARCHITECTURAL RULES ENFORCED:
 * - ALL data access through stored procedures only
 * - NO LINQ queries
 * - NO Add/Update/Remove/SaveChanges
 * - Business rules come from SP return codes
 * - Service layer only executes SPs and interprets results
 */

using DeliveryService.Data;
using DeliveryService.Models;
using DeliveryService.Models.DTOs;
using OrderService.Data;
using RiderService.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace DeliveryService.Services;

/// <summary>
/// Delivery service - executes stored procedures for delivery operations.
/// All business rules (status transitions, assignments) come from the database.
/// </summary>
public class DeliveryService : IDeliveryService
{
    private static readonly HttpClient LogClient = new HttpClient();
    private const string LogEndpoint = "http://127.0.0.1:7243/ingest/6277f6d4-cb92-42c5-ab86-65314cd70192";
    private readonly DeliveryDbContext _context;
    private readonly OrderDbContext _orderContext;
    private readonly RiderDbContext _riderContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DeliveryService> _logger;

    public DeliveryService(
        DeliveryDbContext context, 
        OrderDbContext orderContext,
        RiderDbContext riderContext,
        IConfiguration configuration, 
        ILogger<DeliveryService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _orderContext = orderContext ?? throw new ArgumentNullException(nameof(orderContext));
        _riderContext = riderContext ?? throw new ArgumentNullException(nameof(riderContext));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Assign delivery via sp_Delivery_Create and sp_Delivery_AssignRider stored procedures.
    /// Business rules enforced by database.
    /// </summary>
    public async Task<Delivery?> AssignDeliveryAsync(AssignDeliveryRequest request)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (request.OrderId <= 0)
        {
            _logger.LogWarning("Invalid order ID in assignment request: OrderId={OrderId}", request.OrderId);
            return null;
        }

        try
        {
            #region agent log
            WriteDebugLog(
                "H1",
                "DeliveryService.cs:AssignDeliveryAsync:entry",
                "Assign delivery called",
                new { orderId = request.OrderId, riderId = request.RiderId });
            #endregion
            // Verify order exists via stored procedure
            var order = await _orderContext.SpOrderGetByIdAsync(request.OrderId);
            if (order == null)
            {
                _logger.LogWarning("Order not found for assignment: OrderId={OrderId}", request.OrderId);
                return null;
            }

            // Check if rider is online (if RiderId provided)
            if (request.RiderId.HasValue)
            {
                var riderAvailability = await _riderContext.SpRiderGetAvailabilityAsync(request.RiderId.Value);
                if (riderAvailability != null && !riderAvailability.IsOnline)
                {
                    _logger.LogWarning("Cannot assign to offline rider: RiderId={RiderId}", request.RiderId.Value);
                    throw new InvalidOperationException($"Rider {request.RiderId.Value} is not online.");
                }
            }

            // Create or get delivery via stored procedure
            var (delivery, resultCode, resultMessage) = await _context.SpDeliveryCreateAsync(
                request.OrderId, request.RiderId);

            if (delivery == null)
            {
                _logger.LogError("Failed to create delivery: {ResultMessage}", resultMessage);
                return null;
            }
            #region agent log
            WriteDebugLog(
                "H3",
                "DeliveryService.cs:AssignDeliveryAsync:after-create",
                "Delivery create result",
                new { resultCode, deliveryId = delivery.DeliveryId, status = delivery.Status, riderId = delivery.RiderId });
            #endregion

            // If delivery already exists but needs rider assignment
            if (resultCode == -1 && delivery.RiderId == null && request.RiderId.HasValue)
            {
                var (assignedDelivery, assignCode, assignMessage) = await _context.SpDeliveryAssignRiderAsync(
                    delivery.DeliveryId, request.RiderId.Value);
                
                if (assignCode != 0)
                {
                    _logger.LogWarning("Failed to assign rider: {ResultMessage}", assignMessage);
                    return delivery;
                }
                
                delivery = assignedDelivery;
            }

            // Update order status via stored procedure
            if (order.Status == "Pending" && delivery?.RiderId.HasValue == true)
            {
                await _orderContext.SpOrderUpdateStatusAsync(request.OrderId, "Assigned");
            }

            _logger.LogInformation("Delivery assigned: DeliveryId={DeliveryId}, OrderId={OrderId}, RiderId={RiderId}",
                delivery?.DeliveryId, delivery?.OrderId, delivery?.RiderId);

            return delivery;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning delivery for OrderId={OrderId}", request.OrderId);
            throw;
        }
    }

    /// <summary>
    /// Get delivery by order ID via sp_Delivery_GetByOrderId stored procedure.
    /// </summary>
    public async Task<Delivery?> GetDeliveryByOrderIdAsync(int orderId)
    {
        return await _context.SpDeliveryGetByOrderIdAsync(orderId);
    }

    /// <summary>
    /// Get delivery by ID via sp_Delivery_GetById stored procedure.
    /// </summary>
    public async Task<Delivery?> GetDeliveryByIdAsync(int deliveryId)
    {
        return await _context.SpDeliveryGetByIdAsync(deliveryId);
    }

    /// <summary>
    /// Get active deliveries via sp_Delivery_GetAll stored procedure (filtered in memory).
    /// TODO: Create dedicated sp_Delivery_GetActive stored procedure.
    /// </summary>
    public async Task<List<Delivery>> GetActiveDeliveriesAsync()
    {
        try
        {
            #region agent log
            WriteDebugLog(
                "H5",
                "DeliveryService.cs:GetActiveDeliveriesAsync:in-memory-filter",
                "Filtering active deliveries in service layer",
                new { usesStoredProcedure = true, filtersInMemory = true });
            #endregion
            var allDeliveries = await _context.SpDeliveryGetAllAsync();
            var activeStatuses = new[] { "Assigned", "Accepted", "PickedUp", "InTransit" };
            return allDeliveries.Where(d => activeStatuses.Contains(d.Status)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active deliveries");
            throw;
        }
    }

    /// <summary>
    /// Get active deliveries with order info.
    /// Combines sp_Delivery_GetAll and sp_Order_GetById results.
    /// </summary>
    public async Task<List<DeliveryWithOrderDto>> GetActiveDeliveriesWithOrdersAsync()
    {
        try
        {
            var activeDeliveries = await GetActiveDeliveriesAsync();

            if (!activeDeliveries.Any())
            {
                return new List<DeliveryWithOrderDto>();
            }

            var result = new List<DeliveryWithOrderDto>();
            foreach (var delivery in activeDeliveries)
            {
                var order = await _orderContext.SpOrderGetByIdAsync(delivery.OrderId);
                result.Add(new DeliveryWithOrderDto
                {
                    DeliveryId = delivery.DeliveryId,
                    OrderId = delivery.OrderId,
                    RiderId = delivery.RiderId,
                    Status = delivery.Status ?? string.Empty,
                    AssignedAt = delivery.AssignedAt,
                    AcceptedAt = delivery.AcceptedAt,
                    PickedUpAt = delivery.PickedUpAt,
                    DeliveredAt = delivery.DeliveredAt,
                    CreatedAt = delivery.CreatedAt,
                    Order = order != null ? new OrderInfoDto
                    {
                        OrderId = order.OrderId,
                        CustomerName = order.CustomerName ?? string.Empty,
                        CustomerPhone = order.CustomerPhone ?? string.Empty,
                        DeliveryAddress = order.DeliveryAddress ?? string.Empty,
                        OrderTotal = order.OrderTotal,
                        PaymentMethod = order.PaymentMethod ?? string.Empty,
                        OrderDate = order.OrderDate,
                        SpecialInstructions = order.SpecialInstructions
                    } : null
                });
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active deliveries with orders");
            throw;
        }
    }

    /// <summary>
    /// Update delivery status via sp_Delivery_UpdateStatus stored procedure.
    /// Business rules (valid transitions) enforced by database.
    /// </summary>
    public async Task<Delivery?> UpdateDeliveryStatusAsync(int deliveryId, UpdateDeliveryStatusRequest request, int userId)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.Status))
        {
            _logger.LogWarning("Status is required for delivery update: DeliveryId={DeliveryId}", deliveryId);
            return null;
        }

        try
        {
            var (delivery, resultCode, resultMessage) = await _context.SpDeliveryUpdateStatusAsync(
                deliveryId, request.Status, null);

            if (resultCode != 0)
            {
                _logger.LogWarning("Failed to update delivery status: {ResultMessage}", resultMessage);
                return null;
            }

            // Add tracking entry
            await _context.SpDeliveryAddTrackingAsync(
                deliveryId, request.Status, request.Latitude, request.Longitude, request.Notes);

            // Sync order status
            if (delivery != null)
            {
                var orderStatus = request.Status switch
                {
                    "Accepted" => "Accepted",
                    "PickedUp" => "PickedUp",
                    "InTransit" => "InTransit",
                    "Delivered" => "Delivered",
                    "Failed" => "Cancelled",
                    _ => null
                };

                if (orderStatus != null)
                {
                    await _orderContext.SpOrderUpdateStatusAsync(delivery.OrderId, orderStatus);
                }
            }

            _logger.LogInformation("Delivery status updated: DeliveryId={DeliveryId}, NewStatus={Status}",
                deliveryId, request.Status);

            return delivery;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating delivery status: DeliveryId={DeliveryId}", deliveryId);
            throw;
        }
    }

    /// <summary>
    /// Mark delivery as failed via sp_Delivery_UpdateStatus stored procedure.
    /// </summary>
    public async Task<Delivery?> MarkDeliveryAsFailedAsync(int deliveryId, string failureReason, int userId)
    {
        var (delivery, resultCode, resultMessage) = await _context.SpDeliveryUpdateStatusAsync(
            deliveryId, "Failed", failureReason);

        if (resultCode != 0)
        {
            _logger.LogWarning("Failed to mark delivery as failed: {ResultMessage}", resultMessage);
            return null;
        }

        // Sync order status to Cancelled
        if (delivery != null)
        {
            await _orderContext.SpOrderUpdateStatusAsync(delivery.OrderId, "Cancelled");
        }

        return delivery;
    }

    /// <summary>
    /// Reassign delivery via sp_Delivery_AssignRider stored procedure.
    /// First resets delivery, then assigns new rider.
    /// </summary>
    public async Task<Delivery?> ReassignDeliveryAsync(int deliveryId, int newRiderId)
    {
        // Note: Current SP doesn't support reassignment directly
        // Would need to update status first, then reassign
        // For now, use the assign method
        var delivery = await _context.SpDeliveryGetByIdAsync(deliveryId);
        if (delivery == null)
        {
            return null;
        }

        // Check if new rider is online
        var riderAvailability = await _riderContext.SpRiderGetAvailabilityAsync(newRiderId);
        if (riderAvailability != null && !riderAvailability.IsOnline)
        {
            throw new InvalidOperationException($"Rider {newRiderId} is not online.");
        }

        var (updatedDelivery, resultCode, resultMessage) = await _context.SpDeliveryAssignRiderAsync(
            deliveryId, newRiderId);

        if (resultCode != 0)
        {
            _logger.LogWarning("Failed to reassign delivery: {ResultMessage}", resultMessage);
            // Try to update status to allow reassignment
            await _context.SpDeliveryUpdateStatusAsync(deliveryId, "Pending", null);
            // Retry assignment
            (updatedDelivery, resultCode, resultMessage) = await _context.SpDeliveryAssignRiderAsync(
                deliveryId, newRiderId);
        }

        return updatedDelivery;
    }

    /// <summary>
    /// Get delivery tracking info.
    /// </summary>
    public async Task<DeliveryTrackingDto?> GetDeliveryTrackingAsync(int orderId)
    {
        var delivery = await _context.SpDeliveryGetByOrderIdAsync(orderId);

        if (delivery == null)
        {
            return null;
        }

        return new DeliveryTrackingDto
        {
            DeliveryId = delivery.DeliveryId,
            OrderId = delivery.OrderId,
            RiderId = delivery.RiderId,
            Status = delivery.Status,
            EstimatedTime = null,
            StatusHistory = new List<StatusHistoryItem>()
        };
    }

    /// <summary>
    /// Get available deliveries for rider via sp_Delivery_GetActiveByRiderId stored procedure.
    /// </summary>
    public async Task<List<Delivery>> GetAvailableDeliveriesAsync(int? riderId = null)
    {
        try
        {
            if (riderId.HasValue)
            {
                return await _context.SpDeliveryGetActiveByRiderIdAsync(riderId.Value);
            }
            else
            {
                return await GetActiveDeliveriesAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving available deliveries");
            throw;
        }
    }

    /// <summary>
    /// Accept delivery via sp_Delivery_UpdateStatus stored procedure.
    /// Business rule: Only assigned delivery can be accepted by the assigned rider.
    /// </summary>
    public async Task<Delivery?> AcceptDeliveryAsync(int deliveryId, int riderId)
    {
        try
        {
            _logger.LogInformation("AcceptDeliveryAsync: DeliveryId={DeliveryId}, RiderId={RiderId}", 
                deliveryId, riderId);

            var delivery = await _context.SpDeliveryGetByIdAsync(deliveryId);
            if (delivery == null)
            {
                _logger.LogWarning("Delivery not found: DeliveryId={DeliveryId}", deliveryId);
                return null;
            }

            // Business rule verification (from service, could also be in SP)
            if (delivery.RiderId != riderId)
            {
                _logger.LogWarning("Delivery {DeliveryId} not assigned to rider {RiderId}", deliveryId, riderId);
                return null;
            }

            if (delivery.Status != "Assigned")
            {
                _logger.LogWarning("Delivery {DeliveryId} cannot be accepted. Status: {Status}", 
                    deliveryId, delivery.Status);
                return null;
            }

            var (updatedDelivery, resultCode, resultMessage) = await _context.SpDeliveryUpdateStatusAsync(
                deliveryId, "Accepted", null);

            if (resultCode != 0)
            {
                _logger.LogWarning("Failed to accept delivery: {ResultMessage}", resultMessage);
                return null;
            }

            // Sync order status
            await _orderContext.SpOrderUpdateStatusAsync(delivery.OrderId, "Accepted");

            _logger.LogInformation("Delivery {DeliveryId} accepted by rider {RiderId}", deliveryId, riderId);
            return updatedDelivery;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error accepting delivery: DeliveryId={DeliveryId}", deliveryId);
            throw;
        }
    }

    /// <summary>
    /// Reject delivery - clears assignment and makes order available for reassignment.
    /// </summary>
    public async Task<Delivery?> RejectDeliveryAsync(int deliveryId, int riderId)
    {
        try
        {
            _logger.LogInformation("RejectDeliveryAsync: DeliveryId={DeliveryId}, RiderId={RiderId}", 
                deliveryId, riderId);

            var delivery = await _context.SpDeliveryGetByIdAsync(deliveryId);
            if (delivery == null)
            {
                _logger.LogWarning("Delivery not found: DeliveryId={DeliveryId}", deliveryId);
                return null;
            }

            if (delivery.RiderId != riderId)
            {
                _logger.LogWarning("Delivery {DeliveryId} not assigned to rider {RiderId}", deliveryId, riderId);
                return null;
            }

            if (delivery.Status != "Assigned")
            {
                _logger.LogWarning("Delivery {DeliveryId} cannot be rejected. Status: {Status}", 
                    deliveryId, delivery.Status);
                return null;
            }

            // Reset to Pending for reassignment via SP
            var (updatedDelivery, resultCode, resultMessage) = await _context.SpDeliveryUpdateStatusAsync(
                deliveryId, "Pending", $"Rejected by rider {riderId}");

            // Sync order status back to Pending
            await _orderContext.SpOrderUpdateStatusAsync(delivery.OrderId, "Pending");

            // Try auto-reassign to another online rider
            try
            {
                var onlineRiders = await _riderContext.SpRiderGetOnlineAsync();
                var availableRider = onlineRiders.FirstOrDefault(r => r.RiderId != riderId);
                
                if (availableRider != null)
                {
                    _logger.LogInformation("Auto-reassigning to RiderId={RiderId}", availableRider.RiderId);
                    return await AssignDeliveryAsync(new AssignDeliveryRequest
                    {
                        OrderId = delivery.OrderId,
                        RiderId = availableRider.RiderId
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during auto-reassignment");
            }

            _logger.LogInformation("Delivery {DeliveryId} rejected by rider {RiderId}", deliveryId, riderId);
            return updatedDelivery;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting delivery: DeliveryId={DeliveryId}", deliveryId);
            throw;
        }
    }

    /// <summary>
    /// Get all delivery history via stored procedures.
    /// Uses sp_Delivery_GetAll and sp_Order_GetById.
    /// </summary>
    public async Task<List<DeliveryWithOrderDto>> GetAllDeliveryHistoryAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        try
        {
            _logger.LogInformation("GetAllDeliveryHistoryAsync called");

            // Get all deliveries via stored procedure
            var deliveries = await _context.SpDeliveryGetAllAsync();

            // Filter by date range if provided (in memory since SP may not support date filtering)
            if (startDate.HasValue)
            {
                deliveries = deliveries.Where(d => d.CreatedAt >= startDate.Value).ToList();
            }

            if (endDate.HasValue)
            {
                deliveries = deliveries.Where(d => d.CreatedAt <= endDate.Value).ToList();
            }

            // Sort by CreatedAt descending
            deliveries = deliveries.OrderByDescending(d => d.CreatedAt).ToList();

            _logger.LogInformation("Found {Count} deliveries in history query", deliveries.Count);

            if (!deliveries.Any())
            {
                _logger.LogInformation("No delivery history found");
                return new List<DeliveryWithOrderDto>();
            }

            // Map deliveries to DeliveryWithOrderDto with order information
            var deliveryHistory = new List<DeliveryWithOrderDto>();
            foreach (var delivery in deliveries)
            {
                // Fetch order details via stored procedure
                var order = await _orderContext.SpOrderGetByIdAsync(delivery.OrderId);
                if (order != null)
                {
                    deliveryHistory.Add(new DeliveryWithOrderDto
                    {
                        DeliveryId = delivery.DeliveryId,
                        OrderId = delivery.OrderId,
                        RiderId = delivery.RiderId,
                        Status = delivery.Status ?? string.Empty,
                        AssignedAt = delivery.AssignedAt,
                        AcceptedAt = delivery.AcceptedAt,
                        PickedUpAt = delivery.PickedUpAt,
                        DeliveredAt = delivery.DeliveredAt,
                        CreatedAt = delivery.CreatedAt,
                        Order = new OrderInfoDto
                        {
                            OrderId = order.OrderId,
                            CustomerName = order.CustomerName ?? string.Empty,
                            CustomerPhone = order.CustomerPhone ?? string.Empty,
                            DeliveryAddress = order.DeliveryAddress ?? string.Empty,
                            OrderTotal = order.OrderTotal,
                            PaymentMethod = order.PaymentMethod ?? string.Empty,
                            OrderDate = order.OrderDate,
                            SpecialInstructions = order.SpecialInstructions
                        }
                    });
                    
                    _logger.LogDebug("Mapped history delivery: DeliveryId={DeliveryId}, OrderId={OrderId}, Status={Status}",
                        delivery.DeliveryId, delivery.OrderId, delivery.Status);
                }
                else
                {
                    _logger.LogWarning("Order not found in OrderServiceDB for DeliveryId={DeliveryId}, OrderId={OrderId}",
                        delivery.DeliveryId, delivery.OrderId);
                }
            }

            _logger.LogInformation("Retrieved {Count} delivery history records", deliveryHistory.Count);
            return deliveryHistory;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all delivery history");
            return new List<DeliveryWithOrderDto>();
        }
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
            // Swallow logging errors to avoid breaking delivery flow.
        }
    }
}

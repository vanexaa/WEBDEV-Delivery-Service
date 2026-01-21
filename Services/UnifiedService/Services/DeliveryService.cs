/*
 * UnifiedService Architecture - Delivery Service Implementation
 * 
 * Part of UnifiedService on port 5000.
 * Handles delivery assignment, tracking, and status management.
 */
using DeliveryService.Data;
using DeliveryService.Models;
using DeliveryService.Models.DTOs;
using OrderService.Data;
using OrderService.Models;
using RiderService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace DeliveryService.Services;

/// <summary>
/// Service for managing delivery operations including assignment, status updates, and tracking.
/// </summary>
public class DeliveryService : IDeliveryService
{
    private readonly DeliveryDbContext _context;
    private readonly OrderDbContext _orderContext;
    private readonly RiderDbContext _riderContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DeliveryService> _logger;

    private static readonly string[] ActiveStatuses = { "Assigned", "Accepted", "PickedUp", "InTransit" };
    private static readonly string[] ValidStatuses = { "Accepted", "PickedUp", "InTransit", "Delivered", "Failed" };

    // Constructor with RiderDbContext for accept/reject/reassignment functionality
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
            // Orders are stored in OrderServiceDB, not DeliveryServiceDB
            // Check if order exists in OrderServiceDB
            var order = await _orderContext.Orders.FindAsync(request.OrderId);
            if (order == null)
            {
                _logger.LogWarning("Order not found in OrderServiceDB for assignment: OrderId={OrderId}", request.OrderId);
                return null;
            }

            // Validate that rider is online before assignment (if RiderId is provided)
            if (request.RiderId.HasValue && _riderContext != null)
            {
                try
                {
                    var riderAvailability = await _riderContext.RiderAvailability
                        .FirstOrDefaultAsync(ra => ra.RiderId == request.RiderId.Value);

                    if (riderAvailability == null)
                    {
                        // If availability record doesn't exist, log warning but allow assignment
                        // (rider may not have set online status yet, but admin can still assign)
                        _logger.LogWarning("Rider availability record not found for RiderId={RiderId} when assigning OrderId={OrderId}. Assignment will proceed, but rider should set online status.",
                            request.RiderId.Value, request.OrderId);
                        // Don't throw - allow assignment to proceed
                    }
                    else if (!riderAvailability.IsOnline)
                    {
                        // Rider exists but is offline - prevent assignment
                        _logger.LogWarning("Cannot assign OrderId={OrderId} to RiderId={RiderId}: Rider is not online",
                            request.OrderId, request.RiderId.Value);
                        throw new InvalidOperationException($"Rider {request.RiderId.Value} is not online. Only online riders can be assigned orders. Please ask the rider to go online first.");
                    }
                    else
                    {
                        _logger.LogInformation("Rider availability verified: RiderId={RiderId} is online for OrderId={OrderId}",
                            request.RiderId.Value, request.OrderId);
                    }
                }
                catch (InvalidOperationException)
                {
                    // Re-throw validation exceptions (rider offline)
                    throw;
                }
                catch (Exception ex)
                {
                    // If there's an error checking availability, log but don't block assignment
                    // (could be a database issue, but assignment should still work)
                    _logger.LogError(ex, "Error checking rider availability for RiderId={RiderId}: {Error}. Assignment will proceed.",
                        request.RiderId.Value, ex.Message);
                    // Don't throw - allow assignment to proceed despite availability check error
                }
            }

            // Check if delivery already exists
            var existingDelivery = await _context.Deliveries
                .FirstOrDefaultAsync(d => d.OrderId == request.OrderId);

            if (existingDelivery != null)
            {
                _logger.LogInformation("Delivery already exists for OrderId={OrderId}, DeliveryId={DeliveryId}, CurrentRiderId={CurrentRiderId}, Status={Status}",
                    request.OrderId, existingDelivery.DeliveryId, existingDelivery.RiderId, existingDelivery.Status);
                
                // If delivery already has an assigned rider with active status, don't overwrite
                if (existingDelivery.RiderId.HasValue && 
                    (existingDelivery.Status == "Assigned" || existingDelivery.Status == "Accepted" || 
                     existingDelivery.Status == "PickedUp" || existingDelivery.Status == "InTransit"))
                {
                    _logger.LogInformation("Delivery for OrderId={OrderId} already assigned to RiderId={RiderId} with active status {Status}. Skipping assignment.",
                        request.OrderId, existingDelivery.RiderId, existingDelivery.Status);
                    return existingDelivery;
                }
                
                // Update existing delivery with new rider assignment (for pending/unassigned deliveries)
                if (request.RiderId.HasValue)
                {
                    var previousRiderId = existingDelivery.RiderId;
                    existingDelivery.RiderId = request.RiderId.Value;
                    existingDelivery.Status = "Assigned";
                    existingDelivery.AssignedAt = DateTime.UtcNow;
                    existingDelivery.UpdatedAt = DateTime.UtcNow;
                    
                    // Add status history for reassignment
                    _context.DeliveryStatusHistory.Add(new DeliveryStatusHistory
                    {
                        DeliveryId = existingDelivery.DeliveryId,
                        Status = "Assigned",
                        Notes = previousRiderId.HasValue && previousRiderId.Value != request.RiderId.Value
                            ? $"Reassigned from rider {previousRiderId.Value} to rider {request.RiderId.Value}" 
                            : "Rider assigned to pending delivery",
                        CreatedAt = DateTime.UtcNow
                    });
                    
                    await _context.SaveChangesAsync();
                    
                    // Update Order status in OrderServiceDB to reflect assignment
                    if (order != null && order.Status == "Pending")
                    {
                        order.Status = "Assigned";
                        order.UpdatedAt = DateTime.UtcNow;
                        await _orderContext.SaveChangesAsync();
                        _logger.LogInformation("Order status updated to 'Assigned': OrderId={OrderId}, UpdatedAt={UpdatedAt}", 
                            order.OrderId, order.UpdatedAt);
                    }
                    
                    _logger.LogInformation("Existing delivery updated with RiderId: DeliveryId={DeliveryId}, OrderId={OrderId}, RiderId={RiderId}",
                        existingDelivery.DeliveryId, existingDelivery.OrderId, existingDelivery.RiderId);
                }
                
                return existingDelivery;
            }

            var restaurantLocation = _configuration.GetSection("RestaurantLocation");
            var restaurantLatStr = restaurantLocation["Latitude"] ?? "0";
            var restaurantLngStr = restaurantLocation["Longitude"] ?? "0";

            if (!decimal.TryParse(restaurantLatStr, out decimal restaurantLat))
            {
                restaurantLat = 0;
                _logger.LogWarning("Invalid restaurant latitude in configuration, using default: 0");
            }

            if (!decimal.TryParse(restaurantLngStr, out decimal restaurantLng))
            {
                restaurantLng = 0;
                _logger.LogWarning("Invalid restaurant longitude in configuration, using default: 0");
            }

            var delivery = new Delivery
            {
                OrderId = request.OrderId,
                RiderId = request.RiderId,
                Status = "Assigned",
                RestaurantLatitude = restaurantLat,
                RestaurantLongitude = restaurantLng,
                AssignedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Deliveries.Add(delivery);
            await _context.SaveChangesAsync();

            // Add status history
            _context.DeliveryStatusHistory.Add(new DeliveryStatusHistory
            {
                DeliveryId = delivery.DeliveryId,
                Status = "Assigned",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            _logger.LogInformation("Delivery assigned successfully: DeliveryId={DeliveryId}, OrderId={OrderId}, RiderId={RiderId}",
                delivery.DeliveryId, delivery.OrderId, delivery.RiderId);

            // Update Order status in OrderServiceDB to reflect assignment
            if (order != null && order.Status == "Pending")
            {
                order.Status = "Assigned";
                order.UpdatedAt = DateTime.UtcNow;
                await _orderContext.SaveChangesAsync();
                _logger.LogInformation("Order status updated to 'Assigned': OrderId={OrderId}, UpdatedAt={UpdatedAt}", 
                    order.OrderId, order.UpdatedAt);
            }

            // Verify the assignment was saved correctly
            var savedDelivery = await _context.Deliveries.FindAsync(delivery.DeliveryId);
            if (savedDelivery != null && savedDelivery.RiderId == request.RiderId)
            {
                _logger.LogInformation("Assignment verified: DeliveryId={DeliveryId}, RiderId={RiderId} is correctly saved",
                    savedDelivery.DeliveryId, savedDelivery.RiderId);
            }
            else
            {
                _logger.LogWarning("Assignment verification failed: Expected RiderId={ExpectedRiderId}, Actual RiderId={ActualRiderId}",
                    request.RiderId, savedDelivery?.RiderId);
            }

            return delivery;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning delivery for OrderId={OrderId}", request.OrderId);
            throw;
        }
    }

    public async Task<Delivery?> GetDeliveryByOrderIdAsync(int orderId)
    {
        // Orders are in OrderServiceDB, so we don't use Include for Order navigation
        // Delivery just references OrderId (no foreign key across databases)
        return await _context.Deliveries
            .FirstOrDefaultAsync(d => d.OrderId == orderId);
    }

    public async Task<Delivery?> GetDeliveryByIdAsync(int deliveryId)
    {
        // Orders are in OrderServiceDB, so we don't use Include for Order navigation
        return await _context.Deliveries
            .FirstOrDefaultAsync(d => d.DeliveryId == deliveryId);
    }

    public async Task<List<Delivery>> GetActiveDeliveriesAsync()
    {
        try
        {
            // Orders are in OrderServiceDB, so we don't use Include for Order navigation
            return await _context.Deliveries
                .Where(d => ActiveStatuses.Contains(d.Status))
                .OrderByDescending(d => d.AssignedAt)
                .AsNoTracking()
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active deliveries");
            throw;
        }
    }

    public async Task<List<DeliveryWithOrderDto>> GetActiveDeliveriesWithOrdersAsync()
    {
        try
        {
            // Get active deliveries
            var deliveries = await _context.Deliveries
                .Where(d => ActiveStatuses.Contains(d.Status))
                .OrderByDescending(d => d.AssignedAt)
                .AsNoTracking()
                .ToListAsync();

            if (!deliveries.Any())
            {
                return new List<DeliveryWithOrderDto>();
            }

            // Get order IDs
            var orderIds = deliveries.Select(d => d.OrderId).ToList();

            // Fetch orders from OrderServiceDB
            var orders = await _orderContext.Orders
                .Where(o => orderIds.Contains(o.OrderId))
                .AsNoTracking()
                .ToListAsync();

            // Map to DTO with order information
            var result = new List<DeliveryWithOrderDto>();
            foreach (var delivery in deliveries)
            {
                var order = orders.FirstOrDefault(o => o.OrderId == delivery.OrderId);
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
    /// Get all delivery history with order information (for Admin history page)
    /// </summary>
    public async Task<List<DeliveryWithOrderDto>> GetAllDeliveryHistoryAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        try
        {
            // Get all deliveries (not just active ones)
            var deliveriesQuery = _context.Deliveries.AsQueryable();

            // Apply date filtering if provided
            if (startDate.HasValue || endDate.HasValue)
            {
                if (startDate.HasValue && endDate.HasValue)
                {
                    deliveriesQuery = deliveriesQuery.Where(d => 
                        (d.AssignedAt >= startDate.Value && d.AssignedAt <= endDate.Value) ||
                        (d.DeliveredAt.HasValue && d.DeliveredAt >= startDate.Value && d.DeliveredAt <= endDate.Value) ||
                        (d.FailedAt.HasValue && d.FailedAt >= startDate.Value && d.FailedAt <= endDate.Value));
                }
                else if (startDate.HasValue)
                {
                    deliveriesQuery = deliveriesQuery.Where(d => 
                        d.AssignedAt >= startDate.Value ||
                        (d.DeliveredAt.HasValue && d.DeliveredAt >= startDate.Value) ||
                        (d.FailedAt.HasValue && d.FailedAt >= startDate.Value));
                }
                else if (endDate.HasValue)
                {
                    deliveriesQuery = deliveriesQuery.Where(d => 
                        d.AssignedAt <= endDate.Value ||
                        (d.DeliveredAt.HasValue && d.DeliveredAt <= endDate.Value) ||
                        (d.FailedAt.HasValue && d.FailedAt <= endDate.Value));
                }
            }

            var deliveries = await deliveriesQuery
                .OrderByDescending(d => d.AssignedAt)
                .AsNoTracking()
                .ToListAsync();

            if (!deliveries.Any())
            {
                return new List<DeliveryWithOrderDto>();
            }

            // Get order IDs
            var orderIds = deliveries.Select(d => d.OrderId).ToList();

            // Fetch orders from OrderServiceDB
            var orders = await _orderContext.Orders
                .Where(o => orderIds.Contains(o.OrderId))
                .AsNoTracking()
                .ToListAsync();

            // Map to DTO with order information
            var result = new List<DeliveryWithOrderDto>();
            foreach (var delivery in deliveries)
            {
                var order = orders.FirstOrDefault(o => o.OrderId == delivery.OrderId);
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
                    TransactionCode = $"ORD-{delivery.OrderId}", // Generate transaction code
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

            _logger.LogInformation("Retrieved {Count} delivery history records", result.Count);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all delivery history");
            throw;
        }
    }

    public async Task<Delivery?> UpdateDeliveryStatusAsync(int deliveryId, UpdateDeliveryStatusRequest request, int userId)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (deliveryId <= 0)
        {
            _logger.LogWarning("Invalid delivery ID: DeliveryId={DeliveryId}", deliveryId);
            return null;
        }

        if (string.IsNullOrWhiteSpace(request.Status))
        {
            _logger.LogWarning("Status is required for delivery update: DeliveryId={DeliveryId}", deliveryId);
            return null;
        }

        if (!ValidStatuses.Contains(request.Status))
        {
            _logger.LogWarning("Invalid status provided: Status={Status}, DeliveryId={DeliveryId}", 
                request.Status, deliveryId);
            return null;
        }

        try
        {
            var delivery = await _context.Deliveries.FindAsync(deliveryId);
            if (delivery == null)
            {
                _logger.LogWarning("Delivery not found: DeliveryId={DeliveryId}", deliveryId);
                return null;
            }

            var previousStatus = delivery.Status;
            delivery.Status = request.Status;
            delivery.UpdatedAt = DateTime.UtcNow;

            // Update timestamps based on status
            switch (request.Status)
            {
                case "Accepted":
                    delivery.AcceptedAt = DateTime.UtcNow;
                    break;
                case "PickedUp":
                    delivery.PickedUpAt = DateTime.UtcNow;
                    break;
                case "InTransit":
                    if (request.Latitude.HasValue && request.Longitude.HasValue)
                    {
                        delivery.DeliveryLatitude = request.Latitude.Value;
                        delivery.DeliveryLongitude = request.Longitude.Value;
                    }
                    break;
                case "Delivered":
                    delivery.DeliveredAt = DateTime.UtcNow;
                    delivery.ActualDeliveryTime = DateTime.UtcNow;
                    break;
            }

            // Add status history
            _context.DeliveryStatusHistory.Add(new DeliveryStatusHistory
            {
                DeliveryId = deliveryId,
                Status = request.Status,
                ChangedBy = userId,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            // Sync Order status in OrderServiceDB (database is single source of truth)
            var order = await _orderContext.Orders.FindAsync(delivery.OrderId);
            if (order != null)
            {
                // Map delivery status to order status
                var orderStatus = request.Status switch
                {
                    "Accepted" => "Accepted",
                    "PickedUp" => "PickedUp",
                    "InTransit" => "InTransit",
                    "Delivered" => "Delivered",
                    "Failed" => "Cancelled",
                    _ => order.Status
                };
                
                if (order.Status != orderStatus)
                {
                    order.Status = orderStatus;
                    order.UpdatedAt = DateTime.UtcNow;
                    await _orderContext.SaveChangesAsync();
                    _logger.LogInformation("Order status synced: OrderId={OrderId}, NewStatus={Status}", 
                        order.OrderId, orderStatus);
                }
            }

            _logger.LogInformation("Delivery status updated: DeliveryId={DeliveryId}, PreviousStatus={PreviousStatus}, NewStatus={NewStatus}",
                deliveryId, previousStatus, request.Status);

            return delivery;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating delivery status: DeliveryId={DeliveryId}", deliveryId);
            throw;
        }
    }

    public async Task<Delivery?> MarkDeliveryAsFailedAsync(int deliveryId, string failureReason, int userId)
    {
        var delivery = await _context.Deliveries.FindAsync(deliveryId);
        if (delivery == null)
        {
            return null;
        }

        delivery.Status = "Failed";
        delivery.FailedAt = DateTime.UtcNow;
        delivery.FailureReason = failureReason;
        delivery.UpdatedAt = DateTime.UtcNow;

        _context.DeliveryStatusHistory.Add(new DeliveryStatusHistory
        {
            DeliveryId = deliveryId,
            Status = "Failed",
            ChangedBy = userId,
            Notes = failureReason,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        // Sync Order status to "Cancelled" (database is single source of truth)
        var order = await _orderContext.Orders.FindAsync(delivery.OrderId);
        if (order != null)
        {
            order.Status = "Cancelled";
            order.UpdatedAt = DateTime.UtcNow;
            await _orderContext.SaveChangesAsync();
            _logger.LogInformation("Order {OrderId} status synced to 'Cancelled' due to failed delivery", order.OrderId);
        }

        return delivery;
    }

    public async Task<Delivery?> ReassignDeliveryAsync(int deliveryId, int newRiderId)
    {
        var delivery = await _context.Deliveries.FindAsync(deliveryId);
        if (delivery == null)
        {
            return null;
        }

        delivery.RiderId = newRiderId;
        delivery.Status = "Assigned";
        delivery.UpdatedAt = DateTime.UtcNow;

        _context.DeliveryStatusHistory.Add(new DeliveryStatusHistory
        {
            DeliveryId = deliveryId,
            Status = "Assigned",
            Notes = $"Reassigned to rider {newRiderId}",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return delivery;
    }

    public async Task<DeliveryTrackingDto?> GetDeliveryTrackingAsync(int orderId)
    {
        // Orders are in OrderServiceDB, so we don't use Include for Order navigation
        var delivery = await _context.Deliveries
            .FirstOrDefaultAsync(d => d.OrderId == orderId);

        if (delivery == null)
        {
            return null;
        }

        var statusHistory = await _context.DeliveryStatusHistory
            .Where(h => h.DeliveryId == delivery.DeliveryId)
            .OrderBy(h => h.CreatedAt)
            .ToListAsync();

        return new DeliveryTrackingDto
        {
            DeliveryId = delivery.DeliveryId,
            OrderId = delivery.OrderId,
            RiderId = delivery.RiderId,
            Status = delivery.Status,
            EstimatedTime = delivery.EstimatedTime.HasValue ? $"{delivery.EstimatedTime} minutes" : null,
            StatusHistory = statusHistory.Select(h => new StatusHistoryItem
            {
                Status = h.Status,
                Timestamp = h.CreatedAt,
                Notes = h.Notes
            }).ToList()
        };
    }

    public async Task<List<Delivery>> GetAvailableDeliveriesAsync(int? riderId = null)
    {
        try
        {
            // If riderId is provided, return deliveries assigned to that rider
            // Otherwise, return unassigned deliveries (RiderId is null) or all active deliveries
            if (riderId.HasValue)
            {
                return await _context.Deliveries
                    .Where(d => d.RiderId == riderId.Value && ActiveStatuses.Contains(d.Status))
                    .OrderByDescending(d => d.AssignedAt)
                    .AsNoTracking()
                    .ToListAsync();
            }
            else
            {
                // Return unassigned deliveries or all active deliveries
                return await _context.Deliveries
                    .Where(d => (d.RiderId == null || ActiveStatuses.Contains(d.Status)))
                    .OrderByDescending(d => d.CreatedAt)
                    .AsNoTracking()
                    .ToListAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving available deliveries");
            throw;
        }
    }

    /// <summary>
    /// Accept a delivery assignment. Rider accepts the order and it moves to "Accepted" status.
    /// Updates both Delivery status and Order status to "In Progress".
    /// </summary>
    public async Task<Delivery?> AcceptDeliveryAsync(int deliveryId, int riderId)
    {
        try
        {
            _logger.LogInformation("AcceptDeliveryAsync called: DeliveryId={DeliveryId}, RiderId={RiderId}", 
                deliveryId, riderId);

            var delivery = await _context.Deliveries.FindAsync(deliveryId);
            if (delivery == null)
            {
                _logger.LogWarning("Delivery not found: DeliveryId={DeliveryId}", deliveryId);
                return null;
            }

            // Verify the delivery is assigned to this rider
            if (delivery.RiderId != riderId)
            {
                _logger.LogWarning("Delivery {DeliveryId} is not assigned to rider {RiderId}. Current rider: {CurrentRiderId}", 
                    deliveryId, riderId, delivery.RiderId);
                return null;
            }

            // Verify delivery is in "Assigned" status
            if (delivery.Status != "Assigned")
            {
                _logger.LogWarning("Delivery {DeliveryId} cannot be accepted. Current status: {Status}", 
                    deliveryId, delivery.Status);
                return null;
            }

            // Update delivery status to "Accepted"
            delivery.Status = "Accepted";
            delivery.AcceptedAt = DateTime.UtcNow;
            delivery.UpdatedAt = DateTime.UtcNow;

            // Add status history
            _context.DeliveryStatusHistory.Add(new DeliveryStatusHistory
            {
                DeliveryId = deliveryId,
                Status = "Accepted",
                ChangedBy = riderId,
                Notes = "Rider accepted the order",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            // Sync Order status to "Accepted" (database is single source of truth)
            var order = await _orderContext.Orders.FindAsync(delivery.OrderId);
            if (order != null)
            {
                order.Status = "Accepted";
                order.UpdatedAt = DateTime.UtcNow;
                await _orderContext.SaveChangesAsync();
                _logger.LogInformation("Order {OrderId} status synced to 'Accepted'", order.OrderId);
            }
            else
            {
                _logger.LogWarning("Order {OrderId} not found when syncing status", delivery.OrderId);
            }

            _logger.LogInformation("Delivery {DeliveryId} accepted by rider {RiderId}", deliveryId, riderId);
            return delivery;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error accepting delivery: DeliveryId={DeliveryId}, RiderId={RiderId}", 
                deliveryId, riderId);
            throw;
        }
    }

    /// <summary>
    /// Reject a delivery assignment. The order becomes available for reassignment to another rider.
    /// </summary>
    public async Task<Delivery?> RejectDeliveryAsync(int deliveryId, int riderId)
    {
        try
        {
            _logger.LogInformation("RejectDeliveryAsync called: DeliveryId={DeliveryId}, RiderId={RiderId}", 
                deliveryId, riderId);

            var delivery = await _context.Deliveries.FindAsync(deliveryId);
            if (delivery == null)
            {
                _logger.LogWarning("Delivery not found: DeliveryId={DeliveryId}", deliveryId);
                return null;
            }

            // Verify the delivery is assigned to this rider
            if (delivery.RiderId != riderId)
            {
                _logger.LogWarning("Delivery {DeliveryId} is not assigned to rider {RiderId}. Current rider: {CurrentRiderId}", 
                    deliveryId, riderId, delivery.RiderId);
                return null;
            }

            // Verify delivery is in "Assigned" status
            if (delivery.Status != "Assigned")
            {
                _logger.LogWarning("Delivery {DeliveryId} cannot be rejected. Current status: {Status}", 
                    deliveryId, delivery.Status);
                return null;
            }

            // Clear rider assignment and set status to allow reassignment
            // Option 1: Set RiderId to null and status to "Pending" (will be reassigned)
            // Option 2: Keep RiderId but mark as "Rejected" and allow system to reassign
            // We'll use Option 2 to maintain history
            
            var previousRiderId = delivery.RiderId;
            delivery.Status = "Pending"; // Mark as pending for reassignment
            delivery.RiderId = null; // Clear assignment
            delivery.UpdatedAt = DateTime.UtcNow;

            // Add status history
            _context.DeliveryStatusHistory.Add(new DeliveryStatusHistory
            {
                DeliveryId = deliveryId,
                Status = "Pending",
                ChangedBy = riderId,
                Notes = $"Rider {riderId} rejected the order. Available for reassignment.",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            // Sync Order status back to "Pending" for reassignment (database is single source of truth)
            var order = await _orderContext.Orders.FindAsync(delivery.OrderId);
            if (order != null)
            {
                order.Status = "Pending";
                order.UpdatedAt = DateTime.UtcNow;
                await _orderContext.SaveChangesAsync();
                _logger.LogInformation("Order {OrderId} status synced back to 'Pending' for reassignment", order.OrderId);
            }

            // Try to auto-assign to another available rider
            try
            {
                var onlineRiders = await _riderContext!.RiderAvailability
                    .Where(ra => ra.IsOnline == true && ra.RiderId != previousRiderId)
                    .Select(ra => ra.RiderId)
                    .ToListAsync();

                if (onlineRiders.Any())
                {
                    var newRiderId = onlineRiders.First();
                    _logger.LogInformation("Attempting to reassign OrderId={OrderId} to RiderId={RiderId}", 
                        delivery.OrderId, newRiderId);

                    var assignRequest = new AssignDeliveryRequest
                    {
                        OrderId = delivery.OrderId,
                        RiderId = newRiderId
                    };

                    var reassignedDelivery = await AssignDeliveryAsync(assignRequest);
                    if (reassignedDelivery != null)
                    {
                        _logger.LogInformation("Order {OrderId} successfully reassigned to Rider {RiderId}", 
                            delivery.OrderId, newRiderId);
                        return reassignedDelivery;
                    }
                }
                else
                {
                    _logger.LogInformation("No other online riders available for OrderId={OrderId}. Order remains unassigned.", 
                        delivery.OrderId);
                }
            }
            catch (Exception reassignEx)
            {
                _logger.LogError(reassignEx, "Error during auto-reassignment of OrderId={OrderId}", 
                    delivery.OrderId);
                // Continue - delivery is already marked as rejected
            }

            _logger.LogInformation("Delivery {DeliveryId} rejected by rider {RiderId}", deliveryId, riderId);
            return delivery;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting delivery: DeliveryId={DeliveryId}, RiderId={RiderId}", 
                deliveryId, riderId);
            throw;
        }
    }
}

using DeliveryService.Data;
using DeliveryService.Models;
using DeliveryService.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DeliveryService.Services;

/// <summary>
/// Service for managing delivery operations including assignment, status updates, and tracking.
/// </summary>
public class DeliveryService : IDeliveryService
{
    private readonly DeliveryDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DeliveryService> _logger;

    private static readonly string[] ActiveStatuses = { "Assigned", "Accepted", "PickedUp", "InTransit" };
    private static readonly string[] ValidStatuses = { "Accepted", "PickedUp", "InTransit", "Delivered", "Failed" };

    public DeliveryService(
        DeliveryDbContext context, 
        IConfiguration configuration, 
        ILogger<DeliveryService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
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
            var order = await _context.Orders.FindAsync(request.OrderId);
            if (order == null)
            {
                _logger.LogWarning("Order not found for assignment: OrderId={OrderId}", request.OrderId);
                return null;
            }

            // Check if delivery already exists
            var existingDelivery = await _context.Deliveries
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.OrderId == request.OrderId);

            if (existingDelivery != null)
            {
                _logger.LogInformation("Delivery already exists for OrderId={OrderId}, DeliveryId={DeliveryId}",
                    request.OrderId, existingDelivery.DeliveryId);
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
        return await _context.Deliveries
            .Include(d => d.Order)
            .FirstOrDefaultAsync(d => d.OrderId == orderId);
    }

    public async Task<Delivery?> GetDeliveryByIdAsync(int deliveryId)
    {
        return await _context.Deliveries
            .Include(d => d.Order)
            .FirstOrDefaultAsync(d => d.DeliveryId == deliveryId);
    }

    public async Task<List<Delivery>> GetActiveDeliveriesAsync()
    {
        try
        {
            return await _context.Deliveries
                .Include(d => d.Order)
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
        var delivery = await _context.Deliveries
            .Include(d => d.Order)
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
}

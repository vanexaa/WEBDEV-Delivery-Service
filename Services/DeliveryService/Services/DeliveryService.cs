using DeliveryService.Data;
using DeliveryService.Models;
using DeliveryService.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace DeliveryService.Services;

public class DeliveryService : IDeliveryService
{
    private readonly DeliveryDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DeliveryService> _logger;

    public DeliveryService(DeliveryDbContext context, IConfiguration configuration, ILogger<DeliveryService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<Delivery?> AssignDeliveryAsync(AssignDeliveryRequest request)
    {
        var order = await _context.Orders.FindAsync(request.OrderId);
        if (order == null)
        {
            return null;
        }

        // Check if delivery already exists
        var existingDelivery = await _context.Deliveries
            .FirstOrDefaultAsync(d => d.OrderId == request.OrderId);

        if (existingDelivery != null)
        {
            return existingDelivery;
        }

        var restaurantLocation = _configuration.GetSection("RestaurantLocation");
        var restaurantLat = decimal.Parse(restaurantLocation["Latitude"] ?? "0");
        var restaurantLng = decimal.Parse(restaurantLocation["Longitude"] ?? "0");

        var delivery = new Delivery
        {
            OrderId = request.OrderId,
            RiderId = request.RiderId, // If null, will be assigned by admin or auto-assignment logic
            Status = "Assigned",
            RestaurantLatitude = restaurantLat,
            RestaurantLongitude = restaurantLng,
            AssignedAt = DateTime.UtcNow
        };

        _context.Deliveries.Add(delivery);

        // Add status history
        _context.DeliveryStatusHistory.Add(new DeliveryStatusHistory
        {
            DeliveryId = delivery.DeliveryId,
            Status = "Assigned",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return delivery;
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
        var activeStatuses = new[] { "Assigned", "Accepted", "PickedUp", "InTransit" };
        return await _context.Deliveries
            .Include(d => d.Order)
            .Where(d => activeStatuses.Contains(d.Status))
            .OrderByDescending(d => d.AssignedAt)
            .ToListAsync();
    }

    public async Task<Delivery?> UpdateDeliveryStatusAsync(int deliveryId, UpdateDeliveryStatusRequest request, int userId)
    {
        var delivery = await _context.Deliveries.FindAsync(deliveryId);
        if (delivery == null)
        {
            return null;
        }

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

        return delivery;
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

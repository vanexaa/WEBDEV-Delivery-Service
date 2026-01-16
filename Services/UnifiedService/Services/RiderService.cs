/*
 * UnifiedService Architecture - Rider Service Implementation
 * 
 * Part of UnifiedService on port 5000.
 * Handles rider profiles, availability, earnings, and feedback.
 */
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RiderService.Data;
using RiderService.Models;
using RiderService.Models.DTOs;
using DeliveryService.Data;
using OrderService.Data;

namespace RiderService.Services;

/// <summary>
/// Service for managing rider operations including profile, availability, orders, earnings, and feedback.
/// </summary>
public class RiderService : IRiderService
{
    private readonly RiderDbContext _context;
    private readonly DeliveryDbContext _deliveryContext;
    private readonly OrderDbContext _orderContext;
    private readonly ILogger<RiderService> _logger;

    public RiderService(
        RiderDbContext context, 
        DeliveryDbContext deliveryContext,
        OrderDbContext orderContext,
        ILogger<RiderService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _deliveryContext = deliveryContext ?? throw new ArgumentNullException(nameof(deliveryContext));
        _orderContext = orderContext ?? throw new ArgumentNullException(nameof(orderContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<List<Rider>> GetAllRidersAsync()
    {
        return await _context.Riders
            .OrderBy(r => r.FullName)
            .ToListAsync();
    }

    public async Task<List<RiderWithAvailabilityDto>> GetAllRidersWithAvailabilityAsync()
    {
        try
        {
            var riders = await _context.Riders
                .OrderBy(r => r.FullName)
                .AsNoTracking()
                .ToListAsync();

            var availabilityList = await _context.RiderAvailability
                .AsNoTracking()
                .ToListAsync();

            var result = new List<RiderWithAvailabilityDto>();
            foreach (var rider in riders)
            {
                var availability = availabilityList.FirstOrDefault(a => a.RiderId == rider.RiderId);
                result.Add(new RiderWithAvailabilityDto
                {
                    RiderId = rider.RiderId,
                    UserId = rider.UserId,
                    FullName = rider.FullName,
                    PhoneNumber = rider.PhoneNumber,
                    Email = rider.Email,
                    VehicleType = rider.VehicleType,
                    VehicleNumber = rider.VehicleNumber,
                    LicenseNumber = rider.LicenseNumber,
                    IsActive = rider.IsActive,
                    IsOnline = availability?.IsOnline ?? false,
                    CreatedAt = rider.CreatedAt,
                    UpdatedAt = rider.UpdatedAt
                });
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all riders with availability");
            throw;
        }
    }

    public async Task<Rider?> GetRiderByIdAsync(int riderId)
    {
        return await _context.Riders.FindAsync(riderId);
    }

    public async Task<Rider?> GetRiderByUserIdAsync(int userId)
    {
        return await _context.Riders.FirstOrDefaultAsync(r => r.UserId == userId);
    }

    public async Task<RiderAvailability?> GetRiderAvailabilityAsync(int riderId)
    {
        try
        {
            _logger.LogInformation("GetRiderAvailabilityAsync called for RiderId={RiderId}", riderId);
            
            if (riderId <= 0)
            {
                _logger.LogWarning("Invalid riderId provided: {RiderId}", riderId);
                return null;
            }

            var availability = await _context.RiderAvailability
                .FirstOrDefaultAsync(a => a.RiderId == riderId);
            
            if (availability == null)
            {
                _logger.LogInformation("No availability record found for RiderId={RiderId}", riderId);
            }
            else
            {
                _logger.LogInformation("Availability found for RiderId={RiderId}, IsOnline={IsOnline}", 
                    riderId, availability.IsOnline);
            }
            
            return availability;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetRiderAvailabilityAsync for RiderId={RiderId}", riderId);
            throw;
        }
    }

    public async Task<RiderAvailability?> UpdateRiderAvailabilityAsync(int riderId, UpdateAvailabilityRequest request)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (riderId <= 0)
        {
            _logger.LogWarning("Invalid rider ID: RiderId={RiderId}", riderId);
            return null;
        }

        try
        {
            _logger.LogInformation("UpdateRiderAvailabilityAsync called: RiderId={RiderId}, IsOnline={IsOnline}", 
                riderId, request.IsOnline);

            // Verify rider exists
            var rider = await _context.Riders.FindAsync(riderId);
            if (rider == null)
            {
                _logger.LogWarning("Rider not found for RiderId={RiderId}", riderId);
                return null;
            }

            var availability = await _context.RiderAvailability
                .FirstOrDefaultAsync(a => a.RiderId == riderId);

            if (availability == null)
            {
                // Create new availability record
                _logger.LogInformation("Creating new availability record for RiderId={RiderId}", riderId);
                availability = new RiderAvailability
                {
                    RiderId = riderId,
                    IsOnline = request.IsOnline,
                    CurrentLatitude = request.Latitude,
                    CurrentLongitude = request.Longitude,
                    LastSeen = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.RiderAvailability.Add(availability);
            }
            else
            {
                // Update existing availability record
                _logger.LogInformation("Updating existing availability record for RiderId={RiderId}, OldStatus={OldStatus}, NewStatus={NewStatus}", 
                    riderId, availability.IsOnline, request.IsOnline);
                
                availability.IsOnline = request.IsOnline;
                if (request.Latitude.HasValue && request.Longitude.HasValue)
                {
                    availability.CurrentLatitude = request.Latitude.Value;
                    availability.CurrentLongitude = request.Longitude.Value;
                }
                availability.LastSeen = DateTime.UtcNow;
                availability.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Rider availability updated successfully: RiderId={RiderId}, IsOnline={IsOnline}",
                riderId, availability.IsOnline);
            
            return availability;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating rider availability: RiderId={RiderId}, Error={Error}", riderId, ex.Message);
            throw;
        }
    }

    public async Task<List<RiderOrderDto>> GetRiderOrdersAsync(int riderId)
    {
        try
        {
            _logger.LogInformation("GetRiderOrdersAsync called for RiderId={RiderId}", riderId);
            
            // Active delivery statuses
            var activeStatuses = new[] { "Assigned", "Accepted", "PickedUp", "InTransit" };
            
            // Get active deliveries for this rider from DeliveryServiceDB
            // Important: Filter by RiderId to ensure rider only sees their assigned orders
            var deliveries = await _deliveryContext.Deliveries
                .Where(d => d.RiderId.HasValue && d.RiderId.Value == riderId && activeStatuses.Contains(d.Status))
                .OrderByDescending(d => d.AssignedAt)
                .AsNoTracking()
                .ToListAsync();

            _logger.LogInformation("Found {Count} active deliveries for RiderId={RiderId}", deliveries.Count, riderId);
            
            if (!deliveries.Any())
            {
                _logger.LogInformation("No active orders found for RiderId={RiderId}", riderId);
                return new List<RiderOrderDto>();
            }

            // Get order IDs from deliveries
            var orderIds = deliveries.Select(d => d.OrderId).ToList();

            // Fetch order details from OrderServiceDB
            var orders = await _orderContext.Orders
                .Where(o => orderIds.Contains(o.OrderId))
                .AsNoTracking()
                .ToListAsync();

            // Map deliveries to RiderOrderDto with order information
            var riderOrders = new List<RiderOrderDto>();
            foreach (var delivery in deliveries)
            {
                var order = orders.FirstOrDefault(o => o.OrderId == delivery.OrderId);
                if (order != null)
                {
                    riderOrders.Add(new RiderOrderDto
                    {
                        DeliveryId = delivery.DeliveryId,
                        OrderId = delivery.OrderId,
                        CustomerName = order.CustomerName ?? string.Empty,
                        CustomerPhone = order.CustomerPhone ?? string.Empty,
                        DeliveryAddress = order.DeliveryAddress ?? string.Empty,
                        SpecialInstructions = order.SpecialInstructions,
                        Status = delivery.Status ?? string.Empty,
                        AssignedAt = delivery.AssignedAt
                    });
                }
            }

            _logger.LogInformation("Retrieved {Count} active orders for RiderId={RiderId}", riderOrders.Count, riderId);
            return riderOrders;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider orders for RiderId={RiderId}", riderId);
            return new List<RiderOrderDto>();
        }
    }

    public async Task<List<RiderEarning>> GetRiderEarningsAsync(int riderId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.RiderEarnings
            .Where(e => e.RiderId == riderId)
            .AsQueryable();

        if (startDate.HasValue)
        {
            query = query.Where(e => e.EarningDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(e => e.EarningDate <= endDate.Value);
        }

        return await query
            .OrderByDescending(e => e.EarningDate)
            .ToListAsync();
    }

    public async Task<List<RiderFeedback>> GetRiderFeedbackAsync(int riderId)
    {
        return await _context.RiderFeedback
            .Where(f => f.RiderId == riderId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
    }

    public async Task<RiderProfileDto?> GetRiderProfileAsync(int riderId)
    {
        try
        {
            _logger.LogInformation("GetRiderProfileAsync called for RiderId={RiderId}", riderId);
            
            if (riderId <= 0)
            {
                _logger.LogWarning("Invalid riderId provided: {RiderId}", riderId);
                return null;
            }

            var rider = await _context.Riders.FindAsync(riderId);
            if (rider == null)
            {
                _logger.LogWarning("Rider not found in database for RiderId={RiderId}", riderId);
                return null;
            }

            _logger.LogInformation("Rider found: RiderId={RiderId}, FullName={FullName}", rider.RiderId, rider.FullName);

            var availability = await GetRiderAvailabilityAsync(riderId);
            var earnings = await _context.RiderEarnings
                .Where(e => e.RiderId == riderId && e.Status == "Paid")
                .ToListAsync();
            var feedback = await _context.RiderFeedback
                .Where(f => f.RiderId == riderId)
                .ToListAsync();

            var profile = new RiderProfileDto
            {
                RiderId = rider.RiderId,
                FullName = rider.FullName ?? string.Empty,
                PhoneNumber = rider.PhoneNumber ?? string.Empty,
                Email = rider.Email,
                VehicleType = rider.VehicleType,
                VehicleNumber = rider.VehicleNumber,
                IsOnline = availability?.IsOnline ?? false,
                TotalEarnings = earnings.Any() ? earnings.Sum(e => e.Amount) : 0,
                TotalDeliveries = earnings.Count,
                AverageRating = feedback.Any() ? feedback.Average(f => f.Rating) : 0
            };

            _logger.LogInformation("Rider profile created successfully for RiderId={RiderId}, TotalEarnings={TotalEarnings}, TotalDeliveries={TotalDeliveries}", 
                riderId, profile.TotalEarnings, profile.TotalDeliveries);

            return profile;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetRiderProfileAsync for RiderId={RiderId}", riderId);
            throw;
        }
    }

    public async Task<List<RiderOrderDto>> GetRiderDeliveryHistoryAsync(int riderId, DateTime? startDate = null, DateTime? endDate = null)
    {
        try
        {
            _logger.LogInformation("GetRiderDeliveryHistoryAsync called for RiderId={RiderId}", riderId);
            
            // Get all deliveries for this rider (including completed ones)
            // Important: Filter by RiderId to ensure rider only sees their deliveries
            var query = _deliveryContext.Deliveries
                .Where(d => d.RiderId.HasValue && d.RiderId.Value == riderId)
                .AsQueryable();

            // Filter by date range if provided
            if (startDate.HasValue)
            {
                query = query.Where(d => d.CreatedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(d => d.CreatedAt <= endDate.Value);
            }

            var deliveries = await query
                .OrderByDescending(d => d.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            _logger.LogInformation("Found {Count} deliveries for RiderId={RiderId} in history query", deliveries.Count, riderId);

            if (!deliveries.Any())
            {
                _logger.LogInformation("No delivery history found for RiderId={RiderId}", riderId);
                return new List<RiderOrderDto>();
            }

            // Get order IDs from deliveries
            var orderIds = deliveries.Select(d => d.OrderId).Distinct().ToList();
            _logger.LogInformation("Fetching order details for {Count} orders from OrderServiceDB for RiderId={RiderId}", 
                orderIds.Count, riderId);

            // Fetch order details from OrderServiceDB
            var orders = await _orderContext.Orders
                .Where(o => orderIds.Contains(o.OrderId))
                .AsNoTracking()
                .ToListAsync();

            _logger.LogInformation("Retrieved {Count} orders from OrderServiceDB for RiderId={RiderId}", orders.Count, riderId);

            // Map deliveries to RiderOrderDto with order information
            var deliveryHistory = new List<RiderOrderDto>();
            foreach (var delivery in deliveries)
            {
                var order = orders.FirstOrDefault(o => o.OrderId == delivery.OrderId);
                if (order != null)
                {
                    deliveryHistory.Add(new RiderOrderDto
                    {
                        DeliveryId = delivery.DeliveryId,
                        OrderId = delivery.OrderId,
                        CustomerName = order.CustomerName ?? string.Empty,
                        CustomerPhone = order.CustomerPhone ?? string.Empty,
                        DeliveryAddress = order.DeliveryAddress ?? string.Empty,
                        SpecialInstructions = order.SpecialInstructions,
                        Status = delivery.Status ?? string.Empty,
                        AssignedAt = delivery.AssignedAt
                    });
                    
                    _logger.LogDebug("Mapped history delivery: DeliveryId={DeliveryId}, OrderId={OrderId}, Status={Status} for RiderId={RiderId}",
                        delivery.DeliveryId, delivery.OrderId, delivery.Status, riderId);
                }
                else
                {
                    _logger.LogWarning("Order not found in OrderServiceDB for DeliveryId={DeliveryId}, OrderId={OrderId}, RiderId={RiderId}",
                        delivery.DeliveryId, delivery.OrderId, riderId);
                }
            }

            _logger.LogInformation("Retrieved {Count} delivery history records for RiderId={RiderId}", 
                deliveryHistory.Count, riderId);
            return deliveryHistory;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider delivery history for RiderId={RiderId}", riderId);
            return new List<RiderOrderDto>();
        }
    }
}

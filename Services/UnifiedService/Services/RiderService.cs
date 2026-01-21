/*
 * Database-First Architecture - Rider Service Implementation
 * 
 * ARCHITECTURAL RULES ENFORCED:
 * - ALL data access through stored procedures only
 * - NO LINQ queries against DbSets
 * - NO Add/Update/Remove/SaveChanges (except via SP wrappers)
 * - Service layer only executes SPs and interprets results
 */
using Microsoft.Extensions.Logging;
using RiderService.Data;
using RiderService.Models;
using RiderService.Models.DTOs;
using DeliveryService.Data;
using OrderService.Data;
using System.Text.Json;

namespace RiderService.Services;

/// <summary>
/// Service for managing rider operations including profile, availability, orders, earnings, and feedback.
/// All data access through stored procedures only.
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

    /// <summary>
    /// Get all riders via sp_Rider_GetAll stored procedure.
    /// </summary>
    public async Task<List<Rider>> GetAllRidersAsync()
    {
        return await _context.SpRiderGetAllAsync();
    }

    /// <summary>
    /// Get all riders with availability via stored procedures.
    /// </summary>
    public async Task<List<RiderWithAvailabilityDto>> GetAllRidersWithAvailabilityAsync()
    {
        try
        {
            var riders = await _context.SpRiderGetAllAsync();

            var result = new List<RiderWithAvailabilityDto>();
            foreach (var rider in riders)
            {
                var availability = await _context.SpRiderGetAvailabilityAsync(rider.RiderId);
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

    /// <summary>
    /// Get rider by ID via sp_Rider_GetById stored procedure.
    /// </summary>
    public async Task<Rider?> GetRiderByIdAsync(int riderId)
    {
        return await _context.SpRiderGetByIdAsync(riderId);
    }

    /// <summary>
    /// Get rider by User ID via sp_Rider_GetByUserId stored procedure.
    /// </summary>
    public async Task<Rider?> GetRiderByUserIdAsync(int userId)
    {
        return await _context.SpRiderGetByUserIdAsync(userId);
    }

    /// <summary>
    /// Get rider availability via sp_Rider_GetAvailability stored procedure.
    /// </summary>
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

            var availability = await _context.SpRiderGetAvailabilityAsync(riderId);
            
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

    /// <summary>
    /// Update rider availability via sp_Rider_SetOnlineStatus stored procedure.
    /// </summary>
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
            var rider = await _context.SpRiderGetByIdAsync(riderId);
            if (rider == null)
            {
                _logger.LogWarning("Rider not found for RiderId={RiderId}", riderId);
                return null;
            }

            // Update via stored procedure
            var (availability, resultCode, resultMessage) = await _context.SpRiderSetOnlineStatusAsync(
                riderId, request.IsOnline, request.Latitude, request.Longitude);

            if (resultCode != 0 && availability == null)
            {
                _logger.LogWarning("Failed to update availability: {ResultMessage}", resultMessage);
                return null;
            }
            
            _logger.LogInformation("Rider availability updated successfully: RiderId={RiderId}, IsOnline={IsOnline}",
                riderId, availability?.IsOnline);
            
            return availability;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating rider availability: RiderId={RiderId}, Error={Error}", riderId, ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Get rider orders via stored procedures.
    /// Uses sp_Delivery_GetActiveByRiderId and sp_Order_GetById.
    /// </summary>
    public async Task<List<RiderOrderDto>> GetRiderOrdersAsync(int riderId)
    {
        try
        {
            _logger.LogInformation("GetRiderOrdersAsync called for RiderId={RiderId}", riderId);
            
            if (riderId <= 0)
            {
                _logger.LogWarning("Invalid riderId provided to GetRiderOrdersAsync: {RiderId}", riderId);
                return new List<RiderOrderDto>();
            }
            
            // Get active deliveries for this rider via stored procedure
            var deliveries = await _deliveryContext.SpDeliveryGetActiveByRiderIdAsync(riderId);

            _logger.LogInformation("Found {Count} active deliveries for RiderId={RiderId}. Statuses: {Statuses}", 
                deliveries.Count, riderId, string.Join(", ", deliveries.Select(d => d.Status)));

            if (!deliveries.Any())
            {
                _logger.LogInformation("No active orders found for RiderId={RiderId}", riderId);
                return new List<RiderOrderDto>();
            }

            // Map deliveries to RiderOrderDto with order information
            var riderOrders = new List<RiderOrderDto>();
            foreach (var delivery in deliveries)
            {
                // Fetch order details via stored procedure
                var order = await _orderContext.SpOrderGetByIdAsync(delivery.OrderId);
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
                    
                    _logger.LogInformation("Mapped order: DeliveryId={DeliveryId}, OrderId={OrderId}, Status={Status}",
                        delivery.DeliveryId, delivery.OrderId, delivery.Status);
                }
                else
                {
                    _logger.LogWarning("Order {OrderId} not found in OrderServiceDB for DeliveryId={DeliveryId}",
                        delivery.OrderId, delivery.DeliveryId);
                }
            }

            _logger.LogInformation("Retrieved {Count} active orders for RiderId={RiderId}. Orders with 'Assigned' status: {AssignedCount}",
                riderOrders.Count, riderId, riderOrders.Count(o => o.Status == "Assigned"));
            return riderOrders;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider orders for RiderId={RiderId}: {Error}", riderId, ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Get rider earnings via sp_Rider_GetEarnings stored procedure.
    /// </summary>
    public async Task<List<RiderEarning>> GetRiderEarningsAsync(int riderId, DateTime? startDate = null, DateTime? endDate = null)
    {
        return await _context.SpRiderGetEarningsAsync(riderId, startDate, endDate);
    }

    /// <summary>
    /// Get rider feedback via sp_Rider_GetFeedback stored procedure.
    /// </summary>
    public async Task<List<RiderFeedback>> GetRiderFeedbackAsync(int riderId)
    {
        return await _context.SpRiderGetFeedbackAsync(riderId);
    }

    /// <summary>
    /// Get rider profile via stored procedures.
    /// </summary>
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

            var rider = await _context.SpRiderGetByIdAsync(riderId);
            if (rider == null)
            {
                _logger.LogWarning("Rider not found in database for RiderId={RiderId}", riderId);
                return null;
            }

            _logger.LogInformation("Rider found: RiderId={RiderId}, FullName={FullName}", rider.RiderId, rider.FullName);

            var availability = await GetRiderAvailabilityAsync(riderId);
            var earnings = await _context.SpRiderGetEarningsAsync(riderId);
            var paidEarnings = earnings.Where(e => e.Status == "Paid").ToList();
            var feedback = await _context.SpRiderGetFeedbackAsync(riderId);

            var profile = new RiderProfileDto
            {
                RiderId = rider.RiderId,
                FullName = rider.FullName ?? string.Empty,
                PhoneNumber = rider.PhoneNumber ?? string.Empty,
                Email = rider.Email,
                VehicleType = rider.VehicleType,
                VehicleNumber = rider.VehicleNumber,
                IsOnline = availability?.IsOnline ?? false,
                TotalEarnings = paidEarnings.Any() ? paidEarnings.Sum(e => e.Amount) : 0,
                TotalDeliveries = paidEarnings.Count,
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

    /// <summary>
    /// Get rider delivery history via stored procedures.
    /// Uses sp_Delivery_GetByRiderId and sp_Order_GetById.
    /// </summary>
    public async Task<List<RiderOrderDto>> GetRiderDeliveryHistoryAsync(int riderId, DateTime? startDate = null, DateTime? endDate = null)
    {
        try
        {
            _logger.LogInformation("GetRiderDeliveryHistoryAsync called for RiderId={RiderId}", riderId);
            
            // Get all deliveries for this rider via stored procedure
            var deliveries = await _deliveryContext.SpDeliveryGetByRiderIdAsync(riderId);

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

            _logger.LogInformation("Found {Count} deliveries for RiderId={RiderId} in history query", deliveries.Count, riderId);

            if (!deliveries.Any())
            {
                _logger.LogInformation("No delivery history found for RiderId={RiderId}", riderId);
                return new List<RiderOrderDto>();
            }

            // Map deliveries to RiderOrderDto with order information
            var deliveryHistory = new List<RiderOrderDto>();
            foreach (var delivery in deliveries)
            {
                // Fetch order details via stored procedure
                var order = await _orderContext.SpOrderGetByIdAsync(delivery.OrderId);
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

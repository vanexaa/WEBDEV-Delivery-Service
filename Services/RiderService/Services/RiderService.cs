using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RiderService.Data;
using RiderService.Models;
using RiderService.Models.DTOs;

namespace RiderService.Services;

/// <summary>
/// Service for managing rider operations including profile, availability, orders, earnings, and feedback.
/// </summary>
public class RiderService : IRiderService
{
    private readonly RiderDbContext _context;
    private readonly ILogger<RiderService> _logger;

    public RiderService(RiderDbContext context, ILogger<RiderService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
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
        return await _context.RiderAvailability
            .FirstOrDefaultAsync(a => a.RiderId == riderId);
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
            var availability = await _context.RiderAvailability
                .FirstOrDefaultAsync(a => a.RiderId == riderId);

            if (availability == null)
            {
                // Create new availability record
                availability = new RiderAvailability
                {
                    RiderId = riderId,
                    IsOnline = request.IsOnline,
                    CurrentLatitude = request.Latitude,
                    CurrentLongitude = request.Longitude,
                    LastSeen = DateTime.UtcNow,
                    // CreatedAt = DateTime.UtcNow, // Removed because property does not exist in Model
                    UpdatedAt = DateTime.UtcNow
                };
                _context.RiderAvailability.Add(availability);
            }
            else
            {
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

            _logger.LogInformation("Rider availability updated: RiderId={RiderId}, IsOnline={IsOnline}",
                riderId, request.IsOnline);

            return availability;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating rider availability: RiderId={RiderId}", riderId);
            throw;
        }
    }

    public async Task<List<RiderOrderDto>> GetRiderOrdersAsync(int riderId)
    {
        // This would typically call Delivery Service via HTTP client
        // Added Task.FromResult to resolve CS1998 warning
        return await Task.FromResult(new List<RiderOrderDto>());
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
        var rider = await _context.Riders.FindAsync(riderId);
        if (rider == null)
        {
            return null;
        }

        var availability = await GetRiderAvailabilityAsync(riderId);
        
        var earnings = await _context.RiderEarnings
            .Where(e => e.RiderId == riderId && e.Status == "Paid")
            .ToListAsync();

        var feedback = await _context.RiderFeedback
            .Where(f => f.RiderId == riderId)
            .ToListAsync();

        return new RiderProfileDto
        {
            RiderId = rider.RiderId,
            FullName = rider.FullName,
            PhoneNumber = rider.PhoneNumber,
            Email = rider.Email,
            VehicleType = rider.VehicleType,
            VehicleNumber = rider.VehicleNumber,
            IsOnline = availability?.IsOnline ?? false,
            TotalEarnings = earnings.Sum(e => e.Amount),
            TotalDeliveries = earnings.Count,
            AverageRating = feedback.Any() ? feedback.Average(f => f.Rating) : 0
        };
    }
}
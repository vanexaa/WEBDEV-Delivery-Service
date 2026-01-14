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

    public async Task<List<RiderListDto>> GetAllRidersAsync()
    {
        var riders = await _context.Riders
            .Where(r => r.IsActive)
            .ToListAsync();

        var availabilityMap = await _context.RiderAvailability
            .Where(a => riders.Select(r => r.RiderId).Contains(a.RiderId))
            .ToDictionaryAsync(a => a.RiderId, a => a.IsOnline);

        return riders.Select(r => new RiderListDto
        {
            RiderId = r.RiderId,
            FullName = r.FullName,
            PhoneNumber = r.PhoneNumber,
            Email = r.Email,
            VehicleType = r.VehicleType,
            IsOnline = availabilityMap.GetValueOrDefault(r.RiderId, false),
            IsActive = r.IsActive
        }).ToList();
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
        // For now, returning empty list - in real implementation, would integrate with Delivery Service
        return new List<RiderOrderDto>();
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

    public async Task SeedMockDataAsync()
    {
        // Check if data already exists
        if (await _context.Riders.AnyAsync())
        {
            _logger.LogInformation("Riders already exist, skipping seed");
            return;
        }

        var riders = new List<Rider>
        {
            new Rider
            {
                UserId = 2,
                FullName = "John Rider",
                PhoneNumber = "+1234567890",
                Email = "john.rider@example.com",
                VehicleType = "Motorcycle",
                VehicleNumber = "MC-1234",
                LicenseNumber = "DL-001",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Rider
            {
                UserId = 3,
                FullName = "Sarah Driver",
                PhoneNumber = "+1234567891",
                Email = "sarah.driver@example.com",
                VehicleType = "Bicycle",
                VehicleNumber = "BC-5678",
                LicenseNumber = "DL-002",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Rider
            {
                UserId = 4,
                FullName = "Mike Courier",
                PhoneNumber = "+1234567892",
                Email = "mike.courier@example.com",
                VehicleType = "Motorcycle",
                VehicleNumber = "MC-9012",
                LicenseNumber = "DL-003",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Rider
            {
                UserId = 5,
                FullName = "Emma Delivery",
                PhoneNumber = "+1234567893",
                Email = "emma.delivery@example.com",
                VehicleType = "Bicycle",
                VehicleNumber = "BC-3456",
                LicenseNumber = "DL-004",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Rider
            {
                UserId = 6,
                FullName = "Alex Transport",
                PhoneNumber = "+1234567894",
                Email = "alex.transport@example.com",
                VehicleType = "Motorcycle",
                VehicleNumber = "MC-7890",
                LicenseNumber = "DL-005",
                IsActive = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _context.Riders.AddRange(riders);
        await _context.SaveChangesAsync();

        // Add availability data
        var availability = new List<RiderAvailability>
        {
            new RiderAvailability
            {
                RiderId = 1,
                IsOnline = true,
                CurrentLatitude = 40.7128m,
                CurrentLongitude = -74.0060m,
                LastSeen = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new RiderAvailability
            {
                RiderId = 2,
                IsOnline = true,
                CurrentLatitude = 40.7580m,
                CurrentLongitude = -73.9855m,
                LastSeen = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new RiderAvailability
            {
                RiderId = 3,
                IsOnline = false,
                CurrentLatitude = 40.7505m,
                CurrentLongitude = -73.9934m,
                LastSeen = DateTime.UtcNow.AddMinutes(-30),
                UpdatedAt = DateTime.UtcNow
            },
            new RiderAvailability
            {
                RiderId = 4,
                IsOnline = true,
                CurrentLatitude = 40.7282m,
                CurrentLongitude = -73.9942m,
                LastSeen = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _context.RiderAvailability.AddRange(availability);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Mock rider data seeded successfully");
    }
}

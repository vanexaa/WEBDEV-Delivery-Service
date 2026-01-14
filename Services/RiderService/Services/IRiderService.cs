using RiderService.Models;
using RiderService.Models.DTOs;

namespace RiderService.Services;

public interface IRiderService
{
    Task<List<RiderListDto>> GetAllRidersAsync();
    Task<Rider?> GetRiderByIdAsync(int riderId);
    Task<Rider?> GetRiderByUserIdAsync(int userId);
    Task<RiderAvailability?> GetRiderAvailabilityAsync(int riderId);
    Task<RiderAvailability?> UpdateRiderAvailabilityAsync(int riderId, UpdateAvailabilityRequest request);
    Task<List<RiderOrderDto>> GetRiderOrdersAsync(int riderId);
    Task<List<RiderEarning>> GetRiderEarningsAsync(int riderId, DateTime? startDate = null, DateTime? endDate = null);
    Task<List<RiderFeedback>> GetRiderFeedbackAsync(int riderId);
    Task<RiderProfileDto?> GetRiderProfileAsync(int riderId);
    Task SeedMockDataAsync();
}

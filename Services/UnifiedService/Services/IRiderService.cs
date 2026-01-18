/*
 * UnifiedService Architecture - Rider Service Interface
 * 
 * Part of UnifiedService on port 5000.
 * Defines rider service contract.
 */
using RiderService.Models;
using RiderService.Models.DTOs;

namespace RiderService.Services;

public interface IRiderService
{
    Task<List<Rider>> GetAllRidersAsync();
    Task<Rider?> GetRiderByIdAsync(int riderId);
    Task<Rider?> GetRiderByUserIdAsync(int userId);
    Task<RiderAvailability?> GetRiderAvailabilityAsync(int riderId);
    Task<RiderAvailability?> UpdateRiderAvailabilityAsync(int riderId, UpdateAvailabilityRequest request);
    Task<List<RiderOrderDto>> GetRiderOrdersAsync(int riderId);
    Task<List<RiderEarning>> GetRiderEarningsAsync(int riderId, DateTime? startDate = null, DateTime? endDate = null);
    Task<List<RiderFeedback>> GetRiderFeedbackAsync(int riderId);
    Task<RiderProfileDto?> GetRiderProfileAsync(int riderId);
    Task<List<RiderOrderDto>> GetRiderDeliveryHistoryAsync(int riderId, DateTime? startDate = null, DateTime? endDate = null);
    Task<List<RiderWithAvailabilityDto>> GetAllRidersWithAvailabilityAsync();
}

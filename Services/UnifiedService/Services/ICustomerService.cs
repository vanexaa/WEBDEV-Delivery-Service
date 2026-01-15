/*
 * UnifiedService Architecture - Customer Service Interface
 * 
 * Part of UnifiedService on port 5000.
 * Defines customer service contract.
 */
using CustomerService.Models.DTOs;

namespace CustomerService.Services;

public interface ICustomerService
{
    Task<RiderInfoDto?> GetRiderInfoAsync(int orderId);
    Task<ETADto?> GetETAAsync(int orderId);
    Task<bool> SubmitFeedbackAsync(int orderId, int customerId, FeedbackRequest request);
}

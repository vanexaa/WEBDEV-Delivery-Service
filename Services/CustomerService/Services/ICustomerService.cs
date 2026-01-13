using CustomerService.Models.DTOs;

namespace CustomerService.Services;

public interface ICustomerService
{
    Task<RiderInfoDto?> GetRiderInfoAsync(int orderId);
    Task<ETADto?> GetETAAsync(int orderId);
    Task<bool> SubmitFeedbackAsync(int orderId, int customerId, FeedbackRequest request);
}

/*
 * UnifiedService Architecture - Customer Service Implementation
 * 
 * Part of UnifiedService on port 5000.
 * Handles customer operations: rider info, ETA tracking, and feedback.
 */
using System.Linq;
using System.Net.Http.Json;
using CustomerService.Models.DTOs;
using Microsoft.Extensions.Configuration;

namespace CustomerService.Services;

public class CustomerService : ICustomerService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CustomerService> _logger;

    public CustomerService(HttpClient httpClient, IConfiguration configuration, ILogger<CustomerService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<RiderInfoDto?> GetRiderInfoAsync(int orderId)
    {
        try
        {
            // UnifiedService: All services on port 5000
            var deliveryServiceUrl = _configuration["Services:DeliveryServiceUrl"] ?? "http://localhost:5000";
            var deliveryResponse = await _httpClient.GetFromJsonAsync<DeliveryDto>($"{deliveryServiceUrl}/api/deliveries/{orderId}");

            if (deliveryResponse == null || !deliveryResponse.RiderId.HasValue)
            {
                return null;
            }

            // UnifiedService: All services on port 5000
            var riderServiceUrl = _configuration["Services:RiderServiceUrl"] ?? "http://localhost:5000";
            var riderResponse = await _httpClient.GetFromJsonAsync<RiderDto>($"{riderServiceUrl}/api/riders/{deliveryResponse.RiderId.Value}");

            if (riderResponse == null)
            {
                return null;
            }

            // Get rider profile for additional details like vehicle number
            RiderProfileDto? riderProfile = null;
            try
            {
                var profileResponse = await _httpClient.GetFromJsonAsync<RiderProfileDto>($"{riderServiceUrl}/api/riders/{riderResponse.RiderId}/profile");
                riderProfile = profileResponse;
            }
            catch
            {
                // Profile not available, continue with basic info
            }

            // Get rating from feedback if available
            decimal? averageRating = null;
            try
            {
                var feedbackResponse = await _httpClient.GetFromJsonAsync<List<RiderFeedbackDto>>($"{riderServiceUrl}/api/riders/{riderResponse.RiderId}/feedback");
                if (feedbackResponse != null && feedbackResponse.Any())
                {
                    averageRating = feedbackResponse.Average(f => f.Rating);
                }
            }
            catch
            {
                // Feedback not available, use default
            }

            return new RiderInfoDto
            {
                RiderId = riderResponse.RiderId,
                FullName = riderResponse.FullName,
                PhoneNumber = riderResponse.PhoneNumber,
                VehicleType = riderResponse.VehicleType,
                VehicleNumber = riderProfile?.VehicleNumber ?? riderResponse.VehicleNumber,
                Rating = averageRating ?? riderProfile?.AverageRating
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider info");
            return null;
        }
    }

    public async Task<ETADto?> GetETAAsync(int orderId)
    {
        try
        {
            // UnifiedService: All services on port 5000
            var deliveryServiceUrl = _configuration["Services:DeliveryServiceUrl"] ?? "http://localhost:5000";
            var trackingResponse = await _httpClient.GetFromJsonAsync<DeliveryTrackingDto>($"{deliveryServiceUrl}/api/deliveries/{orderId}/track");

            if (trackingResponse == null)
            {
                return null;
            }

            var estimatedArrival = trackingResponse.EstimatedTime != null 
                ? DateTime.UtcNow.AddMinutes(int.Parse(trackingResponse.EstimatedTime.Replace(" minutes", ""))) 
                : (DateTime?)null;

            return new ETADto
            {
                OrderId = orderId,
                EstimatedTime = trackingResponse.EstimatedTime != null 
                    ? int.Parse(trackingResponse.EstimatedTime.Replace(" minutes", "")) 
                    : null,
                Status = trackingResponse.Status,
                EstimatedArrival = estimatedArrival
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ETA");
            return null;
        }
    }

    public async Task<bool> SubmitFeedbackAsync(int orderId, int customerId, FeedbackRequest request)
    {
        try
        {
            // UnifiedService: All services on port 5000
            var deliveryServiceUrl = _configuration["Services:DeliveryServiceUrl"] ?? "http://localhost:5000";
            var deliveryResponse = await _httpClient.GetFromJsonAsync<DeliveryDto>($"{deliveryServiceUrl}/api/deliveries/{orderId}");

            if (deliveryResponse == null || !deliveryResponse.RiderId.HasValue)
            {
                return false;
            }

            var riderServiceUrl = _configuration["Services:RiderServiceUrl"] ?? "http://localhost:5000";
            // In a real implementation, this would call a feedback endpoint
            // For now, returning true as placeholder
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting feedback");
            return false;
        }
    }
}

// DTOs for external service calls
public class DeliveryDto
{
    public int DeliveryId { get; set; }
    public int OrderId { get; set; }
    public int? RiderId { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class DeliveryTrackingDto
{
    public int DeliveryId { get; set; }
    public int OrderId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? EstimatedTime { get; set; }
}

public class RiderDto
{
    public int RiderId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? VehicleType { get; set; }
    public string? VehicleNumber { get; set; }
}

public class RiderProfileDto
{
    public int RiderId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? VehicleType { get; set; }
    public string? VehicleNumber { get; set; }
    public decimal? AverageRating { get; set; }
}

public class RiderFeedbackDto
{
    public int FeedbackId { get; set; }
    public int RiderId { get; set; }
    public int OrderId { get; set; }
    public decimal Rating { get; set; }
    public string? Comment { get; set; }
}

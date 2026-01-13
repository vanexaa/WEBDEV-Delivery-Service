using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using CustomerService.Models.DTOs;
using CustomerService.Services;

namespace CustomerService.Controllers;

/// <summary>
/// Controller for managing customer operations including rider information, ETA tracking, and feedback submission.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(ICustomerService customerService, ILogger<CustomersController> logger)
    {
        _customerService = customerService ?? throw new ArgumentNullException(nameof(customerService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get rider information for an order
    /// </summary>
    [HttpGet("{orderId}/rider")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<ActionResult> GetRiderInfo(int orderId)
    {
        try
        {
            var riderInfo = await _customerService.GetRiderInfoAsync(orderId);
            if (riderInfo == null)
            {
                return NotFound(new { message = "Rider information not found for this order" });
            }

            return Ok(riderInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider info");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get estimated time of arrival (ETA) for an order
    /// </summary>
    [HttpGet("{orderId}/eta")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<ActionResult> GetETA(int orderId)
    {
        try
        {
            var eta = await _customerService.GetETAAsync(orderId);
            if (eta == null)
            {
                return NotFound(new { message = "ETA not found for this order" });
            }

            return Ok(eta);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ETA");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Submit feedback for a delivery
    /// </summary>
    [HttpPost("{orderId}/feedback")]
    [Authorize(Roles = "Customer")]
    public async Task<ActionResult> SubmitFeedback(int orderId, [FromBody] FeedbackRequest request)
    {
        if (orderId <= 0)
        {
            return BadRequest(new { message = "Invalid order ID" });
        }

        if (request == null)
        {
            _logger.LogWarning("Submit feedback called with null request for OrderId={OrderId}", orderId);
            return BadRequest(new { message = "Request body is required" });
        }

        if (request.Rating < 1 || request.Rating > 5)
        {
            _logger.LogWarning("Invalid rating provided: Rating={Rating}, OrderId={OrderId}", 
                request.Rating, orderId);
            return BadRequest(new { message = "Rating must be between 1 and 5" });
        }

        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int customerId))
            {
                _logger.LogWarning("Invalid user ID claim in token");
                return Unauthorized(new { message = "Invalid authentication token" });
            }

            var result = await _customerService.SubmitFeedbackAsync(orderId, customerId, request);
            if (!result)
            {
                _logger.LogWarning("Failed to submit feedback: OrderId={OrderId}, CustomerId={CustomerId}",
                    orderId, customerId);
                return BadRequest(new { message = "Failed to submit feedback" });
            }

            _logger.LogInformation("Feedback submitted successfully: OrderId={OrderId}, CustomerId={CustomerId}, Rating={Rating}",
                orderId, customerId, request.Rating);
            return Ok(new { message = "Feedback submitted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting feedback for OrderId={OrderId}", orderId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CustomerService.Models.DTOs;
using CustomerService.Services;
using System.Security.Claims;

namespace CustomerService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(ICustomerService customerService, ILogger<CustomersController> logger)
    {
        _customerService = customerService;
        _logger = logger;
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
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int customerId))
            {
                return Unauthorized();
            }

            if (request.Rating < 1 || request.Rating > 5)
            {
                return BadRequest(new { message = "Rating must be between 1 and 5" });
            }

            var result = await _customerService.SubmitFeedbackAsync(orderId, customerId, request);
            if (!result)
            {
                return BadRequest(new { message = "Failed to submit feedback" });
            }

            return Ok(new { message = "Feedback submitted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting feedback");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}

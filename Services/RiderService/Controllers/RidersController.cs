using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RiderService.Models.DTOs;
using RiderService.Services;
using System.Security.Claims;

namespace RiderService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RidersController : ControllerBase
{
    private readonly IRiderService _riderService;
    private readonly ILogger<RidersController> _logger;

    public RidersController(IRiderService riderService, ILogger<RidersController> logger)
    {
        _riderService = riderService;
        _logger = logger;
    }

    /// <summary>
    /// Get rider by ID
    /// </summary>
    [HttpGet("{riderId}")]
    [Authorize(Roles = "Rider,Admin")]
    public async Task<ActionResult> GetRider(int riderId)
    {
        try
        {
            var rider = await _riderService.GetRiderByIdAsync(riderId);
            if (rider == null)
            {
                return NotFound(new { message = "Rider not found" });
            }

            return Ok(rider);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get rider profile with statistics
    /// </summary>
    [HttpGet("{riderId}/profile")]
    [Authorize(Roles = "Rider,Admin")]
    public async Task<ActionResult> GetRiderProfile(int riderId)
    {
        try
        {
            var profile = await _riderService.GetRiderProfileAsync(riderId);
            if (profile == null)
            {
                return NotFound(new { message = "Rider not found" });
            }

            return Ok(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider profile");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get rider orders (would integrate with Delivery Service)
    /// </summary>
    [HttpGet("{riderId}/orders")]
    [Authorize(Roles = "Rider,Admin")]
    public async Task<ActionResult> GetRiderOrders(int riderId)
    {
        try
        {
            var orders = await _riderService.GetRiderOrdersAsync(riderId);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider orders");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get or update rider availability
    /// </summary>
    [HttpGet("{riderId}/availability")]
    [Authorize(Roles = "Rider,Admin")]
    public async Task<ActionResult> GetRiderAvailability(int riderId)
    {
        try
        {
            var availability = await _riderService.GetRiderAvailabilityAsync(riderId);
            if (availability == null)
            {
                return NotFound(new { message = "Availability not found" });
            }

            return Ok(availability);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider availability");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update rider availability (Online/Offline)
    /// </summary>
    [HttpPut("{riderId}/availability")]
    [Authorize(Roles = "Rider")]
    public async Task<ActionResult> UpdateRiderAvailability(int riderId, [FromBody] UpdateAvailabilityRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized();
            }

            // Verify rider owns this account
            var rider = await _riderService.GetRiderByUserIdAsync(userId);
            if (rider == null || rider.RiderId != riderId)
            {
                return Forbid();
            }

            var availability = await _riderService.UpdateRiderAvailabilityAsync(riderId, request);
            return Ok(availability);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating rider availability");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get rider delivery history
    /// </summary>
    [HttpGet("{riderId}/history")]
    [Authorize(Roles = "Rider,Admin")]
    public async Task<ActionResult> GetRiderHistory(int riderId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        try
        {
            var earnings = await _riderService.GetRiderEarningsAsync(riderId, startDate, endDate);
            return Ok(earnings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider history");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get rider feedback
    /// </summary>
    [HttpGet("{riderId}/feedback")]
    [Authorize(Roles = "Rider,Admin")]
    public async Task<ActionResult> GetRiderFeedback(int riderId)
    {
        try
        {
            var feedback = await _riderService.GetRiderFeedbackAsync(riderId);
            return Ok(feedback);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider feedback");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using RiderService.Models.DTOs;
using RiderService.Services;

namespace RiderService.Controllers;

/// <summary>
/// Controller for managing rider operations including profile, availability, orders, and feedback.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class RidersController : ControllerBase
{
    private readonly IRiderService _riderService;
    private readonly ILogger<RidersController> _logger;

    public RidersController(IRiderService riderService, ILogger<RidersController> logger)
    {
        _riderService = riderService ?? throw new ArgumentNullException(nameof(riderService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get all riders (for admin dashboard)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> GetAllRiders()
    {
        try
        {
            var riders = await _riderService.GetAllRidersAsync();
            return Ok(riders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all riders");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get rider by ID
    /// </summary>
    [HttpGet("{riderId}")]
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
    public async Task<ActionResult> UpdateRiderAvailability(int riderId, [FromBody] UpdateAvailabilityRequest request)
    {
        if (riderId <= 0)
        {
            return BadRequest(new { message = "Invalid rider ID" });
        }

        if (request == null)
        {
            _logger.LogWarning("Update rider availability called with null request for RiderId={RiderId}", riderId);
            return BadRequest(new { message = "Request body is required" });
        }

        try
        {
            var availability = await _riderService.UpdateRiderAvailabilityAsync(riderId, request);
            if (availability == null)
            {
                return StatusCode(500, new { message = "Failed to update availability" });
            }

            _logger.LogInformation("Rider availability updated: RiderId={RiderId}, IsOnline={IsOnline}",
                riderId, request.IsOnline);
            return Ok(availability);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating rider availability for RiderId={RiderId}", riderId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get rider delivery history
    /// </summary>
    [HttpGet("{riderId}/history")]
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

    /// <summary>
    /// Seed mock data (for testing/development only)
    /// </summary>
    [HttpPost("seed")]
    public async Task<ActionResult> SeedMockData()
    {
        try
        {
            await _riderService.SeedMockDataAsync();
            return Ok(new { message = "Mock data seeded successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding mock data");
            return StatusCode(500, new { message = "An error occurred while seeding data" });
        }
    }
}

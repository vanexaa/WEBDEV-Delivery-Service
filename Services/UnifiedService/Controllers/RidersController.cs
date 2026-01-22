/*
 * UnifiedService Architecture - Rider Controller
 * 
 * This controller is part of the UnifiedService running on port 5000.
 * Benefits: Single port for all services, simpler deployment, easier debugging.
 * 
 * All rider endpoints are accessible at: http://localhost:5000/api/riders/*
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using RiderService.Models;
using RiderService.Models.DTOs;
using RiderService.Services;
using System.Linq;

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
    /// Get all riders
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> GetAllRiders()
    {
        try
        {
            _logger.LogInformation("GetAllRiders endpoint called");
            var riders = await _riderService.GetAllRidersAsync();
            _logger.LogInformation("Found {Count} riders", riders?.Count ?? 0);
            return Ok(riders ?? new List<Rider>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all riders: {Message}", ex.Message);
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all riders with availability status (for Admin dashboard)
    /// </summary>
    [HttpGet("with-availability")]
    public async Task<ActionResult> GetAllRidersWithAvailability()
    {
        try
        {
            _logger.LogInformation("GetAllRidersWithAvailability endpoint called");
            var riders = await _riderService.GetAllRidersWithAvailabilityAsync();
            _logger.LogInformation("Found {Count} riders with availability", riders?.Count ?? 0);
            return Ok(riders ?? new List<RiderWithAvailabilityDto>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all riders with availability: {Message}", ex.Message);
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
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
    /// Get rider by UserId (from AuthService)
    /// </summary>
    [HttpGet("byuser/{userId}")]
    public async Task<ActionResult> GetRiderByUserId(int userId)
    {
        try
        {
            var rider = await _riderService.GetRiderByUserIdAsync(userId);
            if (rider == null)
            {
                return NotFound(new { message = "Rider not found for this user" });
            }

            return Ok(rider);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider by userId");
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
            // Validate riderId parameter
            if (riderId <= 0)
            {
                _logger.LogWarning("Invalid riderId provided: {RiderId}", riderId);
                return BadRequest(new { message = "Invalid rider ID. RiderId must be greater than 0." });
            }

            _logger.LogInformation("GetRiderProfile called for RiderId={RiderId}", riderId);
            
            var profile = await _riderService.GetRiderProfileAsync(riderId);
            if (profile == null)
            {
                _logger.LogWarning("Rider profile not found for RiderId={RiderId}", riderId);
                return NotFound(new { message = "Rider not found" });
            }

            _logger.LogInformation("Rider profile retrieved successfully for RiderId={RiderId}", riderId);
            return Ok(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider profile for RiderId={RiderId}", riderId);
            return StatusCode(500, new { message = "An error occurred while retrieving rider profile", error = ex.Message });
        }
    }

    /// <summary>
    /// Get current rider profile from JWT token claims
    /// </summary>
    [HttpGet("profile/me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult> GetCurrentRiderProfile()
    {
        try
        {
            // Extract userId from JWT token - try multiple claim types
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                           ?? User.FindFirst("userId")?.Value
                           ?? User.FindFirst("UserId")?.Value;
            
            _logger.LogInformation("GetCurrentRiderProfile called. Available claims: {Claims}", 
                string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));
            
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                _logger.LogWarning("Unable to extract userId from JWT token. Available claims: {Claims}", 
                    string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));
                return Unauthorized(new { message = "Unable to identify user from token" });
            }

            _logger.LogInformation("GetCurrentRiderProfile - extracted UserId={UserId}", userId);

            // Get rider by userId
            var rider = await _riderService.GetRiderByUserIdAsync(userId);
            if (rider == null)
            {
                _logger.LogWarning("Rider not found for UserId={UserId}", userId);
                return NotFound(new { message = "Rider not found for this user" });
            }

            // Get profile using riderId
            var profile = await _riderService.GetRiderProfileAsync(rider.RiderId);
            if (profile == null)
            {
                _logger.LogWarning("Rider profile not found for RiderId={RiderId}", rider.RiderId);
                return NotFound(new { message = "Rider profile not found" });
            }

            _logger.LogInformation("Current rider profile retrieved successfully for RiderId={RiderId}", rider.RiderId);
            return Ok(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current rider profile");
            return StatusCode(500, new { message = "An error occurred while retrieving rider profile", error = ex.Message });
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
            // Validate riderId parameter
            if (riderId <= 0)
            {
                _logger.LogWarning("Invalid riderId provided: {RiderId}", riderId);
                return BadRequest(new { message = "Invalid rider ID. RiderId must be greater than 0." });
            }

            _logger.LogInformation("GetRiderAvailability called for RiderId={RiderId}", riderId);
            
            var availability = await _riderService.GetRiderAvailabilityAsync(riderId);
            if (availability == null)
            {
                // Return default offline status if availability record doesn't exist
                _logger.LogInformation("No availability record found for RiderId={RiderId}, returning default offline status", riderId);
                return Ok(new { 
                    riderId = riderId,
                    isOnline = false,
                    lastSeen = DateTime.UtcNow,
                    message = "Availability record not found, defaulting to offline"
                });
            }

            _logger.LogInformation("Rider availability retrieved: RiderId={RiderId}, IsOnline={IsOnline}", 
                riderId, availability.IsOnline);
            
            return Ok(new {
                riderId = availability.RiderId,
                isOnline = availability.IsOnline,
                currentLatitude = availability.CurrentLatitude,
                currentLongitude = availability.CurrentLongitude,
                lastSeen = availability.LastSeen,
                updatedAt = availability.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider availability for RiderId={RiderId}", riderId);
            return StatusCode(500, new { message = "An error occurred while retrieving availability", error = ex.Message });
        }
    }

    /// <summary>
    /// Update rider availability (Online/Offline)
    /// </summary>
    [HttpPut("{riderId}/availability")]
    public async Task<ActionResult> UpdateRiderAvailability(int riderId, [FromBody] UpdateAvailabilityRequest request)
    {
        _logger.LogInformation("UpdateRiderAvailability called: RiderId={RiderId}, Request={@Request}", riderId, request);

        // Validate riderId parameter
        if (riderId <= 0)
        {
            _logger.LogWarning("Invalid rider ID: {RiderId}", riderId);
            return BadRequest(new { message = "Invalid rider ID. RiderId must be greater than 0." });
        }

        if (request == null)
        {
            _logger.LogWarning("Update rider availability called with null request for RiderId={RiderId}", riderId);
            return BadRequest(new { message = "Request body is required" });
        }

        try
        {
            // Verify rider exists before updating
            var rider = await _riderService.GetRiderByIdAsync(riderId);
            if (rider == null)
            {
                _logger.LogWarning("Rider not found for RiderId={RiderId}", riderId);
                return NotFound(new { message = "Rider not found" });
            }

            var availability = await _riderService.UpdateRiderAvailabilityAsync(riderId, request);
            if (availability == null)
            {
                _logger.LogError("UpdateRiderAvailabilityAsync returned null for RiderId={RiderId}", riderId);
                return StatusCode(500, new { message = "Failed to update availability" });
            }

            _logger.LogInformation("Rider availability updated successfully: RiderId={RiderId}, IsOnline={IsOnline}, Latitude={Latitude}, Longitude={Longitude}",
                riderId, availability.IsOnline, availability.CurrentLatitude, availability.CurrentLongitude);
            
            // Return updated availability with location data
            return Ok(new { 
                riderId = availability.RiderId,
                isOnline = availability.IsOnline,
                currentLatitude = availability.CurrentLatitude,
                currentLongitude = availability.CurrentLongitude,
                lastSeen = availability.LastSeen,
                updatedAt = availability.UpdatedAt,
                message = $"Rider is now {(availability.IsOnline ? "online" : "offline")}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating rider availability for RiderId={RiderId}", riderId);
            return StatusCode(500, new { message = "An error occurred while updating availability", error = ex.Message });
        }
    }

    /// <summary>
    /// Get rider delivery history (deliveries with order details)
    /// </summary>
    [HttpGet("{riderId}/history")]
    public async Task<ActionResult> GetRiderHistory(int riderId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        try
        {
            var deliveryHistory = await _riderService.GetRiderDeliveryHistoryAsync(riderId, startDate, endDate);
            return Ok(deliveryHistory);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider history");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get rider earnings history
    /// </summary>
    [HttpGet("{riderId}/earnings")]
    public async Task<ActionResult> GetRiderEarnings(int riderId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        try
        {
            var earnings = await _riderService.GetRiderEarningsAsync(riderId, startDate, endDate);
            return Ok(earnings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rider earnings");
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
}

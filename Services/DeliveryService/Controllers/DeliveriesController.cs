using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DeliveryService.Models.DTOs;
using DeliveryService.Services;
using System.Security.Claims;

namespace DeliveryService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DeliveriesController : ControllerBase
{
    private readonly IDeliveryService _deliveryService;
    private readonly ILogger<DeliveriesController> _logger;

    public DeliveriesController(IDeliveryService deliveryService, ILogger<DeliveriesController> logger)
    {
        _deliveryService = deliveryService;
        _logger = logger;
    }

    /// <summary>
    /// Assign a delivery to a rider (Admin only, or auto-assign if RiderId is null)
    /// </summary>
    [HttpPost("assign")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> AssignDelivery([FromBody] AssignDeliveryRequest request)
    {
        try
        {
            var delivery = await _deliveryService.AssignDeliveryAsync(request);
            if (delivery == null)
            {
                return NotFound(new { message = "Order not found" });
            }

            return Ok(delivery);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning delivery");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get delivery by order ID
    /// </summary>
    [HttpGet("{orderId}")]
    public async Task<ActionResult> GetDeliveryByOrderId(int orderId)
    {
        try
        {
            var delivery = await _deliveryService.GetDeliveryByOrderIdAsync(orderId);
            if (delivery == null)
            {
                return NotFound(new { message = "Delivery not found" });
            }

            return Ok(delivery);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting delivery");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get active deliveries (Rider and Admin)
    /// </summary>
    [HttpGet("active")]
    [Authorize(Roles = "Rider,Admin")]
    public async Task<ActionResult> GetActiveDeliveries()
    {
        try
        {
            var deliveries = await _deliveryService.GetActiveDeliveriesAsync();
            return Ok(deliveries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active deliveries");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Reassign delivery to another rider (Admin only)
    /// </summary>
    [HttpPut("{orderId}/reassign")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> ReassignDelivery(int orderId, [FromBody] ReassignDeliveryRequest request)
    {
        try
        {
            var delivery = await _deliveryService.GetDeliveryByOrderIdAsync(orderId);
            if (delivery == null)
            {
                return NotFound(new { message = "Delivery not found" });
            }

            var updatedDelivery = await _deliveryService.ReassignDeliveryAsync(delivery.DeliveryId, request.RiderId);
            return Ok(updatedDelivery);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reassigning delivery");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update delivery status (Rider)
    /// </summary>
    [HttpPut("{orderId}/status")]
    [Authorize(Roles = "Rider,Admin")]
    public async Task<ActionResult> UpdateDeliveryStatus(int orderId, [FromBody] UpdateDeliveryStatusRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized();
            }

            var delivery = await _deliveryService.GetDeliveryByOrderIdAsync(orderId);
            if (delivery == null)
            {
                return NotFound(new { message = "Delivery not found" });
            }

            var updatedDelivery = await _deliveryService.UpdateDeliveryStatusAsync(delivery.DeliveryId, request, userId);
            return Ok(updatedDelivery);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating delivery status");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Mark delivery as failed (Rider and Admin)
    /// </summary>
    [HttpPut("{orderId}/failure")]
    [Authorize(Roles = "Rider,Admin")]
    public async Task<ActionResult> MarkDeliveryAsFailed(int orderId, [FromBody] FailureRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized();
            }

            var delivery = await _deliveryService.GetDeliveryByOrderIdAsync(orderId);
            if (delivery == null)
            {
                return NotFound(new { message = "Delivery not found" });
            }

            var updatedDelivery = await _deliveryService.MarkDeliveryAsFailedAsync(delivery.DeliveryId, request.Reason, userId);
            return Ok(updatedDelivery);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking delivery as failed");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get delivery tracking information
    /// </summary>
    [HttpGet("{orderId}/track")]
    public async Task<ActionResult> GetDeliveryTracking(int orderId)
    {
        try
        {
            var tracking = await _deliveryService.GetDeliveryTrackingAsync(orderId);
            if (tracking == null)
            {
                return NotFound(new { message = "Delivery not found" });
            }

            return Ok(tracking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting delivery tracking");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}

public class ReassignDeliveryRequest
{
    public int RiderId { get; set; }
}

public class FailureRequest
{
    public string Reason { get; set; } = string.Empty;
}
